import { mkdirSync, mkdtempSync, readFileSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { blankOutsideScripts, extractScripts } from '../../src/scope/extract.js';
import { expectNearLinear, measureScaling } from '../helpers/scaling.js';

const made: string[] = [];
function tmp(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'lexcode-extract-'));
  made.push(dir);
  return dir;
}
afterEach(() => {
  while (made.length) rmSync(made.pop() as string, { recursive: true, force: true });
});

function lines(s: string): string[] {
  return s.split('\n');
}

/** Every character of `out` is either the same as in `src` (inside a kept block) or a space (or a line break kept). */
function sameShape(src: string, out: string): void {
  expect(out.length).toBe(src.length);
  expect(lines(out).length).toBe(lines(src).length);
  for (let i = 0; i < src.length; i++) {
    if (src[i] === '\n' || src[i] === '\r') expect(out[i]).toBe(src[i]);
  }
}

describe('blankOutsideScripts', () => {
  const vue = [
    '<template>',
    '  <div id="app">{{ msg }}</div>',
    '</template>',
    '<script setup lang="ts">',
    'const msg: string = fetch("https://example.org");',
    '</script>',
    '<style>',
    '.a { color: red }',
    '</style>',
    '',
  ].join('\n');

  it('keeps script lines at the same line numbers, blanks everything else, and says ts for lang="ts"', () => {
    const r = blankOutsideScripts(vue);
    expect(r).not.toBeNull();
    sameShape(vue, r!.text);
    expect(r!.lang).toBe('ts');
    const out = lines(r!.text);
    expect(out[4]).toBe('const msg: string = fetch("https://example.org");');
    expect(out[3]).toBe(' '.repeat(lines(vue)[3]!.length));
    expect(out[5]).toBe(' '.repeat('</script>'.length));
    expect(out[0]).toBe(' '.repeat('<template>'.length));
    expect(out[7]).toBe(' '.repeat('.a { color: red }'.length));
    expect(r!.text.replace(/[ \n]/g, '')).toBe('constmsg:string=fetch("https://example.org");');
  });

  it('keeps the text on the line of the opening tag, at its original column', () => {
    const src = '<p>x</p><script>var a = 1;</script><p>y</p>';
    const r = blankOutsideScripts(src)!;
    expect(r.text).toBe(' '.repeat('<p>x</p><script>'.length) + 'var a = 1;' + ' '.repeat('</script><p>y</p>'.length));
    expect(r.lang).toBe('js');
  });

  it('returns null for a page whose only scripts are data or external', () => {
    const html = [
      '<html><head>',
      '<script type="application/ld+json">{"@type":"Thing"}</script>',
      '<script src="x.js"></script>',
      '</head></html>',
    ].join('\n');
    expect(blankOutsideScripts(html)).toBeNull();
  });

  it('returns null when there is no script at all', () => {
    expect(blankOutsideScripts('<template><p>hi</p></template>\n')).toBeNull();
    expect(blankOutsideScripts('')).toBeNull();
  });

  it('keeps line numbers across Jinja syntax inside and outside a script', () => {
    const j = [
      '{% extends "base.html" %}',
      '{% block head %}',
      '<script>',
      '  const user = {{ user|tojson }};',
      '  gtag("config", "{{ gid }}");',
      '</script>',
      '{% endblock %}',
    ].join('\n');
    const r = blankOutsideScripts(j)!;
    sameShape(j, r.text);
    expect(lines(r.text)[3]).toBe('  const user = {{ user|tojson }};');
    expect(lines(r.text)[4]).toBe('  gtag("config", "{{ gid }}");');
    expect(lines(r.text)[0].trim()).toBe('');
  });

  it('preserves CRLF line breaks', () => {
    const src = '<p>\r\n</p>\r\n<script>\r\nlet a;\r\n</script>\r\n';
    const r = blankOutsideScripts(src)!;
    sameShape(src, r.text);
    expect(r.text).toContain('\r\nlet a;\r\n');
  });

  it('accepts the listed type values and nothing else', () => {
    for (const type of ['module', 'text/javascript', 'application/javascript', 'text/babel', 'text/typescript', '']) {
      expect(blankOutsideScripts(`<script type="${type}">a();</script>`), type).not.toBeNull();
    }
    expect(blankOutsideScripts('<script type="MODULE">a();</script>')).not.toBeNull();
    for (const type of ['application/json', 'importmap', 'text/template', 'text/x-handlebars', 'speculationrules']) {
      expect(blankOutsideScripts(`<script type="${type}">a();</script>`), type).toBeNull();
    }
  });

  it('skips a script with src and an empty body, keeps one with src and a body', () => {
    expect(blankOutsideScripts('<script src="x.js"></script>')).toBeNull();
    expect(blankOutsideScripts('<script src="x.js">\n  </script>')).toBeNull();
    expect(blankOutsideScripts('<script src="x.js">a();</script>')).not.toBeNull();
    expect(blankOutsideScripts('<script src="x.js" />')).toBeNull();
  });

  it('picks the language: ts for lang or type, js otherwise, ts when blocks differ', () => {
    expect(blankOutsideScripts('<script lang="ts">a();</script>')!.lang).toBe('ts');
    expect(blankOutsideScripts('<script lang="typescript">a();</script>')!.lang).toBe('ts');
    expect(blankOutsideScripts('<script type="text/typescript">a();</script>')!.lang).toBe('ts');
    expect(blankOutsideScripts('<script lang="js">a();</script>')!.lang).toBe('js');
    expect(blankOutsideScripts('<script>a();</script>')!.lang).toBe('js');
    expect(blankOutsideScripts('<script>a();</script>\n<script lang="ts">b();</script>')!.lang).toBe('ts');
  });

  it('keeps several blocks, each at its own lines', () => {
    const src = '<script>\nA();\n</script>\n<div></div>\n<script setup>\nB();\n</script>\n';
    const r = blankOutsideScripts(src)!;
    sameShape(src, r.text);
    expect(lines(r.text)[1]).toBe('A();');
    expect(lines(r.text)[5]).toBe('B();');
  });

  it('reads tag and attribute names without regard to case, and a > inside a quoted attribute', () => {
    const r = blankOutsideScripts('<SCRIPT LANG="ts" data-x="a > b">q();</SCRIPT>')!;
    expect(r.lang).toBe('ts');
    expect(r.text.trim()).toBe('q();');
  });

  it('does not take <script> inside an HTML comment, and does not take <scripts> or <scriptx>', () => {
    expect(blankOutsideScripts('<!-- <script>gtag()</script> -->')).toBeNull();
    expect(blankOutsideScripts('<scripts>a();</scripts>')).toBeNull();
    expect(blankOutsideScripts('<!-- open and never closed <script>a();</script>')).not.toBeNull();
  });

  it('reads an unterminated script to the end of the file', () => {
    const r = blankOutsideScripts('<script>\nA();\n')!;
    expect(r.text.trim()).toBe('A();');
  });

  it('ends the body at the first closing tag, whatever a string says about HTML', () => {
    const r = blankOutsideScripts('<script>let a = "<b>";</script><script>c();</script>')!;
    expect(r.text.replace(/ /g, '')).toBe('leta="<b>";c();');
  });
});

describe('extractScripts', () => {
  function write(root: string, rel: string, body: string): void {
    const full = path.join(root, ...rel.split('/'));
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, body);
  }

  it('writes <tmp>/<path>.lexcode.<ts|js> for each qualifying file and returns the pairs', () => {
    const root = tmp();
    const out = tmp();
    write(root, 'web/App.vue', '<template/>\n<script lang="ts">\nconst a = 1;\n</script>\n');
    write(root, 'web/Old.svelte', '<script>\nlet b = 2;\n</script>\n');
    write(root, 'tpl/page.html', '<p></p>\n<script>\ngtag("js");\n</script>\n');
    write(root, 'tpl/data.html', '<script type="application/ld+json">{}</script>\n');
    write(root, 'tpl/a.htm', '<script>a()</script>');
    write(root, 'tpl/b.jinja', '<script>b()</script>');
    write(root, 'tpl/c.jinja2', '<script>c()</script>');
    write(root, 'tpl/d.j2', '<script>d()</script>');
    write(root, 'tpl/e.njk', '<script>e()</script>');
    write(root, 'tpl/UP.HTML', '<script>u()</script>');
    write(root, 'src/plain.ts', '<script>nope()</script>');
    write(root, 'README.md', '<script>nope()</script>');

    const files = [
      'web/App.vue', 'web/Old.svelte', 'tpl/page.html', 'tpl/data.html', 'tpl/a.htm', 'tpl/b.jinja',
      'tpl/c.jinja2', 'tpl/d.j2', 'tpl/e.njk', 'tpl/UP.HTML', 'src/plain.ts', 'README.md',
    ];
    const pairs = extractScripts(root, files, out);
    const byOriginal = new Map(pairs.map((p) => [p.originalPath, p.tempPath]));

    expect([...byOriginal.keys()].sort()).toEqual(
      ['tpl/UP.HTML', 'tpl/a.htm', 'tpl/b.jinja', 'tpl/c.jinja2', 'tpl/d.j2', 'tpl/e.njk', 'tpl/page.html', 'web/App.vue', 'web/Old.svelte'],
    );
    expect(byOriginal.get('web/App.vue')).toBe(path.join(out, 'web', 'App.vue.lexcode.ts'));
    expect(byOriginal.get('web/Old.svelte')).toBe(path.join(out, 'web', 'Old.svelte.lexcode.js'));
    expect(byOriginal.get('tpl/page.html')).toBe(path.join(out, 'tpl', 'page.html.lexcode.js'));
    expect(existsSync(path.join(out, 'tpl', 'data.html.lexcode.js'))).toBe(false);
    expect(existsSync(path.join(out, 'src', 'plain.ts.lexcode.js'))).toBe(false);

    const vueOut = readFileSync(byOriginal.get('web/App.vue')!, 'utf8');
    expect(lines(vueOut)[2]).toBe('const a = 1;');
    expect(lines(vueOut).length).toBe(5);
  });

  it('returns nothing for no files and writes nothing', () => {
    const root = tmp();
    const out = tmp();
    expect(extractScripts(root, [], out)).toEqual([]);
  });

  it('never writes outside the temp directory', () => {
    const root = tmp();
    const out = tmp();
    write(root, 'a.html', '<script>a()</script>');
    expect(() => extractScripts(root, ['../escape.html'], out)).toThrow();
  });
});

describe('blankOutsideScripts on hostile input', () => {
  it('takes time that grows near-linearly with 500 KB of unterminated comment openers, and still finds the script after them', () => {
    const m = measureScaling({
      small: 12_500,
      large: 125_000,
      setup: (n) => '<!--'.repeat(n) + '<script>fetch(u)</script>',
      run: (text) => blankOutsideScripts(text),
    });
    expectNearLinear(m, 'blankOutsideScripts');
    expect(m.result?.text.includes('fetch(u)')).toBe(true);
  });

  it('a terminated comment still hides the script inside it, and the script after it is kept', () => {
    const text = '<!-- <!-- <script>a()</script> --> <script>b()</script>';
    const out = blankOutsideScripts(text);
    expect(out?.text).toContain('b()');
    expect(out?.text).not.toContain('a()');
  });
});

