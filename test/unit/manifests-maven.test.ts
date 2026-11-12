import { describe, expect, it } from 'vitest';
import { readMaven } from '../../src/manifests/maven.js';
import { expectNearLinear, measureScaling } from '../helpers/scaling.js';
import { lineOf, tree } from './helpers.js';

function dep(g: string, a: string, extra: { version?: string; scope?: string; optional?: boolean } = {}): string {
  return [
    '    <dependency>',
    `      <groupId>${g}</groupId>`,
    `      <artifactId>${a}</artifactId>`,
    ...(extra.version !== undefined ? [`      <version>${extra.version}</version>`] : []),
    ...(extra.scope !== undefined ? [`      <scope>${extra.scope}</scope>`] : []),
    ...(extra.optional ? ['      <optional>true</optional>'] : []),
    '    </dependency>',
  ].join('\n');
}

function bomImport(g: string, a: string, v: string): string {
  return [
    '    <dependency>',
    `      <groupId>${g}</groupId>`,
    `      <artifactId>${a}</artifactId>`,
    `      <version>${v}</version>`,
    '      <type>pom</type>',
    '      <scope>import</scope>',
    '    </dependency>',
  ].join('\n');
}

function pom(parts: { head?: string[]; body?: string[] }): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<project xmlns="http://maven.apache.org/POM/4.0.0">',
    '  <modelVersion>4.0.0</modelVersion>',
    ...(parts.head ?? []),
    ...(parts.body ?? []),
    '</project>',
    '',
  ].join('\n');
}

const deps = (...d: string[]): string[] => ['  <dependencies>', ...d, '  </dependencies>'];
const mgmt = (...d: string[]): string[] => ['  <dependencyManagement>', '  <dependencies>', ...d, '  </dependencies>', '  </dependencyManagement>'];
const gav = (g: string, a: string, v: string): string[] => [`  <groupId>${g}</groupId>`, `  <artifactId>${a}</artifactId>`, `  <version>${v}</version>`];
const parentOf = (g: string, a: string, v: string, rel?: string): string[] => [
  '  <parent>',
  `    <groupId>${g}</groupId>`,
  `    <artifactId>${a}</artifactId>`,
  `    <version>${v}</version>`,
  ...(rel !== undefined ? [`    <relativePath>${rel}</relativePath>`] : []),
  '  </parent>',
];

describe('readMaven', () => {
  it('reads a dependency with its version', () => {
    const text = pom({ head: gav('com.example', 'app', '1.0'), body: deps(dep('com.twilio.sdk', 'twilio', { version: '10.1.0' })) });
    const root = tree({ 'pom.xml': text });
    const r = readMaven(root, ['pom.xml']);
    expect(r.deps).toEqual([
      { ecosystem: 'maven', name: 'com.twilio.sdk:twilio', version: '10.1.0', manifest: `pom.xml:${lineOf(text, '<artifactId>twilio')}` },
    ]);
    expect(r.devSkipped).toBe(0);
    expect(r.notices).toEqual([]);
  });

  it('skips test scope and counts it; provided, runtime, system and optional count', () => {
    const text = pom({
      body: deps(
        dep('org.junit', 'junit', { version: '5', scope: 'test' }),
        dep('javax.servlet', 'servlet-api', { version: '3', scope: 'provided' }),
        dep('org.pg', 'postgresql', { version: '42', scope: 'runtime' }),
        dep('com.oracle', 'ojdbc', { version: '8', scope: 'system' }),
        dep('com.opt', 'optional-lib', { version: '1', optional: true }),
      ),
    });
    const r = readMaven(tree({ 'pom.xml': text }), ['pom.xml']);
    expect(r.deps.map((d) => d.name)).toEqual(['javax.servlet:servlet-api', 'org.pg:postgresql', 'com.oracle:ojdbc', 'com.opt:optional-lib']);
    expect(r.devSkipped).toBe(1);
  });

  it('resolves a property', () => {
    const text = pom({
      head: ['  <properties>', '    <twilio.version>10.1.0</twilio.version>', '  </properties>'],
      body: deps(dep('com.twilio.sdk', 'twilio', { version: '${twilio.version}' })),
    });
    const r = readMaven(tree({ 'pom.xml': text }), ['pom.xml']);
    expect(r.deps[0]?.version).toBe('10.1.0');
    expect(r.notices).toEqual([]);
  });

  it('resolves project.version, project.groupId and the parent aliases', () => {
    const text = pom({
      head: [...parentOf('com.example', 'outside', '7.7'), '  <artifactId>app</artifactId>', '  <version>2.5</version>'],
      body: deps(
        dep('${project.groupId}', 'a', { version: '${project.version}' }),
        dep('com.x', 'b', { version: '${pom.version}' }),
        dep('com.x', 'c', { version: '${version}' }),
        dep('com.x', 'd', { version: '${project.parent.version}' }),
      ),
    });
    const r = readMaven(tree({ 'pom.xml': text }), ['pom.xml']);
    expect(r.deps.map((d) => [d.name, d.version])).toEqual([
      ['com.example:a', '2.5'],
      ['com.x:b', '2.5'],
      ['com.x:c', '2.5'],
      ['com.x:d', '7.7'],
    ]);
  });

  it("takes a version from the parent's dependencyManagement", () => {
    const rootPom = pom({
      head: [
        ...gav('com.example', 'root', '1.0'),
        '  <packaging>pom</packaging>',
        '  <modules>',
        '    <module>app</module>',
        '  </modules>',
        '  <properties>',
        '    <twilio.version>10.1.0</twilio.version>',
        '  </properties>',
      ],
      body: mgmt(dep('com.twilio.sdk', 'twilio', { version: '${twilio.version}' })),
    });
    const child = pom({
      head: [...parentOf('com.example', 'root', '1.0'), '  <artifactId>app</artifactId>'],
      body: deps(dep('com.twilio.sdk', 'twilio')),
    });
    const root = tree({ 'pom.xml': rootPom, 'app/pom.xml': child });
    const r = readMaven(root, ['app/pom.xml', 'pom.xml']);
    expect(r.deps).toEqual([
      { ecosystem: 'maven', name: 'com.twilio.sdk:twilio', version: '10.1.0', manifest: `app/pom.xml:${lineOf(child, '<artifactId>twilio')}` },
    ]);
    expect(r.notices).toEqual([]);
  });

  it("a child's property overrides the parent's when the parent's managed version names it", () => {
    const rootPom = pom({
      head: [...gav('com.example', 'root', '1.0'), '  <properties>', '    <lib.version>1.0</lib.version>', '  </properties>'],
      body: mgmt(dep('com.lib', 'lib', { version: '${lib.version}' })),
    });
    const child = pom({
      head: [...parentOf('com.example', 'root', '1.0'), '  <artifactId>app</artifactId>', '  <properties>', '    <lib.version>2.0</lib.version>', '  </properties>'],
      body: deps(dep('com.lib', 'lib')),
    });
    const r = readMaven(tree({ 'pom.xml': rootPom, 'app/pom.xml': child }), ['pom.xml', 'app/pom.xml']);
    expect(r.deps[0]?.version).toBe('2.0');
  });

  it('walks a parent chain more than one level deep', () => {
    const top = pom({ head: gav('com.example', 'top', '1.0'), body: mgmt(dep('com.lib', 'lib', { version: '3.1' })) });
    // mid names top through the default relativePath, ../pom.xml
    const mid = pom({ head: [...parentOf('com.example', 'top', '1.0'), '  <artifactId>mid</artifactId>'] });
    const leaf = pom({
      head: [...parentOf('com.example', 'mid', '1.0', '../mid/pom.xml'), '  <artifactId>leaf</artifactId>'],
      body: deps(dep('com.lib', 'lib')),
    });
    const root = tree({ 'pom.xml': top, 'mid/pom.xml': mid, 'leaf/pom.xml': leaf });
    const r = readMaven(root, ['pom.xml', 'mid/pom.xml', 'leaf/pom.xml']);
    expect(r.deps).toEqual([expect.objectContaining({ name: 'com.lib:lib', version: '3.1' })]);
  });

  it('takes a version from a BOM imported with scope import when the BOM is in the repo', () => {
    const bom = pom({ head: gav('com.example', 'bom', '1.0'), body: mgmt(dep('com.lib', 'lib', { version: '9.9' })) });
    const app = pom({
      head: gav('com.example', 'app', '1.0'),
      body: [...mgmt(bomImport('com.example', 'bom', '1.0')), ...deps(dep('com.lib', 'lib'))],
    });
    const r = readMaven(tree({ 'bom/pom.xml': bom, 'app/pom.xml': app }), ['bom/pom.xml', 'app/pom.xml']);
    expect(r.deps).toEqual([expect.objectContaining({ name: 'com.lib:lib', version: '9.9' })]);
    expect(r.notices).toEqual([]);
  });

  it('finds a parent by coordinates when relativePath does not point at it', () => {
    const parent = pom({ head: gav('com.example', 'platform', '1.0'), body: mgmt(dep('com.lib', 'lib', { version: '4.2' })) });
    const child = pom({
      head: [...parentOf('com.example', 'platform', '1.0', '../nope/pom.xml'), '  <artifactId>svc</artifactId>'],
      body: deps(dep('com.lib', 'lib')),
    });
    // no relativePath at all, and ../pom.xml does not exist
    const child2 = pom({
      head: [...parentOf('com.example', 'platform', '1.0'), '  <artifactId>svc2</artifactId>'],
      body: deps(dep('com.lib', 'lib')),
    });
    const root = tree({ 'build/platform/pom.xml': parent, 'svc/pom.xml': child, 'deep/er/svc2/pom.xml': child2 });
    const r = readMaven(root, ['build/platform/pom.xml', 'svc/pom.xml', 'deep/er/svc2/pom.xml']);
    expect(r.deps.map((d) => [d.manifest.split(':')[0], d.version])).toEqual([
      ['svc/pom.xml', '4.2'],
      ['deep/er/svc2/pom.xml', '4.2'],
    ]);
    expect(r.notices).toEqual([]);
  });

  it('one notice for versions managed outside the repo', () => {
    const text = pom({
      head: [...parentOf('org.springframework.boot', 'spring-boot-starter-parent', '3.2.0'), '  <artifactId>demo</artifactId>'],
      body: deps(
        dep('org.springframework.boot', 'spring-boot-starter-web'),
        dep('org.springframework.boot', 'spring-boot-starter-data-jpa'),
        dep('com.h2database', 'h2', { scope: 'runtime' }),
        dep('org.springframework.boot', 'spring-boot-starter-test', { scope: 'test' }),
      ),
    });
    const r = readMaven(tree({ 'pom.xml': text }), ['pom.xml']);
    expect(r.deps).toHaveLength(3);
    expect(r.deps.every((d) => d.version === undefined)).toBe(true);
    expect(r.devSkipped).toBe(1);
    expect(r.notices).toEqual(['3 Maven dependencies take their version from a parent POM or BOM outside this repository; recorded without a version']);
  });

  it('a single dependency makes a singular notice, and an outside BOM import counts', () => {
    const text = pom({
      head: gav('com.example', 'app', '1.0'),
      body: [...mgmt(bomImport('org.springframework.cloud', 'spring-cloud-dependencies', '2023.0.0')), ...deps(dep('org.springframework.cloud', 'spring-cloud-starter'))],
    });
    const r = readMaven(tree({ 'pom.xml': text }), ['pom.xml']);
    expect(r.deps).toHaveLength(1);
    expect(r.notices).toEqual(['1 Maven dependency takes its version from a parent POM or BOM outside this repository; recorded without a version']);
  });

  it('does not record a dependency on a module of the same repository', () => {
    const parent = pom({
      head: [...gav('com.example', 'root', '1.0'), '  <packaging>pom</packaging>', '  <modules>', '    <module>lib</module>', '    <module>app</module>', '  </modules>'],
    });
    const lib = pom({ head: [...parentOf('com.example', 'root', '1.0'), '  <artifactId>lib</artifactId>'] });
    const app = pom({
      head: [...parentOf('com.example', 'root', '1.0'), '  <artifactId>app</artifactId>'],
      body: deps(
        dep('com.example', 'lib', { version: '${project.version}' }),
        dep('com.example', 'lib', { scope: 'test' }),
        dep('com.twilio.sdk', 'twilio', { version: '10.1.0' }),
      ),
    });
    const r = readMaven(tree({ 'pom.xml': parent, 'lib/pom.xml': lib, 'app/pom.xml': app }), ['pom.xml', 'lib/pom.xml', 'app/pom.xml']);
    expect(r.deps.map((d) => d.name)).toEqual(['com.twilio.sdk:twilio']);
    expect(r.devSkipped).toBe(0);
    expect(r.notices).toEqual([]);
  });

  it('a versionless module dependency is not an outside-version notice either', () => {
    const lib = pom({ head: gav('com.example', 'lib', '1.0') });
    const app = pom({
      head: [...parentOf('org.springframework.boot', 'spring-boot-starter-parent', '3.2.0'), '  <groupId>com.example</groupId>', '  <artifactId>app</artifactId>'],
      body: deps(dep('com.example', 'lib'), dep('org.springframework.boot', 'spring-boot-starter-web')),
    });
    const r = readMaven(tree({ 'lib/pom.xml': lib, 'app/pom.xml': app }), ['lib/pom.xml', 'app/pom.xml']);
    expect(r.deps.map((d) => d.name)).toEqual(['org.springframework.boot:spring-boot-starter-web']);
    expect(r.notices).toEqual(['1 Maven dependency takes its version from a parent POM or BOM outside this repository; recorded without a version']);
  });

  it('does not read build plugins or reporting', () => {
    const text = pom({
      body: [
        ...deps(dep('com.keep', 'kept', { version: '1' })),
        '  <build>',
        '    <plugins>',
        '      <plugin>',
        '        <artifactId>maven-compiler-plugin</artifactId>',
        '        <dependencies>',
        dep('com.plugin', 'plugin-dep', { version: '1' }),
        '        </dependencies>',
        '      </plugin>',
        '    </plugins>',
        '    <pluginManagement><plugins><plugin><dependencies>',
        dep('com.plugin', 'managed-plugin-dep', { version: '1' }),
        '    </dependencies></plugin></plugins></pluginManagement>',
        '  </build>',
        '  <reporting><plugins><plugin><dependencies>',
        dep('com.report', 'report-dep', { version: '1' }),
        '  </dependencies></plugin></plugins></reporting>',
      ],
    });
    const r = readMaven(tree({ 'pom.xml': text }), ['pom.xml']);
    expect(r.deps.map((d) => d.name)).toEqual(['com.keep:kept']);
  });

  it('does not read dependencyManagement entries as dependencies', () => {
    const text = pom({ body: mgmt(dep('com.managed', 'only-managed', { version: '1' })) });
    expect(readMaven(tree({ 'pom.xml': text }), ['pom.xml']).deps).toEqual([]);
  });

  it('reads profile dependencies', () => {
    const text = pom({
      body: [
        ...deps(dep('com.main', 'main', { version: '1' })),
        '  <profiles>',
        '    <profile>',
        '      <id>extra</id>',
        '      <properties><prof.version>5.5</prof.version></properties>',
        ...deps(dep('com.profile', 'prof-only', { version: '${prof.version}' }), dep('com.profile', 'prof-test', { version: '1', scope: 'test' })),
        '    </profile>',
        '  </profiles>',
      ],
    });
    const r = readMaven(tree({ 'pom.xml': text }), ['pom.xml']);
    expect(r.deps.map((d) => [d.name, d.version])).toEqual([
      ['com.main:main', '1'],
      ['com.profile:prof-only', '5.5'],
    ]);
    expect(r.devSkipped).toBe(1);
  });

  it('a property cycle stops and leaves the version unresolved', () => {
    const text = pom({
      head: ['  <properties>', '    <a>${b}</a>', '    <b>${a}</b>', '  </properties>'],
      body: deps(dep('com.cyc', 'cyc', { version: '${a}' })),
    });
    const r = readMaven(tree({ 'pom.xml': text }), ['pom.xml']);
    expect(r.deps).toEqual([expect.objectContaining({ name: 'com.cyc:cyc' })]);
    expect(r.deps[0]?.version).toBeUndefined();
    expect(r.notices).toHaveLength(1);
  });

  it('a property nobody defines is recorded without a version and noticed once', () => {
    const text = pom({ head: gav('com.example', 'app', '1.0'), body: deps(dep('com.x', 'x', { version: '${undefined.version}' }), dep('com.y', 'y')) });
    const r = readMaven(tree({ 'pom.xml': text }), ['pom.xml']);
    expect(r.deps.map((d) => d.version)).toEqual([undefined, undefined]);
    expect(r.notices).toEqual([
      '2 Maven dependencies have a version lexcode cannot resolve (an undefined property or no managed version); recorded without a version',
    ]);
  });

  it('reads 20,000 dependencies, each versioned by its own property, in time that grows near-linearly with the count', () => {
    const m = measureScaling({
      small: 2_000,
      large: 20_000,
      setup: (n) => {
        const props = Array.from({ length: n }, (_v, i) => `    <v${i}>1.${i}</v${i}>`);
        const list = Array.from({ length: n }, (_v, i) => dep('com.big', `a${i}`, { version: '${v' + i + '}' }));
        return tree({ 'pom.xml': pom({ head: ['  <properties>', ...props, '  </properties>'], body: deps(...list) }) });
      },
      run: (root) => readMaven(root, ['pom.xml']),
    });
    expectNearLinear(m, 'readMaven');
    expect(m.result.deps).toHaveLength(20_000);
    expect(m.result.deps.find((d) => d.name === 'com.big:a19999')?.version).toBe('1.19999');
  });

  it('dedupes the same coordinate and version within one pom', () => {
    const text = pom({ body: deps(dep('com.x', 'x', { version: '1' }), dep('com.x', 'x', { version: '1' })) });
    expect(readMaven(tree({ 'pom.xml': text }), ['pom.xml']).deps).toHaveLength(1);
  });

  it('a property that names the next one many times does not hang the reader', () => {
    // 9 levels, each naming the next 10 times: 10^9 expansions without a memo, and far past the length cap.
    // A hang guard, so the test timeout is the bound.
    const ref = (n: number): string => '${p' + n + '}';
    const props = Array.from({ length: 9 }, (_v, i) => `    <p${i}>${ref(i + 1).repeat(10)}</p${i}>`);
    const text = pom({
      head: ['  <properties>', ...props, '    <p9>1</p9>', '  </properties>'],
      body: deps(dep('com.fan', 'fan', { version: '${p0}' }), dep('com.fan', 'ok', { version: '${p9}' })),
    });
    const r = readMaven(tree({ 'pom.xml': text }), ['pom.xml']);
    expect(r.deps.map((d) => [d.name, d.version])).toEqual([
      ['com.fan:fan', undefined],
      ['com.fan:ok', '1'],
    ]);
    expect(r.notices).toHaveLength(1);
  });

  it('a short fan-out inside the length cap still resolves', () => {
    const text = pom({
      head: ['  <properties>', `    <a>${'${b}'.repeat(10)}</a>`, `    <b>${'${c}'.repeat(10)}</b>`, '    <c>x</c>', '  </properties>'],
      body: deps(dep('com.fan', 'fan', { version: '${a}' })),
    });
    expect(readMaven(tree({ 'pom.xml': text }), ['pom.xml']).deps[0]?.version).toBe('x'.repeat(100));
  });

  it('a notice for a pom that does not parse never carries the pom text', () => {
    const token = 'AKIAIOSFODNN7EXAMPLE';
    const root = tree({
      'a/pom.xml': `<project>\n<${token}`,
      'b/pom.xml': `<project>\n<dep ${token}="`,
      'c/pom.xml': `<project>\n<dep ${token}=x/>`,
      'd/pom.xml': `<project>\n<${token}>\n</project>`,
      'e/pom.xml': `<${token}>\n<x>\n</${token}>`,
    });
    const r = readMaven(root, ['a/pom.xml', 'b/pom.xml', 'c/pom.xml', 'd/pom.xml', 'e/pom.xml']);
    expect(r.notices).toHaveLength(5);
    for (const n of r.notices) {
      expect(n).not.toContain(token);
      expect(n).toMatch(/^[a-e]\/pom\.xml: did not parse \(.*line \d+.*\); skipped$/);
    }
  });

  it('a pom that does not parse is a notice, not a throw', () => {
    const good = pom({ body: deps(dep('com.good', 'good', { version: '1' })) });
    const root = tree({ 'bad/pom.xml': '<project><dependencies>\n<dependency>', 'good/pom.xml': good });
    const r = readMaven(root, ['bad/pom.xml', 'good/pom.xml']);
    expect(r.deps.map((d) => d.name)).toEqual(['com.good:good']);
    expect(r.notices).toHaveLength(1);
    expect(r.notices[0]).toMatch(/^bad\/pom\.xml: did not parse \(.*line \d+.*\); skipped$/);
  });

  it('a missing file and a root that is not a project are notices', () => {
    const root = tree({ 'other/pom.xml': '<settings/>' });
    const r = readMaven(root, ['gone/pom.xml', 'other/pom.xml']);
    expect(r.deps).toEqual([]);
    expect(r.notices).toHaveLength(2);
  });

  it('reads only files named pom.xml', () => {
    const text = pom({ body: deps(dep('com.x', 'x', { version: '1' })) });
    const root = tree({ 'pom.xml': text, 'other.xml': text, 'src/test/resources/pom.xml.bak': text });
    expect(readMaven(root, ['pom.xml', 'other.xml', 'src/test/resources/pom.xml.bak']).deps).toHaveLength(1);
  });

  it('a self-referencing parent cannot loop', () => {
    const text = pom({
      head: [...parentOf('com.example', 'me', '1'), '  <artifactId>me</artifactId>'],
      body: deps(dep('com.x', 'x')),
    });
    const r = readMaven(tree({ 'pom.xml': text }), ['pom.xml']);
    expect(r.deps).toHaveLength(1);
  });
});
