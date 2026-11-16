import { describe, expect, it } from 'vitest';
import { readSwiftPm } from '../../src/manifests/swiftpm.js';
import { lineOf, tree } from './helpers.js';

const UNRESOLVED = (n: number): string =>
  `${n} Swift ${n === 1 ? 'package has' : 'packages have'} no resolved version (no Package.resolved, or a branch or revision requirement); recorded without a version`;

/** A Package.resolved of format 2 or 3. */
function resolved(pins: { identity: string; location: string; state: Record<string, string> }[], version = 2): string {
  return JSON.stringify({ originHash: 'abc', pins: pins.map((p) => ({ identity: p.identity, kind: 'remoteSourceControl', location: p.location, state: p.state })), version }, null, 2);
}

function manifest(deps: string[], targets: string[]): string {
  return [
    '// swift-tools-version:5.9',
    'import PackageDescription',
    '',
    'let package = Package(',
    '    name: "App",',
    '    platforms: [.iOS(.v16)],',
    '    products: [.library(name: "App", targets: ["App"])],',
    '    dependencies: [',
    ...deps.map((d) => `        ${d},`),
    '    ],',
    '    targets: [',
    ...targets.map((t) => `        ${t},`),
    '    ]',
    ')',
    '',
  ].join('\n');
}

describe('readSwiftPm', () => {
  it('reads Package.swift with a v2 resolved file', () => {
    const text = manifest(['.package(url: "https://github.com/Alamofire/Alamofire.git", from: "5.0.0")'], ['.target(name: "App", dependencies: [.product(name: "Alamofire", package: "Alamofire")])']);
    expect(lineOf(text, '.package(')).toBe(9);
    const root = tree({
      'Package.swift': text,
      'Package.resolved': resolved([{ identity: 'alamofire', location: 'https://github.com/Alamofire/Alamofire.git', state: { revision: 'f455c29', version: '5.10.2' } }]),
    });
    const r = readSwiftPm(root, ['Package.swift', 'Package.resolved']);
    expect(r.deps).toEqual([{ ecosystem: 'swift', name: 'github.com/Alamofire/Alamofire', version: '5.10.2', manifest: 'Package.swift:9' }]);
    expect(r.devSkipped).toBe(0);
    expect(r.notices).toEqual([]);
  });

  it('reads resolved format 1', () => {
    const text = manifest(['.package(name: "Kingfisher", url: "https://github.com/onevcat/Kingfisher", .upToNextMajor(from: "7.0.0"))'], ['.target(name: "App", dependencies: ["Kingfisher"])']);
    const v1 = JSON.stringify(
      {
        object: {
          pins: [
            { package: 'Kingfisher', repositoryURL: 'https://github.com/onevcat/Kingfisher.git', state: { branch: null, revision: '3ec0ab0', version: '7.12.0' } },
            { package: 'Other', repositoryURL: 'https://github.com/x/Other', state: { branch: 'main', revision: '1234567', version: null } },
          ],
        },
        version: 1,
      },
      null,
      2,
    );
    const root = tree({ 'Package.swift': text, 'Package.resolved': v1 });
    const r = readSwiftPm(root, ['Package.swift']);
    expect(r.deps).toEqual([{ ecosystem: 'swift', name: 'github.com/onevcat/Kingfisher', version: '7.12.0', manifest: `Package.swift:${lineOf(text, '.package(')}` }]);
    expect(r.notices).toEqual([]);
  });

  it('reads resolved format 3 from the nearest ancestor directory', () => {
    const text = manifest(['.package(url: "https://github.com/apple/swift-log", from: "1.5.0")'], ['.target(name: "App", dependencies: [.product(name: "Logging", package: "swift-log")])']);
    const root = tree({
      'Packages/Core/Package.swift': text,
      'Package.resolved': resolved([{ identity: 'swift-log', location: 'https://github.com/apple/swift-log.git', state: { revision: 'ce592ae', version: '1.6.4' } }], 3),
    });
    const r = readSwiftPm(root, ['Packages/Core/Package.swift']);
    expect(r.deps).toEqual([{ ecosystem: 'swift', name: 'github.com/apple/swift-log', version: '1.6.4', manifest: `Packages/Core/Package.swift:${lineOf(text, '.package(')}` }]);
  });

  it("a local package inside an Xcode app with no resolved file of its own takes the app's workspace pins", () => {
    const text = manifest(['.package(url: "https://github.com/SDWebImage/SDWebImage.git", from: "5.19.0")'], ['.target(name: "Components", dependencies: [.product(name: "SDWebImage", package: "SDWebImage")])']);
    const root = tree({
      'App/Components/Package.swift': text,
      'App/App.xcodeproj/project.pbxproj': '// !$*UTF8*$!\n{\n\tobjects = {\n\t};\n}\n',
      'App/App.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved': resolved([{ identity: 'sdwebimage', location: 'https://github.com/SDWebImage/SDWebImage.git', state: { revision: '2053b12', version: '5.21.3' } }], 3),
    });
    const r = readSwiftPm(root, ['App/Components/Package.swift']);
    expect(r.deps).toEqual([{ ecosystem: 'swift', name: 'github.com/SDWebImage/SDWebImage', version: '5.21.3', manifest: `App/Components/Package.swift:${lineOf(text, '.package(')}` }]);
    expect(r.notices).toEqual([]);
  });

  it('the Xcode pins fallback takes the nearest directory, and the first bundle in sorted order there', () => {
    const text = manifest(['.package(url: "https://github.com/a/Lib", from: "1.0.0")'], []);
    const pin = (v: string): string => resolved([{ identity: 'lib', location: 'https://github.com/a/Lib', state: { version: v } }]);
    const root = tree({
      'ios/Pkgs/Lib/Package.swift': text,
      'ios/B.xcworkspace/xcshareddata/swiftpm/Package.resolved': pin('2.0.0'),
      'ios/A.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved': pin('1.0.0'),
      // A bundle with no pins file is passed over.
      'ios/0.xcworkspace/contents.xcworkspacedata': '<Workspace/>',
      'Z.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved': pin('9.0.0'),
    });
    expect(readSwiftPm(root, ['ios/Pkgs/Lib/Package.swift']).deps.map((d) => d.version)).toEqual(['1.0.0']);
  });

  it('the Xcode pins fallback is not used when a Package.resolved sits at or above the manifest', () => {
    const text = manifest(['.package(url: "https://github.com/a/Lib", from: "1.0.0")'], []);
    const root = tree({
      'App/Lib/Package.swift': text,
      'Package.resolved': resolved([{ identity: 'other', location: 'https://github.com/a/Other', state: { version: '3.0.0' } }]),
      'App/App.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved': resolved([{ identity: 'lib', location: 'https://github.com/a/Lib', state: { version: '1.2.0' } }]),
    });
    const r = readSwiftPm(root, ['App/Lib/Package.swift']);
    expect(r.deps.map((d) => d.version)).toEqual([undefined]);
    expect(r.notices).toEqual([UNRESOLVED(1)]);
  });

  it('ssh URLs, exact versions and branch pins', () => {
    const text = manifest(
      [
        '.package(url: "git@github.com:apple/swift-nio.git", exact: "2.65.0")',
        '.package(url: "ssh://git@gitlab.example.com:2222/team/Thing.git/", .exact("1.4.0"))',
        '.package(\n            url: "https://github.com/DiscordBM/DiscordBM.git",\n            branch: "main"\n        )',
      ],
      ['.target(name: "App", dependencies: [.product(name: "NIO", package: "swift-nio"), "Thing", "DiscordBM"])'],
    );
    const root = tree({ 'Package.swift': text });
    const r = readSwiftPm(root, ['Package.swift']);
    expect(r.deps).toEqual([
      { ecosystem: 'swift', name: 'github.com/apple/swift-nio', version: '2.65.0', manifest: `Package.swift:${lineOf(text, 'swift-nio.git')}` },
      { ecosystem: 'swift', name: 'gitlab.example.com/team/Thing', version: '1.4.0', manifest: `Package.swift:${lineOf(text, 'Thing.git')}` },
      { ecosystem: 'swift', name: 'github.com/DiscordBM/DiscordBM', manifest: `Package.swift:${lineOf(text, 'DiscordBM.git') - 1}` },
    ]);
    expect(r.notices).toEqual([UNRESOLVED(1)]);
  });

  it('a branch pin in the resolved file gives no version, even beside an exact argument elsewhere', () => {
    const text = manifest(['.package(url: "https://github.com/DiscordBM/DiscordBM.git", branch: "main")', '.package(url: "https://github.com/a/B", revision: "abc123")'], []);
    const root = tree({
      'Package.swift': text,
      'Package.resolved': resolved([{ identity: 'discordbm', location: 'https://github.com/DiscordBM/DiscordBM.git', state: { branch: 'main', revision: 'b01d40b' } }]),
    });
    const r = readSwiftPm(root, ['Package.swift']);
    expect(r.deps.map((d) => [d.name, d.version])).toEqual([
      ['github.com/DiscordBM/DiscordBM', undefined],
      ['github.com/a/B', undefined],
    ]);
    expect(r.notices).toEqual([UNRESOLVED(2)]);
  });

  it('local packages are not rows', () => {
    const text = manifest(['.package(path: "../Core")', '.package(name: "Data", path: "../Data/")', '.package(url: "file:///tmp/Local", from: "1.0.0")'], ['.target(name: "App", dependencies: [.product(name: "Core", package: "Core")])']);
    const root = tree({ 'Package.swift': text });
    const r = readSwiftPm(root, ['Package.swift']);
    expect(r.deps).toEqual([]);
    expect(r.devSkipped).toBe(0);
    expect(r.notices).toEqual([]);
  });

  it('a registry package is a row named scope/name', () => {
    const text = manifest(['.package(id: "mona.LinkedList", from: "1.1.0")'], ['.target(name: "App", dependencies: [.product(name: "LinkedList", package: "mona.LinkedList")])']);
    const root = tree({
      'Package.swift': text,
      'Package.resolved': JSON.stringify({ pins: [{ identity: 'mona.linkedlist', kind: 'registry', location: '', state: { version: '1.2.0' } }], version: 2 }),
    });
    const r = readSwiftPm(root, ['Package.swift']);
    expect(r.deps).toEqual([{ ecosystem: 'swift', name: 'mona/LinkedList', version: '1.2.0', manifest: `Package.swift:${lineOf(text, '.package(')}` }]);
  });

  it('test-only products are development', () => {
    const text = manifest(
      ['.package(url: "https://github.com/Quick/Quick.git", from: "7.0.0")', '.package(url: "https://github.com/Quick/Nimble.git", from: "13.0.0")', '.package(url: "https://github.com/pointfreeco/swift-snapshot-testing", from: "1.15.0")'],
      [
        '.target(name: "App", dependencies: [.product(name: "Nimble", package: "Nimble")])',
        '.testTarget(name: "AppTests", dependencies: ["App", .product(name: "Quick", package: "quick"), .product(name: "Nimble", package: "Nimble")])',
        // A comment or a string that mentions a product is not a reference.
        '// .target(name: "Old", dependencies: [.product(name: "Quick", package: "quick")])',
        '.testTarget(name: "SnapshotTests", dependencies: [.product(name: "SnapshotTesting", package: "swift-snapshot-testing")], exclude: ["__Snapshots__/.product(name: x, package: \\"swift-snapshot-testing\\")"])',
      ],
    );
    const root = tree({ 'Package.swift': text });
    const r = readSwiftPm(root, ['Package.swift']);
    expect(r.deps.map((d) => d.name)).toEqual(['github.com/Quick/Nimble']);
    expect(r.devSkipped).toBe(2);
  });

  it('a package with no product reference at all is a row', () => {
    const text = manifest(['.package(url: "https://github.com/realm/SwiftLint", from: "0.55.0")'], ['.target(name: "App", plugins: [.plugin(name: "SwiftLintBuildToolPlugin", package: "SwiftLint")])']);
    const root = tree({ 'Package.swift': text });
    const r = readSwiftPm(root, ['Package.swift']);
    expect(r.deps.map((d) => d.name)).toEqual(['github.com/realm/SwiftLint']);
    expect(r.devSkipped).toBe(0);
  });

  it('commented-out packages, strings and raw strings do not confuse the scan', () => {
    const text = [
      '// swift-tools-version:5.9',
      'import PackageDescription',
      '/* .package(url: "https://github.com/x/Commented", from: "1.0.0") */',
      'let note = "a ) and .package(url: \\"https://github.com/x/InString\\", from: \\"1.0.0\\")"',
      'let raw = #"a "quote" and ) .package(url: "https://github.com/x/InRaw")"#',
      'let multi = """',
      '    .package(url: "https://github.com/x/InMulti", from: "1.0.0")',
      '    """',
      'let package = Package(',
      '    name: "App\\(1 + (2))",',
      '    dependencies: [',
      '        // .package(url: "https://github.com/x/LineComment", from: "1.0.0"),',
      '        .package(url: "https://github.com/x/Real", from: "1.0.0" /* ) */),',
      '    ],',
      '    targets: [.target(name: "App", dependencies: [.product(name: "Real", package: "Real")])]',
      ')',
    ].join('\n');
    const root = tree({ 'Package.swift': text });
    const r = readSwiftPm(root, ['Package.swift']);
    expect(r.deps).toEqual([{ ecosystem: 'swift', name: 'github.com/x/Real', manifest: `Package.swift:${lineOf(text, 'x/Real')}` }]);
    expect(r.notices).toEqual([UNRESOLVED(1)]);
  });

  it('only Package.swift is read: a version-specific manifest and a lone Package.resolved give no rows', () => {
    const text = manifest(['.package(url: "https://github.com/a/A", exact: "1.0.0")'], []);
    const root = tree({ 'Package@swift-5.8.swift': text, 'Package.resolved': resolved([{ identity: 'a', location: 'https://github.com/a/A', state: { version: '1.0.0' } }]) });
    const r = readSwiftPm(root, ['Package@swift-5.8.swift', 'Package.resolved']);
    expect(r).toEqual({ deps: [], devSkipped: 0, notices: [] });
  });

  it('a Package.resolved that does not parse is a notice naming it, and the row keeps no version', () => {
    const text = manifest(['.package(url: "https://github.com/a/A", from: "1.0.0")'], []);
    const root = tree({ 'Package.swift': text, 'Package.resolved': '{ "pins": [ { "identity": "a", ' });
    const r = readSwiftPm(root, ['Package.swift']);
    expect(r.deps.map((d) => d.version)).toEqual([undefined]);
    expect(r.notices[0]).toMatch(/^Package\.resolved: did not parse \(invalid JSON( at [^)]*)?\); versions from it are unavailable$/);
    expect(r.notices[1]).toBe(UNRESOLVED(1));
  });

  it('string interpolation nested past the cap is a notice, never a throw', () => {
    let lit = '"x"';
    for (let i = 0; i < 3000; i++) lit = `"\\(${lit})"`;
    const text = ['import PackageDescription', `let deep = ${lit}`, manifest(['.package(url: "https://github.com/a/A", from: "1.0.0")'], [])].join('\n');
    const root = tree({ 'Package.swift': text });
    let r: ReturnType<typeof readSwiftPm> | undefined;
    expect(() => {
      r = readSwiftPm(root, ['Package.swift']);
    }).not.toThrow();
    expect(r?.deps).toEqual([]);
    expect(r?.notices).toEqual(['Package.swift: did not parse (string interpolation nested too deep at line 2); skipped']);
  });

  it('interpolation under the cap is read', () => {
    let lit = '"x"';
    for (let i = 0; i < 100; i++) lit = `"\\(${lit})"`;
    const text = [`let deep = ${lit}`, manifest(['.package(url: "https://github.com/a/A", exact: "1.0.0")'], [])].join('\n');
    const root = tree({ 'Package.swift': text });
    expect(readSwiftPm(root, ['Package.swift']).deps.map((d) => d.name)).toEqual(['github.com/a/A']);
  });

  it('a package URL built by string interpolation is not a row, and a notice names it', () => {
    const text = manifest(['.package(url: "\\(base)/b/B", from: "1.0.0")', '.package(url: "https://github.com/a/weird(1).git", exact: "2.0.0")'], []);
    const root = tree({ 'Package.swift': text });
    const r = readSwiftPm(root, ['Package.swift']);
    expect(r.deps).toEqual([{ ecosystem: 'swift', name: 'github.com/a/weird(1)', version: '2.0.0', manifest: `Package.swift:${lineOf(text, 'weird(1)')}` }]);
    expect(r.notices).toEqual([`Package.swift:${lineOf(text, '(base)')}: a package URL built by string interpolation is not read`]);
  });

  it('a Package.resolved with a byte-order mark is read', () => {
    const text = manifest(['.package(url: "https://github.com/a/A", from: "1.0.0")'], []);
    const root = tree({ 'Package.swift': text, 'Package.resolved': `\ufeff${resolved([{ identity: 'a', location: 'https://github.com/a/A', state: { version: '1.4.0' } }])}` });
    const r = readSwiftPm(root, ['Package.swift']);
    expect(r.deps.map((d) => d.version)).toEqual(['1.4.0']);
    expect(r.notices).toEqual([]);
  });

  it('the Xcode pins fallback reads a bundle in the manifest directory itself, and at the repository root', () => {
    const text = manifest(['.package(url: "https://github.com/a/Lib", from: "1.0.0")'], []);
    const pin = (v: string): string => resolved([{ identity: 'lib', location: 'https://github.com/a/Lib', state: { version: v } }]);
    const own = tree({
      'App/Package.swift': text,
      'App/App.xcworkspace/xcshareddata/swiftpm/Package.resolved': pin('1.1.0'),
      'Root.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved': pin('9.0.0'),
    });
    expect(readSwiftPm(own, ['App/Package.swift']).deps.map((d) => d.version)).toEqual(['1.1.0']);
    const atRoot = tree({ 'Package.swift': text, 'Root.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved': pin('1.2.0') });
    expect(readSwiftPm(atRoot, ['Package.swift']).deps.map((d) => d.version)).toEqual(['1.2.0']);
  });

  it('an unterminated .package( call is a notice naming the manifest', () => {
    const text = ['import PackageDescription', 'let package = Package(', '  dependencies: [', '    .package(url: "https://github.com/a/A", from: "1.0.0"', ''].join('\n');
    const root = tree({ 'Package.swift': text });
    const r = readSwiftPm(root, ['Package.swift']);
    expect(r.deps).toEqual([]);
    expect(r.notices).toEqual(['Package.swift: did not parse (unbalanced parentheses at line 4); skipped']);
  });

  it('a package URL that is not a string literal is not a row, and a notice names it (final review minor 2)', () => {
    const text = manifest(
      ['.package(url: base, from: "1.0.0")', '.package(url: root + "/b/B", from: "1.0.0")', '.package(url: "https://github.com/a/A" /* pinned */, exact: "1.0.0")'],
      [],
    );
    const r = readSwiftPm(tree({ 'Package.swift': text }), ['Package.swift']);
    expect(r.deps).toEqual([{ ecosystem: 'swift', name: 'github.com/a/A', version: '1.0.0', manifest: `Package.swift:${lineOf(text, 'a/A')}` }]);
    expect(r.notices).toEqual([
      `Package.swift:${lineOf(text, 'url: base')}: a package URL that is not a string literal is not read`,
      `Package.swift:${lineOf(text, 'url: root')}: a package URL that is not a string literal is not read`,
    ]);
  });

  it('nested .package( calls cost time in proportion to the file (final review I-3)', () => {
    // Each call once rescanned the rest of the file for its closing parenthesis and again for its arguments:
    // 20,000 nested calls took 9.4 s, and 50,000 took 47.9 s.
    const root = tree({ 'Package.swift': `${'.package('.repeat(50000)}${')'.repeat(50000)}\n` });
    const t0 = Date.now();
    const r = readSwiftPm(root, ['Package.swift']);
    expect(Date.now() - t0).toBeLessThan(5000);
    expect(r.deps).toEqual([]);
    expect(r.notices).toEqual([]);
  });

  it('many packages and product references cost time in proportion to the file', () => {
    // Finding each argument's string, and each package's references, once searched every string and every
    // reference: 20,000 packages each named by a product took 6.2 s, and the time grows with the square.
    const n = 40000;
    const deps = Array.from({ length: n }, (_, i) => `.package(url: "https://github.com/o${i}/r${i}.git", from: "1.0.0")`);
    const products = Array.from({ length: n }, (_, i) => `.product(name: "R${i}", package: "r${i}")`).join(', ');
    const text = manifest(deps, [`.target(name: "App", dependencies: [${products}])`, '.testTarget(name: "AppTests", dependencies: [.product(name: "R0", package: "r0")])']);
    const root = tree({ 'Package.swift': text });
    const t0 = Date.now();
    const r = readSwiftPm(root, ['Package.swift']);
    expect(Date.now() - t0).toBeLessThan(5000);
    expect(r.deps).toHaveLength(n);
    expect(r.devSkipped).toBe(0);
  });

  it('a product inside an outer test target is a test reference even after a nested call closes', () => {
    const text = manifest(
      ['.package(url: "https://github.com/a/A", from: "1.0.0")', '.package(url: "https://github.com/b/B", from: "1.0.0")'],
      [
        '.testTarget(name: "T", dependencies: [.testTarget(name: "Inner"), .product(name: "A", package: "A")], resources: [.process(x(y))])',
        '.target(name: "App", dependencies: [.product(name: "B", package: "B")])',
      ],
    );
    const r = readSwiftPm(tree({ 'Package.swift': text }), ['Package.swift']);
    expect(r.deps.map((d) => d.name)).toEqual(['github.com/b/B']);
    expect(r.devSkipped).toBe(1);
  });
});

// ---- Xcode projects (Review Focus 3) ---------------------------------------------------------

function pbxproj(): string {
  return [
    '// !$*UTF8*$!',
    '{',
    '\tarchiveVersion = 1;',
    '\tclasses = {',
    '\t};',
    '\tobjectVersion = 60;',
    '\tobjects = {',
    '',
    '/* Begin PBXNativeTarget section */',
    '\t\tT1000000 /* App */ = {',
    '\t\t\tisa = PBXNativeTarget;',
    '\t\t\tname = App;',
    '\t\t\tpackageProductDependencies = (',
    '\t\t\t\tD1000000 /* Alamofire */,',
    '\t\t\t\tD3000000 /* LocalKit */,',
    '\t\t\t);',
    '\t\t\tproductType = "com.apple.product-type.application";',
    '\t\t};',
    '\t\tT2000000 /* AppTests */ = {',
    '\t\t\tisa = PBXNativeTarget;',
    '\t\t\tname = AppTests;',
    '\t\t\tpackageProductDependencies = (',
    '\t\t\t\tD2000000 /* ViewInspector */,',
    '\t\t\t);',
    '\t\t\tproductType = "com.apple.product-type.bundle.unit-test";',
    '\t\t};',
    '/* End PBXNativeTarget section */',
    '',
    '/* Begin PBXProject section */',
    '\t\tP0000000 /* Project object */ = {',
    '\t\t\tisa = PBXProject;',
    '\t\t\tpackageReferences = (',
    '\t\t\t\tR1000000 /* XCRemoteSwiftPackageReference "Alamofire" */,',
    '\t\t\t\tR2000000 /* XCRemoteSwiftPackageReference "ViewInspector" */,',
    '\t\t\t\tL3000000 /* XCLocalSwiftPackageReference "LocalKit" */,',
    '\t\t\t);',
    '\t\t\ttargets = (',
    '\t\t\t\tT1000000 /* App */,',
    '\t\t\t\tT2000000 /* AppTests */,',
    '\t\t\t);',
    '\t\t};',
    '/* End PBXProject section */',
    '',
    '/* Begin XCLocalSwiftPackageReference section */',
    '\t\tL3000000 /* XCLocalSwiftPackageReference "LocalKit" */ = {',
    '\t\t\tisa = XCLocalSwiftPackageReference;',
    '\t\t\trelativePath = LocalKit;',
    '\t\t};',
    '/* End XCLocalSwiftPackageReference section */',
    '',
    '/* Begin XCRemoteSwiftPackageReference section */',
    '\t\tR1000000 /* XCRemoteSwiftPackageReference "Alamofire" */ = {',
    '\t\t\tisa = XCRemoteSwiftPackageReference;',
    '\t\t\trepositoryURL = "https://github.com/Alamofire/Alamofire.git";',
    '\t\t\trequirement = {',
    '\t\t\t\tkind = upToNextMajorVersion;',
    '\t\t\t\tminimumVersion = 5.0.0;',
    '\t\t\t};',
    '\t\t};',
    '\t\tR2000000 /* XCRemoteSwiftPackageReference "ViewInspector" */ = {',
    '\t\t\tisa = XCRemoteSwiftPackageReference;',
    '\t\t\trepositoryURL = "https://github.com/nalexn/ViewInspector";',
    '\t\t\trequirement = {',
    '\t\t\t\tkind = upToNextMajorVersion;',
    '\t\t\t\tminimumVersion = 0.10.0;',
    '\t\t\t};',
    '\t\t};',
    '/* End XCRemoteSwiftPackageReference section */',
    '',
    '/* Begin XCSwiftPackageProductDependency section */',
    '\t\tD1000000 /* Alamofire */ = {',
    '\t\t\tisa = XCSwiftPackageProductDependency;',
    '\t\t\tpackage = R1000000 /* XCRemoteSwiftPackageReference "Alamofire" */;',
    '\t\t\tproductName = Alamofire;',
    '\t\t};',
    '\t\tD2000000 /* ViewInspector */ = {',
    '\t\t\tisa = XCSwiftPackageProductDependency;',
    '\t\t\tpackage = R2000000 /* XCRemoteSwiftPackageReference "ViewInspector" */;',
    '\t\t\tproductName = ViewInspector;',
    '\t\t};',
    '\t\tD3000000 /* LocalKit */ = {',
    '\t\t\tisa = XCSwiftPackageProductDependency;',
    '\t\t\tproductName = LocalKit;',
    '\t\t};',
    '/* End XCSwiftPackageProductDependency section */',
    '\t};',
    '\trootObject = P0000000 /* Project object */;',
    '}',
    '',
  ].join('\n');
}

const XCODE_PINS = resolved(
  [
    { identity: 'alamofire', location: 'https://github.com/Alamofire/Alamofire.git', state: { revision: 'f455c29', version: '5.10.2' } },
    { identity: 'viewinspector', location: 'https://github.com/nalexn/ViewInspector', state: { revision: '0a1b2c3', version: '0.10.1' } },
  ],
  3,
);

describe('readSwiftPm: Xcode projects', () => {
  it("an Xcode project's packages", () => {
    const text = pbxproj();
    const root = tree({
      'App.xcodeproj/project.pbxproj': text,
      'App.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved': XCODE_PINS,
    });
    const r = readSwiftPm(root, ['App.xcodeproj/project.pbxproj']);
    expect(r.deps).toEqual([{ ecosystem: 'swift', name: 'github.com/Alamofire/Alamofire', version: '5.10.2', manifest: `App.xcodeproj/project.pbxproj:${lineOf(text, 'Alamofire/Alamofire.git')}` }]);
    expect(r.devSkipped).toBe(1);
    expect(r.notices).toEqual([]);
  });

  it('pins from the first workspace beside the project, in sorted order, then an exactVersion requirement', () => {
    const text = pbxproj().replace('kind = upToNextMajorVersion;\n\t\t\t\tminimumVersion = 5.0.0;', 'kind = exactVersion;\n\t\t\t\tversion = 5.9.0;');
    const workspacePins = resolved([{ identity: 'alamofire', location: 'https://github.com/Alamofire/Alamofire.git', state: { version: '5.10.0' } }]);
    const a = tree({
      'ios/App.xcodeproj/project.pbxproj': text,
      'ios/B.xcworkspace/xcshareddata/swiftpm/Package.resolved': resolved([{ identity: 'alamofire', location: 'x', state: { version: '1.0.0' } }]),
      'ios/A.xcworkspace/xcshareddata/swiftpm/Package.resolved': workspacePins,
    });
    expect(readSwiftPm(a, ['ios/App.xcodeproj/project.pbxproj']).deps.map((d) => d.version)).toEqual(['5.10.0']);
    const b = tree({ 'ios/App.xcodeproj/project.pbxproj': text });
    const rb = readSwiftPm(b, ['ios/App.xcodeproj/project.pbxproj']);
    expect(rb.deps.map((d) => d.version)).toEqual(['5.9.0']);
    expect(rb.notices).toEqual([]);
  });

  it('a package used by an application target and a test target is a row; a ui-testing-only one is development', () => {
    const text = pbxproj()
      .replace('\t\t\t\tD2000000 /* ViewInspector */,\n', '\t\t\t\tD2000000 /* ViewInspector */,\n\t\t\t\tD1000000 /* Alamofire */,\n')
      .replace('com.apple.product-type.bundle.unit-test', 'com.apple.product-type.bundle.ui-testing');
    const root = tree({ 'App.xcodeproj/project.pbxproj': text });
    const r = readSwiftPm(root, ['App.xcodeproj/project.pbxproj']);
    expect(r.deps.map((d) => d.name)).toEqual(['github.com/Alamofire/Alamofire']);
    expect(r.devSkipped).toBe(1);
    expect(r.notices).toEqual([UNRESOLVED(1)]);
  });

  it('a package no target lists is a row', () => {
    const text = pbxproj().replace('\t\t\t\tD2000000 /* ViewInspector */,\n', '');
    const root = tree({ 'App.xcodeproj/project.pbxproj': text, 'App.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved': XCODE_PINS });
    const r = readSwiftPm(root, ['App.xcodeproj/project.pbxproj']);
    expect(r.deps.map((d) => [d.name, d.version])).toEqual([
      ['github.com/Alamofire/Alamofire', '5.10.2'],
      ['github.com/nalexn/ViewInspector', '0.10.1'],
    ]);
    expect(r.devSkipped).toBe(0);
  });

  it('a pbxproj nested past the cap is a notice naming it, never a throw', () => {
    const root = tree({ 'App.xcodeproj/project.pbxproj': `// !$*UTF8*$!\n{ a = ${'('.repeat(20000)}x${')'.repeat(20000)}; }\n` });
    let r: ReturnType<typeof readSwiftPm> | undefined;
    expect(() => {
      r = readSwiftPm(root, ['App.xcodeproj/project.pbxproj']);
    }).not.toThrow();
    expect(r?.deps).toEqual([]);
    expect(r?.notices).toHaveLength(1);
    expect(r?.notices[0]).toMatch(/^App\.xcodeproj\/project\.pbxproj: did not parse \(invalid OpenStep plist at line 2, column \d+\); skipped$/);
  });

  it('a pbxproj that does not parse is a notice naming it', () => {
    const root = tree({
      'App.xcodeproj/project.pbxproj': '// !$*UTF8*$!\n{\n\tobjects = {\n\t\tR1 = { isa = XCRemoteSwiftPackageReference; repositoryURL = "https://github.com/a/A"\n',
      'Bin.xcodeproj/project.pbxproj': 'bplist00\u0000\u0001',
      'Xml.xcodeproj/project.pbxproj': '<?xml version="1.0" encoding="UTF-8"?>\n<plist version="1.0"><dict/></plist>\n',
    });
    const r = readSwiftPm(root, ['App.xcodeproj/project.pbxproj', 'Bin.xcodeproj/project.pbxproj', 'Xml.xcodeproj/project.pbxproj']);
    expect(r.deps).toEqual([]);
    expect(r.notices).toHaveLength(3);
    expect(r.notices[0]).toMatch(/^App\.xcodeproj\/project\.pbxproj: did not parse \(invalid OpenStep plist at line \d+, column \d+\); skipped$/);
    expect(r.notices[1]).toBe('Bin.xcodeproj/project.pbxproj: is a binary plist, which lexcode does not read; skipped');
    expect(r.notices[2]).toBe('Xml.xcodeproj/project.pbxproj: is an XML plist, which lexcode does not read; skipped');
  });
});
