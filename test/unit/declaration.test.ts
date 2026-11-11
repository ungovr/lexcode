import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readActivitiesMd } from '../../src/declaration/activities-md.js';
import { readLexlintYml } from '../../src/declaration/lexlint-yml.js';
import { selectDeclaration } from '../../src/declaration/select.js';
import { ToolError } from '../../src/errors.js';
import { makeRuleSet } from '../helpers/ruleset.js';
import { expectNearLinear, measureScaling } from '../helpers/scaling.js';

// An invented declaration pair with the shape of a real multi-component one.
const EXAMPLE = fileURLToPath(new URL('../repos/example-decl/', import.meta.url));

/** A lexlint.yml of about `lines` lines: six profile activities and a long lint section, the shape of a real one. */
function largeLexlintYml(lines: number): string {
  const out = [
    'version: 1',
    'app:',
    '  name: large',
    'profile:',
    '  activities:',
    ...['crawls_web', 'processes_personal_data', 'automated_outreach', 'tracks_devices', 'processes_voice', 'generates_content'].map(
      (a) => `    - ${a}`,
    ),
    'lint:',
    "  run_at: '2026-11-03'",
    '  findings:',
  ];
  for (let i = 0; out.length < lines; i++) {
    out.push(
      `    - id: finding-${i}`,
      `      jurisdiction: j-${i % 250}`,
      `      level: ${i % 3 === 0 ? 'info' : 'warn'}`,
      `      title: 'An invented finding, number ${i}, with a title about as long as a real one'`,
      '      requires:',
      `        - 'A duty line for finding ${i}, written out in full the way the lint writes it'`,
      `        - 'A second duty line for finding ${i}'`,
      '      cites:',
      `        - instrument: inst-${i % 400}`,
      `          section: '${i % 90}'`,
    );
  }
  return out.join('\n') + '\n';
}

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'lexcode-decl-'));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function md(...components: string[]): string {
  return ['---', 'version: 1', 'registry: https://lexlint.io/activities/v1', 'date: 2026-11-03', 'components:', ...components, '---', '', '# Body', ''].join('\n');
}

function comp(name: string, activities: [string, string][], not: string[] = []): string {
  const lines = [`  - name: ${name}`, '    shape: application', '    aggregate: complete', '    activities:'];
  for (const [id, mentioned] of activities) {
    lines.push(`      - id: ${id}`, `        mentioned: ${mentioned}`, '        enabled: by_default', '        note: a note');
  }
  if (not.length) {
    lines.push('    not:');
    for (const id of not) lines.push(`      - id: ${id}`, '        why: because');
  }
  return lines.join('\n');
}

function lexlint(activities: string[], extra = ''): string {
  return ['version: 1', 'app:', '  name: t', extra, 'profile:', '  activities:', ...activities.map((a) => `    - ${a}`), ''].join('\n');
}

describe('readActivitiesMd', () => {
  it('reads a multi-component ACTIVITIES.md: performs and absent', () => {
    const d = readActivitiesMd(join(EXAMPLE, 'ACTIVITIES.md'));
    expect(d.source).toBe('ACTIVITIES.md');
    expect(d.declared.get('crawls_web')).toBe('performs');
    expect(d.absent.has('trains_models')).toBe(true);
    expect(d.declared.has('trains_models')).toBe(false);
  });

  it('unions two components and lets performs beat enables', () => {
    const f = join(dir, 'ACTIVITIES.md');
    writeFileSync(
      f,
      md(
        comp('a', [['crawls_web', 'enables'], ['tracks_devices', 'enables']], ['trains_models']),
        comp('b', [['crawls_web', 'performs'], ['processes_voice', 'enables']], ['serves_minors']),
      ),
    );
    const d = readActivitiesMd(f);
    expect(d.declared.get('crawls_web')).toBe('performs');
    expect(d.declared.get('tracks_devices')).toBe('enables');
    expect(d.declared.get('processes_voice')).toBe('enables');
    expect([...d.absent].sort()).toEqual(['serves_minors', 'trains_models']);
  });

  it('performs beats enables whichever component comes first', () => {
    const f = join(dir, 'ACTIVITIES.md');
    writeFileSync(f, md(comp('a', [['crawls_web', 'performs']]), comp('b', [['crawls_web', 'enables']])));
    expect(readActivitiesMd(f).declared.get('crawls_web')).toBe('performs');
  });

  it('a file with no front matter is a ToolError naming front matter and the file', () => {
    const f = join(dir, 'ACTIVITIES.md');
    writeFileSync(f, '# Activities\n\nNothing here.\n');
    let err: unknown;
    try {
      readActivitiesMd(f);
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(ToolError);
    expect((err as Error).message).toContain('front matter');
    expect((err as Error).message).toContain('ACTIVITIES.md');
  });

  it('an unclosed front matter is a ToolError', () => {
    const f = join(dir, 'ACTIVITIES.md');
    writeFileSync(f, '---\nversion: 1\n');
    expect(() => readActivitiesMd(f)).toThrow(/front matter/);
  });

  it('a YAML syntax error is a ToolError with the file name and the file line', () => {
    const f = join(dir, 'ACTIVITIES.md');
    // line 1 is ---, the bad line is file line 4
    writeFileSync(f, '---\nversion: 1\ndate: 2026-11-03\ncomponents: [unclosed\n---\n');
    let err: unknown;
    try {
      readActivitiesMd(f);
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(ToolError);
    const m = (err as Error).message;
    expect(m).toContain('ACTIVITIES.md');
    expect(m).toMatch(/line 4\b/);
  });

  it('an alias bomb is a ToolError, not a hang', () => {
    const f = join(dir, 'lexlint.yml');
    const lines = ['a: &a [x, x, x, x, x, x, x, x, x]'];
    let prev = 'a';
    for (let i = 0; i < 12; i++) {
      const cur = String.fromCharCode(98 + i);
      lines.push(`${cur}: &${cur} [${Array(9).fill('*' + prev).join(', ')}]`);
      prev = cur;
    }
    writeFileSync(f, lines.join('\n') + '\n');
    expect(() => readLexlintYml(f)).toThrow(ToolError);
  });

  it('components that is not a list is a ToolError', () => {
    const f = join(dir, 'ACTIVITIES.md');
    writeFileSync(f, '---\nversion: 1\ncomponents: nope\n---\n');
    expect(() => readActivitiesMd(f)).toThrow(ToolError);
  });

  it('a missing file is a ToolError', () => {
    expect(() => readActivitiesMd(join(dir, 'nope.md'))).toThrow(ToolError);
  });
});

describe('readLexlintYml', () => {
  it('reads the example lexlint.yml: profile activities declared, nothing absent, no scope', () => {
    const { declaration, scope } = readLexlintYml(join(EXAMPLE, 'lexlint.yml'));
    expect(declaration.source).toBe('lexlint.yml');
    expect(declaration.declared.get('crawls_web')).toBe('declared');
    expect(declaration.declared.size).toBe(6);
    for (const v of declaration.declared.values()) expect(v).toBe('declared');
    expect(declaration.absent.size).toBe(0);
    expect(scope).toBeUndefined();
  });

  it('reads a 37,000-line lexlint.yml in time that grows near-linearly with its length', () => {
    const m = measureScaling({
      small: 3_700,
      large: 37_000,
      setup: (n) => {
        const f = join(dir, `lexlint-${n}.yml`);
        const text = largeLexlintYml(n);
        expect(text.split('\n').length).toBeGreaterThanOrEqual(n);
        writeFileSync(f, text);
        return f;
      },
      run: (f) => readLexlintYml(f),
    });
    expectNearLinear(m, 'readLexlintYml');
    expect(m.result.declaration.declared.size).toBe(6);
    expect(m.result.declaration.declared.get('generates_content')).toBe('declared');
  });

  it('activities_left_out go to absent and app.scope is returned', () => {
    const f = join(dir, 'lexlint.yml');
    writeFileSync(
      f,
      [
        'version: 1',
        'app:',
        '  name: t',
        '  scope:',
        '    include: [src/]',
        '    exclude: ["**/*.gen.ts"]',
        'profile:',
        '  activities: [crawls_web]',
        '  activities_left_out: [processes_personal_data]',
        '',
      ].join('\n'),
    );
    const { declaration, scope } = readLexlintYml(f);
    expect(declaration.declared.get('crawls_web')).toBe('declared');
    expect(declaration.absent.has('processes_personal_data')).toBe(true);
    expect(scope).toEqual({ include: ['src/'], exclude: ['**/*.gen.ts'] });
  });

  it('a scope with only an exclude returns an empty include', () => {
    const f = join(dir, 'lexlint.yml');
    writeFileSync(f, lexlint(['crawls_web'], '  scope:\n    exclude: [vendor/]'));
    expect(readLexlintYml(f).scope).toEqual({ include: [], exclude: ['vendor/'] });
  });

  it('a syntax error is a ToolError with the file name and a line number', () => {
    const f = join(dir, 'lexlint.yml');
    writeFileSync(f, 'version: 1\nprofile:\n  activities: [a, b\n  oops: : :\n');
    let err: unknown;
    try {
      readLexlintYml(f);
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(ToolError);
    expect((err as Error).message).toContain('lexlint.yml');
    expect((err as Error).message).toMatch(/line \d+/);
  });

  it('a non-mapping document is a ToolError', () => {
    const f = join(dir, 'lexlint.yml');
    writeFileSync(f, '- just\n- a list\n');
    expect(() => readLexlintYml(f)).toThrow(ToolError);
  });
});

describe('selectDeclaration', () => {
  const rs = makeRuleSet();

  it('neither file present: null', () => {
    const r = selectDeclaration(dir);
    expect(r.declaration).toBeNull();
    expect(r.disagreements).toEqual([]);
  });

  it('only lexlint.yml: it governs and its scope is returned as a ScopeSpec', () => {
    writeFileSync(join(dir, 'lexlint.yml'), lexlint(['crawls_web'], '  scope:\n    include: [src/]'));
    const r = selectDeclaration(dir);
    expect(r.declaration?.source).toBe('lexlint.yml');
    expect(r.scope).toEqual({ include: ['src/'], exclude: [], includeTests: false });
  });

  it('only ACTIVITIES.md: it governs, no scope', () => {
    writeFileSync(join(dir, 'ACTIVITIES.md'), md(comp('a', [['crawls_web', 'performs']])));
    const r = selectDeclaration(dir);
    expect(r.declaration?.source).toBe('ACTIVITIES.md');
    expect(r.scope).toBeUndefined();
  });

  it('both present and agreeing: ACTIVITIES.md governs, no disagreement', () => {
    writeFileSync(join(dir, 'ACTIVITIES.md'), md(comp('a', [['crawls_web', 'performs']])));
    writeFileSync(join(dir, 'lexlint.yml'), lexlint(['crawls_web']));
    const r = selectDeclaration(dir, undefined, rs.registry);
    expect(r.declaration?.source).toBe('ACTIVITIES.md');
    expect(r.disagreements).toEqual([]);
  });

  it('both present and the positive lists differ by x: ACTIVITIES.md governs and names x', () => {
    writeFileSync(join(dir, 'ACTIVITIES.md'), md(comp('a', [['crawls_web', 'performs'], ['tracks_devices', 'performs']])));
    writeFileSync(join(dir, 'lexlint.yml'), lexlint(['crawls_web', 'processes_voice']));
    const r = selectDeclaration(dir, undefined, rs.registry);
    expect(r.declaration?.source).toBe('ACTIVITIES.md');
    expect(r.disagreements).toEqual(['processes_voice', 'tracks_devices']);
  });

  it('a role id only lexlint.yml can carry is not a disagreement when the registry is given', () => {
    writeFileSync(join(dir, 'ACTIVITIES.md'), md(comp('a', [['crawls_web', 'performs']])));
    writeFileSync(join(dir, 'lexlint.yml'), lexlint(['crawls_web', 'handles_health_records']));
    expect(selectDeclaration(dir, undefined, rs.registry).disagreements).toEqual([]);
    // Without the registry every id is compared.
    expect(selectDeclaration(dir).disagreements).toEqual(['handles_health_records']);
  });

  it('the scope comes from lexlint.yml even when ACTIVITIES.md governs', () => {
    writeFileSync(join(dir, 'ACTIVITIES.md'), md(comp('a', [['crawls_web', 'performs']])));
    writeFileSync(join(dir, 'lexlint.yml'), lexlint(['crawls_web'], '  scope:\n    exclude: [vendor/]'));
    const r = selectDeclaration(dir);
    expect(r.declaration?.source).toBe('ACTIVITIES.md');
    expect(r.scope).toEqual({ include: [], exclude: ['vendor/'], includeTests: false });
  });

  it('an override selects the named file', () => {
    writeFileSync(join(dir, 'ACTIVITIES.md'), md(comp('a', [['crawls_web', 'performs']])));
    writeFileSync(join(dir, 'lexlint.yml'), lexlint(['processes_voice']));
    const r = selectDeclaration(dir, 'lexlint.yml');
    expect(r.declaration?.source).toBe('lexlint.yml');
    expect(r.declaration?.declared.has('processes_voice')).toBe(true);
  });

  it('an override naming a missing file is a ToolError', () => {
    expect(() => selectDeclaration(dir, 'lexlint.yml')).toThrow(ToolError);
  });

  it('prefers ACTIVITIES.md when a repository carries both files', () => {
    copyFileSync(join(EXAMPLE, 'ACTIVITIES.md'), join(dir, 'ACTIVITIES.md'));
    copyFileSync(join(EXAMPLE, 'lexlint.yml'), join(dir, 'lexlint.yml'));
    const r = selectDeclaration(dir);
    expect(r.declaration?.source).toBe('ACTIVITIES.md');
    expect(r.declaration?.declared.get('crawls_web')).toBe('performs');
  });
});
