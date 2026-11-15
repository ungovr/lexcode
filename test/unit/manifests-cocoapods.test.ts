import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { collectDeps } from '../../src/commands/deps.js';
import { scan } from '../../src/commands/scan.js';
import { readCocoapods } from '../../src/manifests/cocoapods.js';
import { makeRuleSet } from '../helpers/ruleset.js';
import { lineOf, tree } from './helpers.js';

const STUB = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'stubs', 'fake-opengrep.mjs');

const UNRESOLVED = (n: number): string =>
  `${n} CocoaPods ${n === 1 ? 'dependency has' : 'dependencies have'} no resolved version (no Podfile.lock, and no exact version in the Podfile); recorded without a version`;

const CARTHAGE = (n: number): string =>
  `Cartfile.resolved names ${n} Carthage dependencies; lexcode does not read Carthage, so they are missing from this record`;

/** A Podfile.lock as `pod install` writes it, DEPENDENCIES on lines 12 and 13. */
const LOCK = [
  'PODS:', //                                            1
  '  - Alamofire (5.10.2)', //                           2
  '  - Firebase/Analytics (10.29.0):', //                3
  '    - Firebase/Core', //                              4
  '    - FirebaseAnalytics (~> 10.29.0)', //             5
  '  - Firebase/Core (10.29.0):', //                     6
  '    - Firebase/CoreOnly', //                          7
  '    - FirebaseAnalytics (~> 10.29.0)', //             8
  '  - Firebase/CoreOnly (10.29.0)', //                  9
  '  - FirebaseAnalytics (10.29.0)', //                  10
  'DEPENDENCIES:', //                                    11
  '  - Alamofire (~> 5.4)', //                           12
  '  - Firebase/Analytics', //                           13
  '',
  'SPEC REPOS:',
  '  trunk:',
  '    - Alamofire',
  '    - Firebase',
  '    - FirebaseAnalytics',
  '',
  'SPEC CHECKSUMS:',
  '  Alamofire: 7193b3b92c74a07f85569e1a6c4f4237291e7496',
  '  Firebase: 98e6bf5278170668a7983e12971a66b2cd57fc8c',
  '  FirebaseAnalytics: 1a5ad75876257318ba5fdc6bf7aae73b6e98d0cc',
  '',
  'PODFILE CHECKSUM: 0b9d2b5b5d1a5c6c2b8a3e2d1f0e9d8c7b6a5f4e',
  '',
  'COCOAPODS: 1.15.2',
  '',
].join('\n');

describe('readCocoapods', () => {
  it('reads DEPENDENCIES with versions from PODS', () => {
    const root = tree({ 'Podfile.lock': LOCK });
    const r = readCocoapods(root, ['Podfile.lock']);
    expect(r.deps).toEqual([
      { ecosystem: 'cocoapods', name: 'Alamofire', version: '5.10.2', manifest: 'Podfile.lock:12' },
      { ecosystem: 'cocoapods', name: 'Firebase/Analytics', version: '10.29.0', manifest: 'Podfile.lock:13' },
    ]);
    expect(r.devSkipped).toBe(0);
    expect(r.notices).toEqual([]);
  });

  it('reads a lock in a subdirectory, and a quoted entry', () => {
    const lock = [
      'PODS:',
      '  - "GoogleUtilities/Environment (7.13.3)":',
      '    - GoogleUtilities/Privacy',
      '  - GoogleUtilities/Privacy (7.13.3)',
      '',
      'DEPENDENCIES:',
      '  - "GoogleUtilities/Environment (~> 7.8)"',
      '',
      'COCOAPODS: 1.15.2',
      '',
    ].join('\n');
    const r = readCocoapods(tree({ 'ios/Podfile.lock': lock }), ['ios/Podfile.lock']);
    expect(r.deps).toEqual([{ ecosystem: 'cocoapods', name: 'GoogleUtilities/Environment', version: '7.13.3', manifest: 'ios/Podfile.lock:7' }]);
    expect(r.notices).toEqual([]);
  });

  it('a constraint is never the version', () => {
    const lock = [
      'PODS:',
      '  - Kingfisher (7.12.0)',
      '',
      'DEPENDENCIES:',
      '  - Alamofire (~> 5.4)',
      '  - Kingfisher (= 7.12.0)',
      '  - SnapKit (from `https://github.com/SnapKit/SnapKit.git`, tag `5.7.1`)',
      '',
      'COCOAPODS: 1.15.2',
      '',
    ].join('\n');
    const r = readCocoapods(tree({ 'Podfile.lock': lock }), ['Podfile.lock']);
    expect(r.deps).toEqual([
      { ecosystem: 'cocoapods', name: 'Alamofire', manifest: 'Podfile.lock:5' },
      { ecosystem: 'cocoapods', name: 'Kingfisher', version: '7.12.0', manifest: 'Podfile.lock:6' },
      { ecosystem: 'cocoapods', name: 'SnapKit', manifest: 'Podfile.lock:7' },
    ]);
    expect(r.notices).toEqual([UNRESOLVED(2)]);
  });

  describe('test-only pods are development', () => {
    const lock = [
      'PODS:',
      '  - Alamofire (5.10.2)',
      '  - Nimble (13.3.0)',
      '  - Quick (7.6.0)',
      '',
      'DEPENDENCIES:',
      '  - Alamofire (~> 5.4)',
      '  - Nimble',
      '  - Quick',
      '',
      'COCOAPODS: 1.15.2',
      '',
    ].join('\n');

    it('a test target inside the app target', () => {
      const podfile = [
        "platform :ios, '15.0'",
        '',
        "target 'App' do",
        '  use_frameworks!',
        "  pod 'Alamofire', '~> 5.4'",
        '',
        "  target 'AppTests' do",
        '    inherit! :search_paths',
        "    pod 'Quick'",
        '  end',
        '',
        "  target 'AppUITests' do",
        "    pod 'Nimble'",
        '  end',
        'end',
        '',
        'post_install do |installer|',
        '  installer.pods_project.targets.each do |target|',
        '    target.build_configurations.each do |config|',
        "      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.0'",
        '    end',
        '  end',
        'end',
        '',
      ].join('\n');
      const r = readCocoapods(tree({ Podfile: podfile, 'Podfile.lock': lock }), ['Podfile', 'Podfile.lock']);
      expect(r.deps).toEqual([{ ecosystem: 'cocoapods', name: 'Alamofire', version: '5.10.2', manifest: 'Podfile.lock:7' }]);
      expect(r.devSkipped).toBe(2);
      expect(r.notices).toEqual([]);
    });

    it('a test target beside the app target', () => {
      const podfile = [
        "target 'App' do",
        "  pod 'Alamofire'",
        'end',
        '',
        "target 'AppTests' do",
        "  pod 'Quick' # specs",
        'end',
        '',
      ].join('\n');
      const lock2 = lock.replace('  - Nimble\n', '').replace('  - Nimble (13.3.0)\n', '');
      const r = readCocoapods(tree({ Podfile: podfile, 'Podfile.lock': lock2 }), ['Podfile', 'Podfile.lock']);
      expect(r.deps.map((d) => d.name)).toEqual(['Alamofire']);
      expect(r.devSkipped).toBe(1);
    });

    it('a pod declared in both an app target and a test target is a row', () => {
      const podfile = [
        "target 'App' do",
        "  pod 'Alamofire'",
        "  pod 'Quick'",
        'end',
        '',
        "target 'AppTests' do",
        "  pod 'Quick'",
        "  pod 'Nimble'",
        'end',
        '',
      ].join('\n');
      const r = readCocoapods(tree({ Podfile: podfile, 'Podfile.lock': lock }), ['Podfile', 'Podfile.lock']);
      expect(r.deps.map((d) => d.name)).toEqual(['Alamofire', 'Quick']);
      expect(r.devSkipped).toBe(1);
    });

    it('a pod outside every target, in an abstract target or in a method is not development', () => {
      const podfile = [
        "pod 'Quick'",
        '',
        "abstract_target 'Shared' do",
        "  pod 'Nimble'",
        "  target 'AppTests' do",
        '  end',
        'end',
        '',
        'def app_pods',
        "  pod 'Alamofire'",
        'end',
        '',
        "target 'AppTests' do",
        '  app_pods',
        'end',
        '',
      ].join('\n');
      const r = readCocoapods(tree({ Podfile: podfile, 'Podfile.lock': lock }), ['Podfile', 'Podfile.lock']);
      expect(r.deps.map((d) => d.name)).toEqual(['Alamofire', 'Nimble', 'Quick']);
      expect(r.devSkipped).toBe(0);
    });

    it('a target name only counts as a test target when it ends in Tests', () => {
      const podfile = ["target 'Contests' do", "  pod 'Alamofire'", "  pod 'Nimble'", "  pod 'Quick'", 'end', ''].join('\n');
      const r = readCocoapods(tree({ Podfile: podfile, 'Podfile.lock': lock }), ['Podfile', 'Podfile.lock']);
      expect(r.deps).toHaveLength(3);
      expect(r.devSkipped).toBe(0);
    });

    it('a subspec takes the target of a line naming its pod', () => {
      const lockSub = [
        'PODS:',
        '  - Firebase/Analytics (10.29.0)',
        '  - Firebase/Crashlytics (10.29.0)',
        '  - OHHTTPStubs/Swift (9.1.0)',
        '',
        'DEPENDENCIES:',
        '  - Firebase/Analytics',
        '  - Firebase/Crashlytics',
        '  - OHHTTPStubs/Swift',
        '',
        'COCOAPODS: 1.15.2',
        '',
      ].join('\n');
      const podfile = [
        "target 'App' do",
        "  pod 'Firebase', :subspecs => ['Analytics', 'Crashlytics']",
        'end',
        "target 'AppTests' do",
        "  pod 'OHHTTPStubs/Swift'",
        'end',
        '',
      ].join('\n');
      const r = readCocoapods(tree({ Podfile: podfile, 'Podfile.lock': lockSub }), ['Podfile', 'Podfile.lock']);
      expect(r.deps.map((d) => d.name)).toEqual(['Firebase/Analytics', 'Firebase/Crashlytics']);
      expect(r.devSkipped).toBe(1);
    });
  });

  it('a Podfile with no lock', () => {
    const podfile = [
      "source 'https://cdn.cocoapods.org/'",
      "platform :ios, '15.0'",
      '',
      "target 'App' do",
      "  pod 'SnapKit', '5.7.1'",
      "  pod 'Kingfisher', '~> 7.0'",
      "  pod 'Alamofire', '= 5.10.2'",
      "  pod 'Moya',",
      "    '15.0.0'",
      "  pod 'Charts', :git => 'https://github.com/danielgindi/Charts.git', :tag => 'v5.1.0'",
      '',
      "  target 'AppTests' do",
      "    pod 'Quick', '7.6.0'",
      '  end',
      'end',
      '',
    ].join('\n');
    const r = readCocoapods(tree({ Podfile: podfile }), ['Podfile']);
    expect(r.deps).toEqual([
      { ecosystem: 'cocoapods', name: 'SnapKit', version: '5.7.1', manifest: `Podfile:${lineOf(podfile, "'SnapKit'")}` },
      { ecosystem: 'cocoapods', name: 'Kingfisher', manifest: `Podfile:${lineOf(podfile, "'Kingfisher'")}` },
      { ecosystem: 'cocoapods', name: 'Alamofire', version: '5.10.2', manifest: `Podfile:${lineOf(podfile, "'Alamofire'")}` },
      { ecosystem: 'cocoapods', name: 'Moya', version: '15.0.0', manifest: `Podfile:${lineOf(podfile, "'Moya'")}` },
      { ecosystem: 'cocoapods', name: 'Charts', manifest: `Podfile:${lineOf(podfile, "'Charts'")}` },
    ]);
    expect(r.devSkipped).toBe(1);
    expect(r.notices).toEqual([UNRESOLVED(2)]);
  });

  it('a Podfile with no lock: the brief case, one notice', () => {
    const podfile = ["target 'App' do", "  pod 'SnapKit', '5.7.1'", "  pod 'Kingfisher', '~> 7.0'", 'end', ''].join('\n');
    const r = readCocoapods(tree({ Podfile: podfile }), ['Podfile']);
    expect(r.deps).toEqual([
      { ecosystem: 'cocoapods', name: 'SnapKit', version: '5.7.1', manifest: 'Podfile:2' },
      { ecosystem: 'cocoapods', name: 'Kingfisher', manifest: 'Podfile:3' },
    ]);
    expect(r.notices).toEqual([UNRESOLVED(1)]);
  });

  it('Carthage is named, not read', () => {
    const cartfile = ['github "Alamofire/Alamofire" "5.10.2"', 'github "onevcat/Kingfisher" "7.12.0"', 'binary "https://dl.google.com/firebase/ios/carthage/FirebaseAnalyticsBinary.json" "10.29.0"', ''].join('\n');
    const r = readCocoapods(tree({ 'Cartfile.resolved': cartfile, Cartfile: 'github "Alamofire/Alamofire" ~> 5.4\n' }), ['Cartfile', 'Cartfile.resolved']);
    expect(r.deps).toEqual([]);
    expect(r.devSkipped).toBe(0);
    expect(r.notices).toEqual([CARTHAGE(3)]);
  });

  it('a Cartfile.resolved below the root is named by its path', () => {
    const r = readCocoapods(tree({ 'ios/Cartfile.resolved': 'github "Alamofire/Alamofire" "5.10.2"\n' }), ['ios/Cartfile.resolved']);
    expect(r.notices).toEqual(['ios/Cartfile.resolved names 1 Carthage dependency; lexcode does not read Carthage, so it is missing from this record']);
  });

  it('a lock that does not parse is a notice', () => {
    const bad = ['PODS:', '  - Alamofire (5.10.2)', 'DEPENDENCIES: [', '  - Alamofire', ''].join('\n');
    let r: ReturnType<typeof readCocoapods> | undefined;
    expect(() => {
      r = readCocoapods(tree({ 'Podfile.lock': bad }), ['Podfile.lock']);
    }).not.toThrow();
    expect(r?.deps).toEqual([]);
    expect(r?.notices).toHaveLength(1);
    expect(r?.notices[0]).toMatch(/^Podfile\.lock: did not parse \(invalid YAML( at [^)]*)?\); versions from it are unavailable$/);
  });

  it('a lock with a merge conflict, or with no PODS or DEPENDENCIES, is a notice, and the Podfile beside it is read', () => {
    const conflict = ['PODS:', '<<<<<<< HEAD', '  - Alamofire (5.10.2)', '=======', '  - Alamofire (5.9.1)', '>>>>>>> main', ''].join('\n');
    const podfile = ["target 'App' do", "  pod 'Alamofire', '5.10.2'", 'end', ''].join('\n');
    const r = readCocoapods(tree({ Podfile: podfile, 'Podfile.lock': conflict }), ['Podfile', 'Podfile.lock']);
    expect(r.deps).toEqual([{ ecosystem: 'cocoapods', name: 'Alamofire', version: '5.10.2', manifest: 'Podfile:2' }]);
    expect(r.notices).toHaveLength(1);
    expect(r.notices[0]).toMatch(/^Podfile\.lock: did not parse \(a merge conflict marker on line 2\); versions from it are unavailable$/);

    const r2 = readCocoapods(tree({ 'Podfile.lock': 'COCOAPODS: 1.15.2\n' }), ['Podfile.lock']);
    expect(r2.deps).toEqual([]);
    expect(r2.notices).toEqual(['Podfile.lock: did not parse (no PODS or DEPENDENCIES section); versions from it are unavailable']);
  });

  it('a parse error never quotes the lock', () => {
    const bad = ['PODS:', '  - SecretPod (1.0.0)', 'DEPENDENCIES: "unterminated sk-live-abc123', ''].join('\n');
    const r = readCocoapods(tree({ 'Podfile.lock': bad }), ['Podfile.lock']);
    expect(r.notices).toHaveLength(1);
    expect(r.notices[0]).not.toContain('sk-live');
    expect(r.notices[0]).not.toContain('SecretPod');
  });

  it('ignores files that are not CocoaPods or Carthage manifests', () => {
    const r = readCocoapods(tree({ 'Podfile.lock.bak': LOCK, 'Gemfile.lock': 'GEM\n' }), ['Podfile.lock.bak', 'Gemfile.lock']);
    expect(r).toEqual({ deps: [], devSkipped: 0, notices: [] });
  });
});

describe('the cocoapods reader is registered', () => {
  const files = (): string => {
    const lock = ['PODS:', '  - Alamofire (5.10.2)', '  - Quick (7.6.0)', '', 'DEPENDENCIES:', '  - Alamofire', '  - Kingfisher', '  - Quick', '', 'COCOAPODS: 1.15.2', ''].join('\n');
    const podfile = ["target 'App' do", "  pod 'Alamofire'", "  pod 'Kingfisher'", 'end', "target 'AppTests' do", "  pod 'Quick'", 'end', ''].join('\n');
    return tree({ 'ios/Podfile': podfile, 'ios/Podfile.lock': lock });
  };

  it('by scan', async () => {
    const rec = await scan({ root: files(), rulesDirs: [], rs: makeRuleSet(), enginePath: STUB, includeTests: false, snippets: false });
    expect(rec.scope.dev_dependencies_skipped).toBe(1);
    expect(rec.notices).toContain(UNRESOLVED(1));
  });

  it('by deps', () => {
    const root = files();
    const rows = collectDeps([root], makeRuleSet());
    // deps names each manifest line with the repository it was read from.
    expect(rows.filter((r) => r.ecosystem === 'cocoapods').map((r) => [r.name, r.manifests])).toEqual([
      ['Alamofire', [`${root}:ios/Podfile.lock:6`]],
      ['Kingfisher', [`${root}:ios/Podfile.lock:7`]],
    ]);
  });
});

describe('readCocoapods: lock edge forms and nested blocks', () => {
  it('keeps + and . in a name, and an external-source pod takes its PODS version, never its from clause', () => {
    const lock = [
      'PODS:', //                                                   1
      '  - "gRPC-C++ (1.69.0)":', //                                2
      '    - "gRPC-C++/Implementation (= 1.69.0)"', //              3
      '  - MyLocal (0.1.0)', //                                     4
      '  - Socket.IO-Client-Swift (16.0.1):', //                    5
      '    - Starscream (~> 4.0.6)', //                             6
      '  - Starscream (4.0.8)', //                                  7
      '', //                                                        8
      'DEPENDENCIES:', //                                           9
      '  - "gRPC-C++ (~> 1.69)"', //                                10
      '  - MyLocal (from `../MyLocal`)', //                         11
      '  - Socket.IO-Client-Swift (>= 16.0)', //                    12
      '', //                                                        13
      'EXTERNAL SOURCES:',
      '  MyLocal:',
      '    :path: "../MyLocal"',
      '',
      'COCOAPODS: 1.15.2',
      '',
    ].join('\r\n');
    const r = readCocoapods(tree({ 'Podfile.lock': lock }), ['Podfile.lock']);
    expect(r.deps).toEqual([
      { ecosystem: 'cocoapods', name: 'gRPC-C++', version: '1.69.0', manifest: 'Podfile.lock:10' },
      { ecosystem: 'cocoapods', name: 'MyLocal', version: '0.1.0', manifest: 'Podfile.lock:11' },
      { ecosystem: 'cocoapods', name: 'Socket.IO-Client-Swift', version: '16.0.1', manifest: 'Podfile.lock:12' },
    ]);
    expect(r.notices).toEqual([]);
  });

  it('a subspec with no PODS entry of its own takes its pod version', () => {
    const lock = ['PODS:', '  - Firebase (10.29.0)', '', 'DEPENDENCIES:', '  - Firebase/Analytics', '  - Other/Sub', '', 'COCOAPODS: 1.15.2', ''].join('\n');
    const r = readCocoapods(tree({ 'Podfile.lock': lock }), ['Podfile.lock']);
    expect(r.deps).toEqual([
      { ecosystem: 'cocoapods', name: 'Firebase/Analytics', version: '10.29.0', manifest: 'Podfile.lock:5' },
      { ecosystem: 'cocoapods', name: 'Other/Sub', manifest: 'Podfile.lock:6' },
    ]);
    expect(r.notices).toEqual([UNRESOLVED(1)]);
  });

  it('a conditional inside a test target is still the test target, and a def inside one is not', () => {
    const lock = ['PODS:', '  - Alamofire (5.10.2)', '  - Nimble (13.3.0)', '  - Quick (7.6.0)', '', 'DEPENDENCIES:', '  - Alamofire', '  - Nimble', '  - Quick', '', 'COCOAPODS: 1.15.2', ''].join('\n');
    const podfile = [
      "target 'AppTests' do",
      "  if ENV['CI']",
      "    pod 'Quick'",
      '  end',
      "  ['Nimble'].each do |name|",
      '  end',
      "  pod 'Nimble'",
      '  def helper_pods',
      "    pod 'Alamofire'",
      '  end',
      'end',
      '',
    ].join('\n');
    const r = readCocoapods(tree({ Podfile: podfile, 'Podfile.lock': lock }), ['Podfile', 'Podfile.lock']);
    expect(r.deps.map((d) => d.name)).toEqual(['Alamofire']);
    expect(r.devSkipped).toBe(2);
  });
});
