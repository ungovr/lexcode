import { mkdirSync, mkdtempSync, readFileSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  blankBladeTags,
  blankErbTags,
  blankJspTags,
  blankOutsideScripts,
  blankPhpRegions,
  blankPhpTags,
  blankRazorTags,
  blankTwigTags,
  extractScripts,
  razorCSharp,
} from '../../src/scope/extract.js';
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


describe('ERB views', () => {
  function write(root: string, rel: string, body: string): void {
    const full = path.join(root, ...rel.split('/'));
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, body);
  }

  it('extracts a script block from an html.erb view', () => {
    const root = tmp();
    const out = tmp();
    const view = [
      '<head>',
      '<script>',
      '  gtag("config", "<%= ga_id %>");',
      '</script>',
      '</head>',
      '',
    ].join('\n');
    write(root, 'app/views/layouts/_head.html.erb', view);
    const pairs = extractScripts(root, ['app/views/layouts/_head.html.erb'], out);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]!.originalPath).toBe('app/views/layouts/_head.html.erb');
    expect(pairs[0]!.tempPath.endsWith('_head.html.erb.lexcode.js')).toBe(true);
    const text = readFileSync(pairs[0]!.tempPath, 'utf8');
    sameShape(view, text);
    expect(lines(text)[2]).toMatch(/^ {2}gtag\("config", "_ {11}"\);$/);
  });

  it('blanks ERB tags inside a script', () => {
    const output = 'const d = <%= raw @json %>;';
    expect(blankErbTags(output)).toBe('const d = _' + ' '.repeat('<%= raw @json %>'.length - 1) + ';');
    expect(blankErbTags(output).length).toBe(output.length);
    expect(blankErbTags('<%== raw x %>')).toBe('_' + ' '.repeat('<%== raw x %>'.length - 1));
    for (const tag of ['<% if x %>', '<%- if x -%>', '<%# a comment %>']) {
      expect(blankErbTags(`a(); ${tag} b();`)).toBe('a(); ' + ' '.repeat(tag.length) + ' b();');
    }
    // `<%%` is a literal and stays; the text after it is not a tag.
    expect(blankErbTags('s = "<%% not a tag %>";')).toBe('s = "<%% not a tag %>";');
    expect(blankErbTags('plain();')).toBe('plain();');
  });

  it('blanks an unterminated tag to the end of the block rather than leaving a stray "<%"', () => {
    expect(blankErbTags('a(); <% b(')).toBe('a(); ' + ' '.repeat('<% b('.length));
  });

  it('keeps line numbers across a multi-line ERB tag', () => {
    const view = [
      '<script>',
      '  const a = <%= foo(',
      '    bar) %>;',
      '  track("after");',
      '</script>',
      '',
    ].join('\n');
    const r = blankOutsideScripts(view, { erb: true })!;
    sameShape(view, r.text);
    expect(lines(r.text)[3]).toBe('  track("after");');
    expect(lines(r.text)[1]).toBe('  const a = _' + ' '.repeat('<%= foo('.length - 1));
    expect(lines(r.text)[2]).toBe(' '.repeat('    bar) %>'.length) + ';');
  });

  it('keeps line numbers when a %> sits inside a Ruby string in the tag, as ERB itself ends the tag there', () => {
    const view = ['<script>', '  var a = <%= "50%>" %>;', '  track("after");', '</script>'].join('\n');
    const r = blankOutsideScripts(view, { erb: true })!;
    sameShape(view, r.text);
    expect(lines(r.text)[2]).toBe('  track("after");');
  });

  it('blanks ERB tags only in an .erb file, never in an .html file', () => {
    const root = tmp();
    const out = tmp();
    write(root, 'a.html', '<script>var t = "<%= x %>";</script>');
    write(root, 'b.erb', '<script>var t = "<%= x %>";</script>');
    const pairs = extractScripts(root, ['a.html', 'b.erb'], out);
    expect(pairs).toHaveLength(2);
    const byOriginal = new Map(pairs.map((p) => [p.originalPath, readFileSync(p.tempPath, 'utf8')]));
    expect(byOriginal.get('a.html')).toContain('<%= x %>');
    expect(byOriginal.get('b.erb')).not.toContain('<%');
  });
});

describe('JSP views', () => {
  function write(root: string, rel: string, body: string): void {
    const full = path.join(root, ...rel.split('/'));
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, body);
  }

  it('extracts a script block from a JSP view', () => {
    const root = tmp();
    const out = tmp();
    const view = [
      '<%@ page contentType="text/html;charset=UTF-8" %>',
      '<head>',
      '<script>',
      '  gtag("config", "<%= gaId %>");',
      '</script>',
      '</head>',
      '',
    ].join('\n');
    write(root, 'WEB-INF/views/head.jsp', view);
    const pairs = extractScripts(root, ['WEB-INF/views/head.jsp'], out);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]!.originalPath).toBe('WEB-INF/views/head.jsp');
    expect(pairs[0]!.tempPath.endsWith('head.jsp.lexcode.js')).toBe(true);
    const text = readFileSync(pairs[0]!.tempPath, 'utf8');
    sameShape(view, text);
    expect(lines(text)[3]).toMatch(/^ {2}gtag\("config", "_ {10}"\);$/);
  });

  it('blanks JSP tags and EL inside a script', () => {
    const el = 'var id = ${user.id};';
    expect(blankJspTags(el)).toBe('var id = _' + ' '.repeat('${user.id}'.length - 1) + ';');
    expect(blankJspTags(el).length).toBe(el.length);
    expect(blankJspTags('v = #{bean.v};')).toBe('v = _' + ' '.repeat('#{bean.v}'.length - 1) + ';');
    expect(blankJspTags('s = "<%= name %>";')).toBe('s = "_' + ' '.repeat('<%= name %>'.length - 1) + '";');
    for (const tag of ['<% if (x) { %>', '<%! int n = 0; %>', '<%@ include file="a.jspf" %>']) {
      expect(blankJspTags(`a(); ${tag} b();`)).toBe('a(); ' + ' '.repeat(tag.length) + ' b();');
    }
    // A comment runs to "--%>", not to the first "%>".
    const comment = '<%-- a %> b --%>';
    expect(blankJspTags(`a(); ${comment} b();`)).toBe('a(); ' + ' '.repeat(comment.length) + ' b();');
    expect(blankJspTags('plain();')).toBe('plain();');
  });

  describe('namespaced tags and CDATA markers in a JSP script body', () => {
    const pad = (tag: string): string => '_' + ' '.repeat(tag.length - 1);

    it('blanks a tag inside a JavaScript string to a padded underscore, so the string still parses', () => {
      const tag = '<h:outputText value="#{msgs.cdfm_newflag}"/>';
      expect(blankJspTags(`var newFlag = "${tag}";`)).toBe(`var newFlag = "${pad(tag)}";`);
      const single = `<h:outputText value='#{authorMessages.im_description}' escape="false"/>`;
      expect(blankJspTags(`add('${single}');`)).toBe(`add('${pad(single)}');`);
    });

    it('blanks a tag in expression position to an identifier', () => {
      const tag = '<c:out value="${x}"/>';
      expect(blankJspTags(`var a = ${tag};`)).toBe(`var a = ${pad(tag)};`);
    });

    it('blanks every form: open, close, self-closing and any prefix (h f c fmt jsp x)', () => {
      for (const tag of ['<h:outputText value="a">', '</h:outputText>', '<f:view/>', '<c:if test="${a > b}">', '</c:if>', '<fmt:message key="k"/>', '<jsp:expression>', '</jsp:expression>', '<x:y.z-w q="1">']) {
        const out = blankJspTags(`a(); ${tag} b();`);
        expect(out).toBe(`a(); ${pad(tag)} b();`);
        expect(out.length).toBe(`a(); ${tag} b();`.length);
      }
    });

    it('steps over a ">" and a "<script>" inside a quoted attribute value', () => {
      const tag = '<h:outputText value="<script>" escape="false" />';
      expect(blankJspTags(`x = ${tag}; y();`)).toBe(`x = ${pad(tag)}; y();`);
      const gt = '<c:if test="${a > b}">';
      expect(blankJspTags(`${gt} z();`)).toBe(`${pad(gt)} z();`);
    });

    it('keeps line breaks across a multi-line tag', () => {
      const tag = '<h:outputText\n    value="#{a.b}"\n    rendered="true"/>';
      const out = blankJspTags(`a();\n${tag}\nb();`);
      expect(out.split('\n').length).toBe(`a();\n${tag}\nb();`.split('\n').length);
      expect(out).toBe(`a();\n_${' '.repeat('<h:outputText'.length - 1)}\n${' '.repeat('    value="#{a.b}"'.length)}\n${' '.repeat('    rendered="true"/>'.length)}\nb();`);
    });

    it('blanks the CDATA markers to spaces and keeps what is between them', () => {
      expect(blankJspTags('<![CDATA[\nvar a = 1 < 2;\n]]>')).toBe(`${' '.repeat(9)}\nvar a = 1 < 2;\n${' '.repeat(3)}`);
    });

    it('leaves a comparison, an unprefixed HTML tag, a ternary, a tag that never closes and a stray "]]>" alone', () => {
      for (const src of ['if (a < b:c) {}', 'if (a <b) {}', 'var h = "<div class=\'a\'>x</div>";', 'x = c ? a<b : d;', 'x = "<h:outputText value=\'a\'";', 'if (a[b[0]]>c) {}', 'var u = "http://x"; if (a<b) {}', 'c?a<b:d; foo(y=>y);']) {
        expect(blankJspTags(src)).toBe(src);
      }
    });

    it('works end to end: the extracted copy of a JSP keeps the line and has no JSF tag left', () => {
      const view = ['<%@ taglib uri="x" prefix="h" %>', '<script>', '  var m = "<h:outputText value="#{msgs.m}"/>"; track("x");', '</script>', ''].join('\n');
      const r = blankOutsideScripts(view, { jsp: true })!;
      sameShape(view, r.text);
      expect(lines(r.text)[2]).toBe(`  var m = "${pad('<h:outputText value="#{msgs.m}"/>')}"; track("x");`);
    });
  });

  it('ends EL at its closing brace, past nested braces and quoted braces', () => {
    const quoted = "x = ${fn:join(map['}'], \"{\")}; y();";
    const inner = "${fn:join(map['}'], \"{\")}";
    expect(blankJspTags(quoted)).toBe('x = _' + ' '.repeat(inner.length - 1) + '; y();');
    const braces = 'k = ${a ? {1} : 2}; z();';
    expect(blankJspTags(braces)).toBe('k = _' + ' '.repeat('${a ? {1} : 2}'.length - 1) + '; z();');
  });

  it('leaves an escaped EL opener as the literal it is', () => {
    expect(blankJspTags('s = "\\${not el}";')).toBe('s = "\\${not el}";');
  });

  it('blanks an unterminated tag, comment or EL to the end of the block', () => {
    expect(blankJspTags('a(); <% b(')).toBe('a(); ' + ' '.repeat('<% b('.length));
    expect(blankJspTags('a(); <%-- b %>')).toBe('a(); ' + ' '.repeat('<%-- b %>'.length));
    expect(blankJspTags('a(); ${b')).toBe('a(); _' + ' '.repeat('${b'.length - 1));
  });

  it('keeps line numbers across a multi-line JSP tag', () => {
    const view = [
      '<script>',
      '  const a = <%= foo(',
      '    bar) %>;',
      '  <%-- a note',
      '  over lines --%>',
      '  const b = ${x',
      '  .y};',
      '  track("after");',
      '</script>',
      '',
    ].join('\n');
    const r = blankOutsideScripts(view, { jsp: true })!;
    sameShape(view, r.text);
    expect(lines(r.text)[1]).toBe('  const a = _' + ' '.repeat('<%= foo('.length - 1));
    expect(lines(r.text)[2]).toBe(' '.repeat('    bar) %>'.length) + ';');
    expect(lines(r.text)[3]).toBe(' '.repeat('  <%-- a note'.length));
    expect(lines(r.text)[4]).toBe(' '.repeat('  over lines --%>'.length));
    expect(lines(r.text)[5]).toBe('  const b = _' + ' '.repeat('${x'.length - 1));
    expect(lines(r.text)[6]).toBe(' '.repeat('  .y}'.length) + ';');
    expect(lines(r.text)[7]).toBe('  track("after");');
  });

  it('a .tag file and a .jspf fragment are extracted like a .jsp', () => {
    const root = tmp();
    const out = tmp();
    write(root, 'WEB-INF/tags/ga.tag', '<script>ga("send", "${page}");</script>');
    write(root, 'WEB-INF/views/foot.jspf', '<script>ga("send", "${page}");</script>');
    const pairs = extractScripts(root, ['WEB-INF/tags/ga.tag', 'WEB-INF/views/foot.jspf'], out);
    expect(pairs).toHaveLength(2);
    expect(pairs[0]!.tempPath.endsWith('ga.tag.lexcode.js')).toBe(true);
    expect(pairs[1]!.tempPath.endsWith('foot.jspf.lexcode.js')).toBe(true);
    for (const p of pairs) {
      const t = readFileSync(p.tempPath, 'utf8');
      expect(t).toContain('ga("send", "_');
      expect(t).not.toContain('${');
    }
  });

  it('blanks JSP syntax only in JSP files, never in an .html file or an .erb file', () => {
    const root = tmp();
    const out = tmp();
    write(root, 'a.html', '<script>var t = "${x}";</script>');
    write(root, 'b.jsp', '<script>var t = "${x}";</script>');
    write(root, 'c.erb', '<script>var t = "${x}";</script>');
    const pairs = extractScripts(root, ['a.html', 'b.jsp', 'c.erb'], out);
    const byOriginal = new Map(pairs.map((p) => [p.originalPath, readFileSync(p.tempPath, 'utf8')]));
    expect(byOriginal.get('a.html')).toContain('${x}');
    expect(byOriginal.get('c.erb')).toContain('${x}');
    expect(byOriginal.get('b.jsp')).not.toContain('${');
  });
});

describe('extension-less Ruby files', () => {
  function write(root: string, rel: string, body: string): void {
    const full = path.join(root, ...rel.split('/'));
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, body);
  }

  it('copies an extension-less Ruby file whole', () => {
    const root = tmp();
    const out = tmp();
    const fastfile = 'lane :beta do\n  upload_to_testflight\nend\n';
    write(root, 'fastlane/Fastfile', fastfile);
    write(root, 'Gemfile', 'source "https://rubygems.org"\n');
    const pairs = extractScripts(root, ['fastlane/Fastfile', 'Gemfile'], out);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]!.originalPath).toBe('fastlane/Fastfile');
    expect(pairs[0]!.tempPath).toBe(path.join(path.resolve(out), 'fastlane', 'Fastfile.lexcode.rb'));
    expect(readFileSync(pairs[0]!.tempPath, 'utf8')).toBe(fastfile);
    expect(existsSync(path.join(out, 'Gemfile.lexcode.rb'))).toBe(false);
  });

  it('copies Rakefile, Appfile and Capfile as well, and only by the exact base name', () => {
    const root = tmp();
    const out = tmp();
    const names = ['Rakefile', 'fastlane/Appfile', 'Capfile', 'rakefile', 'docs/Fastfile.md', 'Fastfiles', 'MyFastfile'];
    for (const n of names) write(root, n, 'x = 1\n');
    const pairs = extractScripts(root, names, out);
    expect(pairs.map((p) => p.originalPath).sort()).toEqual(['Capfile', 'Rakefile', 'fastlane/Appfile']);
  });

  it('copies a .rake, .ru or .gemspec file whole too, since the engine reads only .rb as Ruby', () => {
    const root = tmp();
    const out = tmp();
    const names = ['lib/tasks/a.rake', 'config.ru', 'x.gemspec', 'lib/b.rb', 'lib/c.rakefile'];
    for (const n of names) write(root, n, 'x = 1\n');
    const pairs = extractScripts(root, names, out);
    expect(pairs.map((p) => p.originalPath).sort()).toEqual(['config.ru', 'lib/tasks/a.rake', 'x.gemspec']);
    expect(pairs.every((p) => p.tempPath.endsWith('.lexcode.rb'))).toBe(true);
    expect(pairs.every((p) => readFileSync(p.tempPath, 'utf8') === 'x = 1\n')).toBe(true);
  });

  it('skips an extension-less Ruby file that has gone since it was listed', () => {
    expect(extractScripts(tmp(), ['Fastfile'], tmp())).toEqual([]);
  });
});

describe('PHP files the engine will not take', () => {
  function write(root: string, rel: string, body: string): void {
    const full = path.join(root, ...rel.split('/'));
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, body);
  }

  it('copies a Drupal .module file whole', () => {
    const root = tmp();
    const out = tmp();
    const module = [
      '<?php',
      '',
      '/**',
      ' * @file',
      ' * Hooks for my_module.',
      ' */',
      '',
      'function my_module_cron() {',
      "  \\Drupal::httpClient()->get('https://example.org/feed');",
      '}',
      '',
    ].join('\n');
    write(root, 'modules/custom/my_module/my_module.module', module);
    const pairs = extractScripts(root, ['modules/custom/my_module/my_module.module'], out);
    expect(pairs).toEqual([
      {
        originalPath: 'modules/custom/my_module/my_module.module',
        tempPath: path.join(path.resolve(out), 'modules', 'custom', 'my_module', 'my_module.module.lexcode.php'),
      },
    ]);
    const copy = readFileSync(pairs[0]!.tempPath, 'utf8');
    expect(copy).toBe(module);
    // The copy is the file itself, so a finding at line 9 of the copy is line 9 of my_module.module
    // (the path is mapped back in scan; test/scan.e2e.test.ts runs it through the engine).
    expect(lines(copy)[8]).toBe(lines(module)[8]);
    expect(lines(copy)[8]).toContain('httpClient()');
  });

  it('copies .inc, .theme and .install that start with <?php, after a BOM or leading blank lines', () => {
    const root = tmp();
    const out = tmp();
    const bodies: Record<string, string> = {
      'includes/common.inc': '<?php\nfunction f() {}\n',
      'themes/olivero/olivero.theme': '\uFEFF<?php\nfunction olivero_preprocess_html(&$v) {}\n',
      'modules/m/m.install': '\n\n  <?php\nfunction m_install() {}\n',
      'includes/crlf.inc': '\uFEFF\t\r\n<?php\r\nfunction g() {}\r\n',
      'includes/UPPER.INC': '<?PHP function h() {}\n',
    };
    for (const [rel, body] of Object.entries(bodies)) write(root, rel, body);
    const pairs = extractScripts(root, Object.keys(bodies), out);
    expect(pairs.map((p) => p.originalPath).sort()).toEqual(Object.keys(bodies).sort());
    for (const p of pairs) {
      expect(p.tempPath).toBe(path.join(path.resolve(out), ...p.originalPath.split('/')) + '.lexcode.php');
      expect(readFileSync(p.tempPath, 'utf8')).toBe(bodies[p.originalPath]);
    }
  });

  it('does not copy an .inc that is not PHP', () => {
    const root = tmp();
    const out = tmp();
    const bodies: Record<string, string> = {
      'src/defines.inc': '{ Pascal include }\nconst\n  MaxItems = 100;\n',
      'asm/macros.inc': '; nasm macros\n%define PHP 1\n',
      'c/table.inc': '/* <?php in a C comment */\n{ 1, 2, 3 },\n',
      'tpl/short.inc': '<? echo 1; ?>\n',
      'tpl/near.inc': '<?phpx\n',
      'tpl/empty.module': '',
    };
    for (const [rel, body] of Object.entries(bodies)) write(root, rel, body);
    expect(extractScripts(root, Object.keys(bodies), out)).toEqual([]);
    expect(existsSync(path.join(out, 'src', 'defines.inc.lexcode.php'))).toBe(false);
  });

  it('leaves a .php, .phtml or .tpl file to the engine, which reads them as PHP', () => {
    const root = tmp();
    const out = tmp();
    const names = ['src/a.php', 'views/b.phtml', 'views/c.tpl'];
    for (const n of names) write(root, n, '<?php\n$x = 1;\n');
    expect(extractScripts(root, names, out).filter((p) => p.tempPath.endsWith('.lexcode.php'))).toEqual([]);
  });

  it('skips a .module file that has gone since it was listed', () => {
    expect(extractScripts(tmp(), ['gone.module'], tmp())).toEqual([]);
  });
});

describe('PHP, Blade and Twig views', () => {
  function write(root: string, rel: string, body: string): void {
    const full = path.join(root, ...rel.split('/'));
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, body);
  }
  /** What an output tag becomes: `_` padded with spaces to its length. */
  const pad = (tag: string): string => '_' + ' '.repeat(tag.length - 1);
  /** What any other tag becomes: spaces of its length. */
  const sp = (tag: string): string => ' '.repeat(tag.length);
  function extractOne(rel: string, body: string): { originalPath: string; tempPath: string; text: string }[] {
    const root = tmp();
    const out = tmp();
    write(root, rel, body);
    return extractScripts(root, [rel], out).map((p) => ({ ...p, text: readFileSync(p.tempPath, 'utf8') }));
  }

  describe('PHP views', () => {
    it('no block from a script inside a PHP string', () => {
      const src = `<?php echo "<script>gtag('config','x');</script>";`;
      expect(extractOne('lib/output.php', src)).toEqual([]);
      expect(blankOutsideScripts(src, { php: true })).toBeNull();
      // Without the PHP regions blanked, the string's <script> would be a block.
      expect(blankOutsideScripts(src)).not.toBeNull();
    });

    it('extracts an inline script from a PHP view', () => {
      const src = "<html><script>gtag('config', '<?= $gaId ?>');</script></html>";
      const pairs = extractOne('views/head.php', src);
      expect(pairs).toHaveLength(1);
      expect(pairs[0]!.originalPath).toBe('views/head.php');
      expect(pairs[0]!.tempPath.endsWith('head.php.lexcode.js')).toBe(true);
      expect('<?= $gaId ?>'.length).toBe(12);
      expect(pairs[0]!.text).toBe(sp('<html><script>') + "gtag('config', '" + pad('<?= $gaId ?>') + "');" + sp('</script></html>'));
      expect(pairs[0]!.text).toContain('gtag(');
    });

    it("extracts from a .phtml view the same way, and leaves an .html file's PHP-looking text alone", () => {
      const src = '<script>var u = "<?= $u ?>";</script>';
      expect(extractOne('views/a.phtml', src)[0]!.text).toBe(sp('<script>') + `var u = "${pad('<?= $u ?>')}";` + sp('</script>'));
      expect(extractOne('views/a.html', src)[0]!.text).toContain('<?= $u ?>');
    });

    it('blanks a PHP statement tag inside a script', () => {
      const tag = '<?php if ($x): ?>';
      expect(blankPhpTags(`a(); ${tag} b();`)).toBe(`a(); ${sp(tag)} b();`);
      for (const t of ['<?php endif; ?>', '<? foreach ($rows as $r): ?>', '<?PHP } ?>']) {
        expect(blankPhpTags(`a(); ${t} b();`)).toBe(`a(); ${sp(t)} b();`);
      }
      expect(blankPhpTags('s = "<?= $name ?>";')).toBe(`s = "${pad('<?= $name ?>')}";`);
      expect(blankPhpTags('plain();')).toBe('plain();');
    });

    it('blanks a <?php echo or print tag as the output tag it is', () => {
      for (const t of ['<?php echo $gaId; ?>', '<?php print($x) ?>', '<? echo $x ?>', '<?PHP\n  ECHO $x;\n?>', '<?print($x)?>']) {
        expect(blankPhpTags(`a = ${t};`), t).toBe(`a = ${pad(t).replace(/ /g, (s, i: number) => (t[i] === '\n' ? '\n' : s))};`);
      }
      // A statement tag still becomes spaces, and so does a name that only starts with echo or print.
      for (const t of ['<?php if ($x): ?>', '<?php echo_all(); ?>', '<?php printf("%d", $n); ?>', '<?phpecho $x ?>', '<?php $echo = 1; ?>']) {
        expect(blankPhpTags(`a(); ${t} b();`), t).toBe(`a(); ${sp(t)} b();`);
      }
      // Moodle's mod/scorm/loadSCO.php: the hole a spaced-out echo left was `win. == null`.
      const view = ['<script>', '  while (win.<?php echo $lmsapi; ?> == null) { win = win.parent; }', '</script>', ''].join('\n');
      const r = blankOutsideScripts(view, { php: true })!;
      expect(lines(r.text)[1]).toBe(`  while (win.${pad('<?php echo $lmsapi; ?>')} == null) { win = win.parent; }`);
    });

    it('an unclosed PHP region runs to the end of the file', () => {
      const classFile = [
        '<?php',
        'namespace App\\Output;',
        '',
        '// Writes <script>track()</script> into the page.',
        'final class Head',
        '{',
        '    public function html(): string',
        '    {',
        '        return <<<HTML',
        '<script>gtag("config", "x");</script>',
        'HTML;',
        '    }',
        '}',
        '',
      ].join('\n');
      expect(extractOne('src/Output/Head.php', classFile)).toEqual([]);
      const blanked = blankPhpRegions(classFile);
      sameShape(classFile, blanked);
      expect(blanked.trim()).toBe('');
      expect(blankPhpRegions('<p>a</p><?php $x = 1;')).toBe('<p>a</p>' + sp('<?php $x = 1;'));
    });

    it('blanks every PHP region, keeps the inline HTML, and keeps lengths and line breaks', () => {
      const src = '<p><?= $a ?></p>\r\n<? if ($b): ?>\n<i>x</i>\n<?php endif ?>\n';
      const out = blankPhpRegions(src);
      sameShape(src, out);
      expect(out).toBe(`<p>${sp('<?= $a ?>')}</p>\r\n${sp('<? if ($b): ?>')}\n<i>x</i>\n${sp('<?php endif ?>')}\n`);
    });

    it('a ?> inside a quoted string, a heredoc or a nowdoc does not end the region; one in a line comment does', () => {
      const quoted = `<?php $a = "?>"; $b = '?>'; $c = "\\"?>"; echo "<script>x()</script>"; ?>`;
      expect(blankPhpRegions(quoted).trim()).toBe('');
      expect(blankOutsideScripts(quoted, { php: true })).toBeNull();
      const heredoc = "<?php $h = <<<EOT\nIt's ?> <script>x()</script>\nEOT;\n$n = <<<'NOW'\n?>\n  NOW;\n?><script>y()</script>";
      const r = blankOutsideScripts(heredoc, { php: true })!;
      expect(r.text).toContain('y()');
      expect(r.text).not.toContain('x()');
      // In PHP a ?> ends a line comment and the PHP mode with it; an apostrophe in a comment opens no string.
      const comment = "<?php // don't ?><script>a()</script><?php /* it's */ ?><script>b()</script>";
      const c = blankOutsideScripts(comment, { php: true })!;
      expect(c.text.replace(/ /g, '')).toBe('a()b()');
      // A PHP 8 attribute is code, not a # comment.
      expect(blankPhpRegions("<?php #[Attr('?>')] ?>x")).toBe(sp("<?php #[Attr('?>')] ?>") + 'x');
    });

    it('takes the block body from the original text, so a tag inside it is blanked by blankPhpTags', () => {
      const view = [
        '<?php require "config.php"; ?>',
        '<script nonce="<?= $nonce ?>">',
        '  <?php if ($tracking): ?>',
        '  gtag("config", "<?= $ga ?>");',
        '  <?php endif; ?>',
        '</script>',
        '',
      ].join('\n');
      const r = blankOutsideScripts(view, { php: true })!;
      sameShape(view, r.text);
      expect(lines(r.text)[2]).toBe(sp('  <?php if ($tracking): ?>'));
      expect(lines(r.text)[3]).toBe(`  gtag("config", "${pad('<?= $ga ?>')}");`);
      expect(lines(r.text)[4]).toBe(sp('  <?php endif; ?>'));
      expect(lines(r.text)[0]).toBe(sp(lines(view)[0]!));
    });

    it('a block whose only content is a PHP region is not a block', () => {
      expect(blankOutsideScripts('<script><?php echo $inline_js; ?></script>', { php: true })).toBeNull();
    });
  });

  describe('Blade views', () => {
    it('Blade: output tags, json and directives', () => {
      expect(blankBladeTags('var d = @json($data);')).toBe(`var d = ${pad('@json($data)')};`);
      expect(blankBladeTags('var d = @js($data);')).toBe(`var d = ${pad('@js($data)')};`);
      expect(blankBladeTags("var p = '{{ $pixel }}';")).toBe(`var p = '${pad('{{ $pixel }}')}';`);
      expect(blankBladeTags('var x = {!! $x !!};')).toBe(`var x = ${pad('{!! $x !!}')};`);
      expect(blankBladeTags('a(); {{-- note --}} b();')).toBe(`a(); ${sp('{{-- note --}}')} b();`);
      expect(blankBladeTags('@if($x) a(); @endif')).toBe(`${sp('@if($x)')} a(); ${sp('@endif')}`);
      expect(blankBladeTags('@php $a = 1; @endphp a();')).toBe(`${sp('@php $a = 1; @endphp')} a();`);
      expect(blankBladeTags('@php($a = 1) a();')).toBe(`${sp('@php($a = 1)')} a();`);
      expect(blankBladeTags('@if ($user) a(); @endif')).toBe(`${sp('@if ($user)')} a(); ${sp('@endif')}`);
      expect(blankBladeTags('@auth a(); @endauth')).toBe(`${sp('@auth')} a(); ${sp('@endauth')}`);
      expect(blankBladeTags('plain();')).toBe('plain();');
    });

    it('a ) inside a quoted string does not end a directive argument list; nested parentheses do not either', () => {
      const d = "@if(str_contains($x, ')') && f($y))";
      expect(blankBladeTags(`${d} a();`)).toBe(`${sp(d)} a();`);
      const j = '@json(["a" => "(", \'b\' => \'\\\')\'])';
      expect(blankBladeTags(`v = ${j};`)).toBe(`v = ${pad(j)};`);
    });

    it('Blade: an email address is not a directive', () => {
      expect(blankBladeTags("const to = 'support@example.com';")).toBe("const to = 'support@example.com';");
      const view = ['<script>', "  const to = 'support@example.com';", '  const d = @json($data);', '</script>', ''].join('\n');
      const r = blankOutsideScripts(view, { blade: true })!;
      sameShape(view, r.text);
      expect(lines(r.text)[1]).toBe("  const to = 'support@example.com';");
      expect(lines(r.text)[2]).toBe(`  const d = ${pad('@json($data)')};`);
    });

    it('leaves an escaped directive and an escaped echo as Blade prints them', () => {
      // `@@if` prints `@if`; `@{{ x }}` prints `{{ x }}` for a client-side template.
      expect(blankBladeTags("s = '@@if';")).toBe("s = '@@if';");
      expect(blankBladeTags("t = '@{{ name }}';")).toBe("t = ' {{ name }}';");
    });

    it('blanks an unterminated echo, comment or @php to the end of the block', () => {
      expect(blankBladeTags('a(); {{ $b')).toBe(`a(); ${pad('{{ $b')}`);
      expect(blankBladeTags('a(); {{-- b')).toBe(`a(); ${sp('{{-- b')}`);
      expect(blankBladeTags('a(); @php $b = 1;')).toBe(`a(); ${sp('@php $b = 1;')}`);
    });

    it('blanks only the name of a directive whose "(" never closes, as Blade does', () => {
      expect(blankBladeTags('a(); @if($b')).toBe(`a(); ${sp('@if')}($b`);
      // An "@" in a JavaScript string that reads as a directive must not swallow the code after it.
      expect(blankBladeTags("s = 'call @support (24/7'; f(); g();")).toBe(`s = 'call ${sp('@support')} (24/7'; f(); g();`);
      expect(blankBladeTags('v = @json($a; f();')).toBe(`v = ${sp('@json')}($a; f();`);
      // An argument list that does not close within 10,000 characters is not one.
      const long = `@json([${"'x', ".repeat(2_100)}])`;
      expect(blankBladeTags(`v = ${long};`)).toBe(`v = ${sp('@json')}${long.slice('@json'.length)};`);
      const fits = `@json([${"'x', ".repeat(1_900)}])`;
      expect(blankBladeTags(`v = ${fits};`)).toBe(`v = ${pad(fits)};`);
    });

    it('Blade is matched before PHP', () => {
      const src = '<script>var d = @json($data); var u = "<?= $u ?>"; var p = "{{ $p }}";</script>';
      const blade = extractOne('resources/views/layouts/head.blade.php', src);
      expect(blade).toHaveLength(1);
      expect(blade[0]!.tempPath.endsWith('head.blade.php.lexcode.js')).toBe(true);
      expect(blade[0]!.text).toBe(
        sp('<script>') + `var d = ${pad('@json($data)')}; var u = "${pad('<?= $u ?>')}"; var p = "${pad('{{ $p }}')}";` + sp('</script>'),
      );
      // A plain .php view gets the PHP blanking only.
      const php = extractOne('views/head.php', src);
      expect(php[0]!.text).toContain('@json($data)');
      expect(php[0]!.text).toContain('{{ $p }}');
      expect(php[0]!.text).not.toContain('<?=');
      // Upper case is the same file type.
      expect(extractOne('views/HEAD.BLADE.PHP', src)[0]!.text).not.toContain('@json');
    });
  });

  describe('Twig templates', () => {
    it('Twig: output, statements and comments', () => {
      expect(blankTwigTags("fbq('init', '{{ pixel_id }}');")).toBe(`fbq('init', '${pad('{{ pixel_id }}')}');`);
      for (const tag of ['{% if x %}', '{%- endif -%}', '{# c #}', '{%~ set a = 1 ~%}']) {
        expect(blankTwigTags(`a(); ${tag} b();`)).toBe(`a(); ${sp(tag)} b();`);
      }
      expect(blankTwigTags('v = {{- x|json_encode|raw -}};')).toBe(`v = ${pad('{{- x|json_encode|raw -}}')};`);
      expect(blankTwigTags('plain();')).toBe('plain();');
    });

    it('a }} inside a quoted string or a hash literal does not end a Twig tag', () => {
      const hash = "{{ {'a': {'b': '}}'}}|json_encode|raw }}";
      expect(blankTwigTags(`v = ${hash}; w();`)).toBe(`v = ${pad(hash)}; w();`);
      const stmt = "{% set s = '%}' %}";
      expect(blankTwigTags(`${stmt} w();`)).toBe(`${sp(stmt)} w();`);
    });

    it('extracts a script from a .html.twig template', () => {
      const view = [
        '{% extends "base.html.twig" %}',
        '{% block javascripts %}',
        '<script>',
        "  fbq('init', '{{ pixel_id }}');",
        '  {# a comment #}',
        '</script>',
        '{% endblock %}',
        '',
      ].join('\n');
      const pairs = extractOne('templates/blog/show.html.twig', view);
      expect(pairs).toHaveLength(1);
      expect(pairs[0]!.tempPath.endsWith('show.html.twig.lexcode.js')).toBe(true);
      sameShape(view, pairs[0]!.text);
      expect(lines(pairs[0]!.text)[3]).toBe(`  fbq('init', '${pad('{{ pixel_id }}')}');`);
      expect(lines(pairs[0]!.text)[4]).toBe(sp('  {# a comment #}'));
    });

    it('blanks an unterminated tag or comment to the end of the block', () => {
      expect(blankTwigTags('a(); {{ b')).toBe(`a(); ${pad('{{ b')}`);
      expect(blankTwigTags('a(); {% if b')).toBe(`a(); ${sp('{% if b')}`);
      expect(blankTwigTags('a(); {# b')).toBe(`a(); ${sp('{# b')}`);
    });
  });

  it('keeps line numbers across a multi-line Blade directive and a multi-line Twig tag', () => {
    const blade = [
      '<script>',
      '  const cfg = @json([',
      "    'key' => $key,",
      '  ]);',
      '  {{-- a note',
      '  over lines --}}',
      '  @if (',
      '    $on',
      '  )',
      '  track("after");',
      '  @endif',
      '</script>',
      '',
    ].join('\n');
    const b = blankOutsideScripts(blade, { blade: true })!;
    sameShape(blade, b.text);
    expect(lines(b.text)[1]).toBe('  const cfg = ' + pad('@json(['));
    expect(lines(b.text)[2]).toBe(sp("    'key' => $key,"));
    expect(lines(b.text)[3]).toBe(sp('  ])') + ';');
    expect(lines(b.text)[4]).toBe(sp('  {{-- a note'));
    expect(lines(b.text)[5]).toBe(sp('  over lines --}}'));
    expect(lines(b.text)[6]).toBe(sp('  @if ('));
    expect(lines(b.text)[8]).toBe(sp('  )'));
    expect(lines(b.text)[9]).toBe('  track("after");');
    expect(lines(b.text)[10]).toBe(sp('  @endif'));

    const twig = [
      '<script>',
      '  const cfg = {{ {',
      "    'key': key",
      '  }|json_encode|raw }};',
      '  {% if on',
      '  %}',
      '  track("after");',
      '  {% endif %}',
      '</script>',
      '',
    ].join('\n');
    const t = blankOutsideScripts(twig, { twig: true })!;
    sameShape(twig, t.text);
    expect(lines(t.text)[1]).toBe('  const cfg = ' + pad('{{ {'));
    expect(lines(t.text)[2]).toBe(sp("    'key': key"));
    expect(lines(t.text)[3]).toBe(sp('  }|json_encode|raw }}') + ';');
    expect(lines(t.text)[4]).toBe(sp('  {% if on'));
    expect(lines(t.text)[5]).toBe(sp('  %}'));
    expect(lines(t.text)[6]).toBe('  track("after");');
  });

  it('Jinja handling is unchanged: a .jinja, .j2 or .njk copy keeps its tags, and no Twig blanking reaches it', () => {
    const src = '<script>gtag("config", "{{ gid }}"); {% if x %}a();{% endif %} {# c #}</script>';
    for (const rel of ['t/a.jinja', 't/b.jinja2', 't/c.j2', 't/d.njk']) {
      expect(extractOne(rel, src)[0]!.text, rel).toBe(sp('<script>') + 'gtag("config", "{{ gid }}"); {% if x %}a();{% endif %} {# c #}' + sp('</script>'));
    }
    expect(extractOne('t/e.twig', src)[0]!.text).not.toContain('{{');
  });

  describe('characters outside the Basic Multilingual Plane (an emoji is two UTF-16 units)', () => {
    it('an emoji in a PHP region before a block does not move the block', () => {
      const src = '<?php $s = "😀"; ?>\n<script>gtag("config", "x");</script>\n';
      const r = blankOutsideScripts(src, { php: true })!;
      sameShape(src, r.text);
      expect(r.text).toBe(sp('<?php $s = "😀"; ?>') + '\n' + sp('<script>') + 'gtag("config", "x");' + sp('</script>') + '\n');
      expect(extractOne('views/a.php', src)[0]!.text).toBe(r.text);
    });

    it('an emoji blanked in a tag inside a block, or in markup around it, keeps every later column', () => {
      const cases: [string, Parameters<typeof blankOutsideScripts>[1], string][] = [
        ['<script>var a = "<?= "😀" ?>"; gtag("c");</script>', { php: true }, ' gtag("c");'],
        ['<script>var a = @json("😀"); @if("😀") b(); @endif</script>', { blade: true }, ' b(); '],
        ['<script>var a = {{ "😀" }}; {# 😀 #} b();</script>', { twig: true }, ' b();'],
        ['<script>var a = "<%= "😀" %>"; b();</script>', { erb: true }, ' b();'],
        ['<script>var a = "${"😀"}"; b();</script>', { jsp: true }, ' b();'],
        ['<p>😀</p><script>b();</script><p>😀</p>', {}, 'b();'],
      ];
      for (const [src, opts, tail] of cases) {
        const r = blankOutsideScripts(src, opts)!;
        sameShape(src, r.text);
        const at = src.indexOf(tail.trim());
        expect(r.text.slice(at, at + tail.trim().length), src).toBe(tail.trim());
      }
    });

    describe('a character whose lowercase is longer (Turkish "İ", U+0130, lowercases to two UTF-16 units)', () => {
      it('an "İ" in markup before a block does not move or drop the block, in every view kind', () => {
        const src = '<p>İİ</p><script>gtag("c");</script>\n';
        expect('İ'.toLowerCase().length).toBe(2);
        for (const opts of [{}, { php: true }, { blade: true }, { twig: true }] as Parameters<typeof blankOutsideScripts>[1][]) {
          const r = blankOutsideScripts(src, opts);
          expect(r, JSON.stringify(opts)).not.toBeNull();
          sameShape(src, r!.text);
          expect(r!.text.indexOf('gtag('), JSON.stringify(opts)).toBe(src.indexOf('gtag('));
          expect(r!.text, JSON.stringify(opts)).toBe(sp('<p>İİ</p><script>') + 'gtag("c");' + sp('</script>') + '\n');
        }
      });

      it('after a PHP region, an "İ" in the markup does not drop the block', () => {
        const src = '<?php $a = 1; ?><p>İİ</p><script>gtag("c");</script>\n';
        const r = blankOutsideScripts(src, { php: true });
        expect(r).not.toBeNull();
        sameShape(src, r!.text);
        expect(r!.text.indexOf('gtag(')).toBe(src.indexOf('gtag('));
      });

      it('an "İ" inside the script body, or in a start-tag attribute value, keeps length and the body', () => {
        const cases: [string, string][] = [
          ['<script>var s = "İİ"; gtag("c");</script><p>x</p>', sp('<script>') + 'var s = "İİ"; gtag("c");' + sp('</script><p>x</p>')],
          ['<script data-x="İİ">gtag("c");</script><p>x</p>', sp('<script data-x="İİ">') + 'gtag("c");' + sp('</script><p>x</p>')],
          [
            '<script data-x="İ">a();</script><p>İ</p><script>gtag("c");</script>',
            sp('<script data-x="İ">') + 'a();' + sp('</script><p>İ</p><script>') + 'gtag("c");' + sp('</script>'),
          ],
        ];
        for (const opts of [{}, { php: true }, { blade: true }, { twig: true }] as Parameters<typeof blankOutsideScripts>[1][]) {
          for (const [src, expected] of cases) {
            const r = blankOutsideScripts(src, opts);
            expect(r, `${JSON.stringify(opts)} ${src}`).not.toBeNull();
            sameShape(src, r!.text);
            expect(r!.text, `${JSON.stringify(opts)} ${src}`).toBe(expected);
          }
        }
      });

      it('an "İ" between "</script" letters is not a close tag, as HTML matches tag names in ASCII only', () => {
        // "</scrİpt>" lowercases to "</scri̇pt>", which is not "</script": the block runs on to the real close.
        const src = '<script>a("</scrİpt>"); gtag("c");</script>';
        const r = blankOutsideScripts(src, {})!;
        sameShape(src, r.text);
        expect(r.text).toBe(sp('<script>') + 'a("</scrİpt>"); gtag("c");' + sp('</script>'));
      });
    });

    it('every blanker keeps length and line breaks on generated input, astral characters included', () => {
      // A fixed-seed generator, so a failure names an input that can be run again.
      let seed = 12_987;
      const rnd = (): number => (seed = (seed * 1_103_515_245 + 12_345) & 0x7fffffff) / 0x7fffffff;
      const tokens = [
        '<?php ', '<?=', '<?', '?>', "'", '"', '\\', '\n', '\r\n', '<<<EOT\n', "<<<'N'\n", 'EOT;', '  N', '/*', '*/', '//',
        '#', '#[', '`', '@if(', ')', '(', '{', '}', '{{', '}}', '{!!', '!!}', '{{--', '--}}', '@php', '@endphp', '@json(',
        '@@', '@{{', '@', '{%', '%}', '{#', '#}', '<%=', '<%', '%>', '${', '<c:out', '>', 'echo ', 'print ', ';',
        'é', '日', '😀', '𝒳', '\u{1F468}‍\u{1F469}', 'a', ' ', '\t', '<script>', '</script>', '<!--', '-->',
      ];
      const blankers: [string, (s: string) => string][] = [
        ['blankPhpRegions', blankPhpRegions],
        ['blankPhpTags', blankPhpTags],
        ['blankBladeTags', blankBladeTags],
        ['blankTwigTags', blankTwigTags],
        ['blankErbTags', blankErbTags],
        ['blankJspTags', blankJspTags],
      ];
      const variants: Parameters<typeof blankOutsideScripts>[1][] = [{}, { php: true }, { blade: true }, { twig: true }, { erb: true }, { jsp: true }];
      for (let n = 0; n < 2_000; n++) {
        let src = '';
        const count = 1 + Math.floor(rnd() * 30);
        for (let i = 0; i < count; i++) src += tokens[Math.floor(rnd() * tokens.length)];
        for (const [name, fn] of blankers) {
          const out = fn(src);
          expect(out.length, `${name} ${JSON.stringify(src)}`).toBe(src.length);
          for (let i = 0; i < src.length; i++) {
            if (src[i] === '\n' || src[i] === '\r' || out[i] === '\n' || out[i] === '\r') expect(out[i], `${name} ${JSON.stringify(src)}`).toBe(src[i]);
          }
        }
        for (const opts of variants) {
          const r = blankOutsideScripts(src, opts);
          if (r !== null) expect(r.text.length, `${JSON.stringify(opts)} ${JSON.stringify(src)}`).toBe(src.length);
        }
      }
    });
  });

  describe('on hostile input', () => {
    it('blankPhpRegions grows near-linearly over unterminated openers and quotes', () => {
      const m = measureScaling({
        small: 25_000,
        large: 250_000,
        setup: (n) => '<?php "?>'.repeat(n / 2) + "<? '".repeat(n / 2),
        run: (text) => blankPhpRegions(text),
      });
      expectNearLinear(m, 'blankPhpRegions');
    });

    it('blankBladeTags grows near-linearly over directives whose argument list never closes', () => {
      // Each opener's search for ")" is bounded at 10,000 characters, so a body of unclosed openers is not
      // quadratic. Both sizes are well past that bound (40,000 and 400,000 characters), so the cost grows with
      // the number of openers alone; openers sit 50 characters apart to keep each call short.
      const m = measureScaling({
        small: 400,
        large: 4_000,
        setup: (n) => ('@if((' + ' '.repeat(45) + "@a('(" + ' '.repeat(45)).repeat(n),
        run: (text) => blankBladeTags(text),
      });
      expectNearLinear(m, 'blankBladeTags');
    });

    it('blankBladeTags grows near-linearly over unterminated echoes and @php', () => {
      const m = measureScaling({
        small: 20_000,
        large: 200_000,
        setup: (n) => '@php '.repeat(n / 2) + '{{ '.repeat(n / 2),
        run: (text) => blankBladeTags(text),
      });
      expectNearLinear(m, 'blankBladeTags');
    });

    it('blankBladeTags grows near-linearly over directives whose argument list closes', () => {
      const m = measureScaling({
        small: 20_000,
        large: 200_000,
        setup: (n) => '@if($a) x(); @endif '.repeat(n / 4),
        run: (text) => blankBladeTags(text),
      });
      expectNearLinear(m, 'blankBladeTags');
    });

    it('blankTwigTags grows near-linearly over unbalanced openers', () => {
      const m = measureScaling({
        small: 20_000,
        large: 200_000,
        setup: (n) => '{{ ('.repeat(n / 2) + "{% '".repeat(n / 2),
        run: (text) => blankTwigTags(text),
      });
      expectNearLinear(m, 'blankTwigTags');
    });

    it('a PHP class file with no script costs one search and gives no copy', () => {
      const m = measureScaling({
        small: 20_000,
        large: 200_000,
        setup: (n) => '<?php\nnamespace A;\nclass B {\n' + "  public function f() { return 'x'; }\n".repeat(n) + '}\n',
        run: (text) => blankOutsideScripts(text, { php: true }),
      });
      expectNearLinear(m, 'blankOutsideScripts on a PHP class file');
      expect(m.result).toBeNull();
    });
  });
});

describe('Razor views and components', () => {
  function write(root: string, rel: string, body: string): void {
    const full = path.join(root, ...rel.split('/'));
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, body);
  }
  /** What an expression becomes: `_` padded with spaces to its length. */
  const pad = (s: string): string => '_' + ' '.repeat(s.length - 1);
  /** What any other Razor syntax becomes: spaces of its length. */
  const sp = (s: string): string => ' '.repeat(s.length);
  function extractOne(rel: string, body: string): { originalPath: string; tempPath: string; text: string }[] {
    const root = tmp();
    const out = tmp();
    write(root, rel, body);
    return extractScripts(root, [rel], out).map((p) => ({ ...p, text: readFileSync(p.tempPath, 'utf8') }));
  }

  describe('script blocks', () => {
    it('extracts a script from a Razor view with an implicit expression', () => {
      const src = ['<div>@Model.Title</div>', "<script>gtag('config', '@Model.GaId');</script>", ''].join('\n');
      const copies = extractOne('Views/Shared/_Layout.cshtml', src);
      expect(copies.map((c) => path.basename(c.tempPath))).toEqual(['_Layout.cshtml.lexcode.js']);
      expect(copies[0]!.originalPath).toBe('Views/Shared/_Layout.cshtml');
      sameShape(src, copies[0]!.text);
      const line = lines(copies[0]!.text)[1]!;
      expect(line).toBe(sp('<script>') + `gtag('config', '${pad('@Model.GaId')}');` + sp('</script>'));
      expect(pad('@Model.GaId')).toHaveLength(11);
      // A .razor component's script is read the same way.
      expect(extractOne('Pages/Index.razor', src)[0]!.tempPath.endsWith('Index.razor.lexcode.js')).toBe(true);
    });

    it('explicit and call expressions', () => {
      const raw = '@Html.Raw(Json.Serialize(Model.Config))';
      expect(blankRazorTags(`var d = ${raw};`)).toBe(`var d = ${pad(raw)};`);
      expect(blankRazorTags('var n = @(Model.A + 1);')).toBe(`var n = ${pad('@(Model.A + 1)')};`);
      const call = '@await Component.InvokeAsync("X")';
      expect(blankRazorTags(`var h = '${call}';`)).toBe(`var h = '${pad(call)}';`);
      // Indexers and member chains run on; a trailing period or a space ends the expression.
      expect(blankRazorTags('t = "@Localizer["Hi"].Value";')).toBe(`t = "${pad('@Localizer["Hi"].Value')}";`);
      expect(blankRazorTags("s = '@Model.Name.';")).toBe(`s = '${pad('@Model.Name')}.';`);
      expect(blankRazorTags("s = '@Model.Name (x)';")).toBe(`s = '${pad('@Model.Name')} (x)';`);
      expect(blankRazorTags('u = "@Url.Action("Index", "Home")";')).toBe(`u = "${pad('@Url.Action("Index", "Home")')}";`);
    });

    it('an email address is not an expression', () => {
      expect(blankRazorTags("const to = 'support@example.com';")).toBe("const to = 'support@example.com';");
      const view = ['<script>', "  const to = 'support@example.com';", '  var d = @Html.Raw(Json.Serialize(Model));', '</script>', ''].join('\n');
      const r = blankOutsideScripts(view, { razor: true })!;
      sameShape(view, r.text);
      expect(lines(r.text)[1]).toBe("  const to = 'support@example.com';");
      expect(lines(r.text)[2]).toBe(`  var d = ${pad('@Html.Raw(Json.Serialize(Model))')};`);
    });

    it('comments, code blocks and escapes', () => {
      expect(blankRazorTags('a(); @* note *@ b();')).toBe(`a(); ${sp('@* note *@')} b();`);
      expect(blankRazorTags('@{ var x = 1; } a();')).toBe(`${sp('@{ var x = 1; }')} a();`);
      expect(blankRazorTags("h = '@@handle';")).toBe("h = ' @handle';");
      // A Razor comment can hold anything, quotes and braces included.
      expect(blankRazorTags("a(); @* it's } *@ b();")).toBe(`a(); ${sp("@* it's } *@")} b();`);
    });

    it('a control block keeps only text and @: content', () => {
      const body = ['@if (Model.On) {', "<text>fbq('init', '@Model.Pixel');</text>", '} else {', "@:gtag('a');", '}'].join('\n');
      const out = lines(blankRazorTags(body));
      expect(out).toHaveLength(5);
      expect(out[0]).toBe(sp('@if (Model.On) {'));
      expect(out[1]).toBe(sp('<text>') + `fbq('init', '${pad('@Model.Pixel')}');` + sp('</text>'));
      expect(out[2]).toBe(sp('} else {'));
      expect(out[3]).toBe(`  gtag('a');`);
      expect(out[4]).toBe(' ');
    });

    it('every control keyword, chained else, catch and finally, and do ... while', () => {
      for (const head of ['@foreach (var p in Model.Pixels)', '@for (var i = 0; i < 3; i++)', '@while (more)', '@switch (x)', '@using (Html.BeginForm())', '@lock (gate)']) {
        expect(blankRazorTags(`${head} { <text>a();</text> } b();`)).toBe(`${sp(head)}${sp(' { <text>')}a();${sp('</text> }')} b();`);
      }
      const chain = '@if (a) { x; } else if (b) { y; } else { <text>c();</text> }';
      expect(blankRazorTags(`${chain} d();`)).toBe(`${sp('@if (a) { x; } else if (b) { y; } else { <text>')}c();${sp('</text> }')} d();`);
      const tryBlock = '@try { x(); } catch (Exception e) { y(); } finally { <text>z();</text> }';
      expect(blankRazorTags(`${tryBlock} w();`)).toBe(`${sp('@try { x(); } catch (Exception e) { y(); } finally { <text>')}z();${sp('</text> }')} w();`);
      expect(blankRazorTags('@do { <text>a();</text> } while (more); b();')).toBe(`${sp('@do { <text>')}a();${sp('</text> } while (more);')} b();`);
      // Code inside a control block is blanked, nested braces and all.
      expect(blankRazorTags('@if (a) { if (b) { c(); } } d();')).toBe(`${sp('@if (a) { if (b) { c(); } }')} d();`);
      // A text element nested in plain C# inside the block is kept too.
      expect(blankRazorTags('@if (a) { if (b) { <text>c();</text> } } d();')).toBe(`${sp('@if (a) { if (b) { <text>')}c();${sp('</text> } }')} d();`);
      // A keyword that only starts an identifier is an implicit expression.
      expect(blankRazorTags("v = '@iframeUrl';")).toBe(`v = '${pad('@iframeUrl')}';`);
    });

    it('a text element holding a control block with a text element of its own ends at its own closing tag', () => {
      // nopCommerce's _PickupPoints.cshtml: the inner </text> must not end the outer element.
      const body = [
        '@foreach (var p in Model.Points) {',
        '<text>',
        '  m.set("@p");',
        '  @if (first) {',
        '    <text>c(m);</text>',
        '  }',
        '  g();',
        '</text>',
        '}',
        'h();',
      ].join('\n');
      const out = lines(blankRazorTags(body));
      expect(out[0]!.trim()).toBe('');
      expect(out[1]!.trim()).toBe('');
      expect(out[2]).toBe(`  m.set("${pad('@p')}");`);
      expect(out[3]!.trim()).toBe('');
      expect(out[4]).toBe(`    ${sp('<text>')}c(m);${sp('</text>')}`);
      expect(out[5]!.trim()).toBe('');
      expect(out[6]).toBe('  g();');
      expect(out[7]!.trim()).toBe('');
      expect(out[8]!.trim()).toBe('');
      expect(out[9]).toBe('h();');
    });

    it('a quoted brace does not end a block', () => {
      expect(blankRazorTags('@{ var s = "}"; } a();')).toBe(`${sp('@{ var s = "}"; }')} a();`);
      expect(blankRazorTags("@{ var c = '}'; } a();")).toBe(`${sp("@{ var c = '}'; }")} a();`);
      // A verbatim string ends at a lone quote, a backslash escapes nothing, and "" is a quote.
      expect(blankRazorTags('@{ var p = @"C:\\}"""; } a();')).toBe(`${sp('@{ var p = @"C:\\}"""; }')} a();`);
      // An interpolated string's holes are code, and may hold strings of their own.
      expect(blankRazorTags('@{ var s = $"{(on ? "}" : "{")}"; } a();')).toBe(`${sp('@{ var s = $"{(on ? "}" : "{")}"; }')} a();`);
      // A raw string literal.
      expect(blankRazorTags('@{ var r = """ } """; } a();')).toBe(`${sp('@{ var r = """ } """; }')} a();`);
      // A comment.
      expect(blankRazorTags('@{ // }\n} a();')).toBe(`${sp('@{ // }')}\n  a();`);
      // A quoted ) does not end an explicit expression or a call.
      expect(blankRazorTags('v = @(f(")")); a();')).toBe(`v = ${pad('@(f(")"))')}; a();`);
      expect(blankRazorTags('v = @F(")"); a();')).toBe(`v = ${pad('@F(")")')}; a();`);
      // An apostrophe in markup inside a control block is not a char literal.
      expect(blankRazorTags("@if (a) { <p>It's here</p> } b();")).toBe(`${sp("@if (a) { <p>It's here</p> }")} b();`);
    });

    it('blanks an expression or block that never ends to the end of the body', () => {
      expect(blankRazorTags('a(); @(f(')).toBe(`a(); ${pad('@(f(')}`);
      expect(blankRazorTags('a(); @{ b();')).toBe(`a(); ${sp('@{ b();')}`);
      expect(blankRazorTags('a(); @* b();')).toBe(`a(); ${sp('@* b();')}`);
      expect(blankRazorTags('a(); @if (x) { b();')).toBe(`a(); ${sp('@if (x) { b();')}`);
      // A control keyword with no block blanks only its keyword and header.
      expect(blankRazorTags('@if (x) a();')).toBe(`${sp('@if (x)')} a();`);
      // An "@" that starts nothing is left.
      expect(blankRazorTags("s.split('@'); t = '@ x';")).toBe("s.split('@'); t = '@ x';");
    });

    it('keeps line numbers across a multi-line code block', () => {
      const src = [
        '<script>',
        '  @{',
        '    var id = Model.Id;',
        '    var label = "}";',
        '  }',
        "  gtag('config', '@id');",
        '  @(Model',
        '    .Name)',
        '</script>',
        '',
      ].join('\n');
      const copies = extractOne('Views/Home/Index.cshtml', src);
      expect(copies).toHaveLength(1);
      sameShape(src, copies[0]!.text);
      const out = lines(copies[0]!.text);
      for (const i of [1, 2, 3, 4]) expect(out[i]!.trim()).toBe('');
      expect(out[5]).toBe(`  gtag('config', '${pad('@id')}');`);
      expect(out[6]).toBe(`  ${pad('@(Model')}`);
      expect(out[7]).toBe(' '.repeat('    .Name)'.length));
      // CRLF line breaks are kept.
      const crlf = src.replace(/\n/g, '\r\n');
      const c = extractOne('Views/Home/Crlf.cshtml', crlf)[0]!.text;
      sameShape(crlf, c);
      expect(c.split('\r\n')[5]).toBe(`  gtag('config', '${pad('@id')}');`);
    });

    it('blanks Razor syntax only in .cshtml and .razor files', () => {
      const src = "<script>gtag('config', '@Model.GaId');</script>";
      expect(extractOne('tpl/page.html', src)[0]!.text).toContain('@Model.GaId');
      expect(extractOne('Views/X.CSHTML', src)[0]!.text).not.toContain('@Model');
    });
  });

  describe('the C# copy of @code and @functions blocks', () => {
    const component = [
      '@using Microsoft.Extensions.AI',
      '@page "/chat"',
      '@inject IChatClient Chat',
      '',
      '<h3>Chat</h3>',
      '<input @bind="prompt" />',
      '<button @onclick="Send">Send</button>',
      '<p>@reply</p>',
      '',
      '@code {',
      '    private string prompt = "";',
      '    private string reply = "";',
      '    private async Task Send() {',
      '        var r = await Chat.GetResponseAsync(prompt);',
      '        reply = r.Text;',
      '    }',
      '}',
      '',
    ].join('\n');

    it("a Razor component's code becomes one class", () => {
      const copies = extractOne('Components/Pages/Chat.razor', component);
      expect(copies.map((c) => path.basename(c.tempPath))).toEqual(['Chat.razor.lexcode.cs']);
      expect(copies[0]!.originalPath).toBe('Components/Pages/Chat.razor');
      const text = copies[0]!.text;
      const out = lines(text);
      expect(out[0]).toBe('using Microsoft.Extensions.AI;');
      // @page is a directive of the leading block: it becomes spaces, and the header goes on the next line.
      expect(out[1]!.trim()).toBe('');
      expect(out[2]!.startsWith('class __RazorCode {')).toBe(true);
      expect(out[2]!.slice('class __RazorCode {'.length)).toBe('        IChatClient Chat;');
      for (const i of [3, 4, 5, 6, 7, 8, 9]) expect(out[i]!.trim()).toBe('');
      expect(out[10]).toBe('    private string prompt = "";');
      expect(out[13]).toBe('        var r = await Chat.GetResponseAsync(prompt);');
      expect(out[15]).toBe('    }');
      expect(out[16]!.trim()).toBe('');
      expect(text.endsWith('}')).toBe(true);
      // Only the header and the field's semicolon add characters; every other line keeps its length.
      expect(text.slice(0, -1)).toHaveLength(component.length + 'class __RazorCode {'.length + 1);
      expect(razorCSharp(component)).toBe(text);
    });

    it('a routable component: @page and @rendermode before the usings do not take the header (amended Decision 9)', () => {
      const src = ['@page "/chat"', '@rendermode InteractiveServer', '@using Microsoft.Extensions.AI', '@inject IChatClient Chat', '@code { }', ''].join('\n');
      const out = lines(razorCSharp(src)!);
      expect(out[0]!.trim()).toBe('');
      expect(out[1]!.trim()).toBe('');
      expect(out[2]).toBe('using Microsoft.Extensions.AI;');
      expect(out[3]!.startsWith('class __RazorCode {')).toBe(true);
      expect(out[3]).toContain('IChatClient Chat;');
      // Every listed directive belongs to the leading block, a byte order mark before the first one too.
      const all = [
        '﻿@model IndexModel',
        '@layout MainLayout',
        '@attribute [Authorize]',
        '@implements IDisposable',
        '@inherits LayoutComponentBase',
        '@namespace App.Pages',
        '@typeparam TItem',
        '@preservewhitespace true',
        '@using App.Ai',
        '',
        '@functions { int A; }',
      ].join('\n');
      const a = lines(razorCSharp(all)!);
      for (let i = 0; i < 8; i++) expect(a[i]!.replace('﻿', '').trim()).toBe('');
      expect(a[8]).toBe('using App.Ai;');
      expect(a[10]!.startsWith('class __RazorCode {')).toBe(true);
      expect(a[10]).toContain(' int A; ');
    });

    it('no C# copy without a code block', () => {
      const page = ['@page "/"', '@inject IChatClient Chat', '<p>@Chat</p>', '<p>mail me@code{x}</p>', '@* @code { a(); } *@', ''].join('\n');
      expect(razorCSharp(page)).toBeNull();
      expect(extractOne('Pages/Plain.razor', page)).toEqual([]);
    });

    it('@functions in a .cshtml gives a copy', () => {
      const view = [
        '@using System.Net.Http',
        '@model IndexModel',
        '@functions {',
        '    string Pick(string s) { return s == "}" ? "a" : s; }',
        '}',
        '<p>@Pick("x")</p>',
        '@functions',
        '{',
        '    int N() => 1;',
        '}',
      ].join('\n');
      const copies = extractOne('Views/Home/Index.cshtml', view);
      expect(copies.map((c) => path.basename(c.tempPath))).toEqual(['Index.cshtml.lexcode.cs']);
      const out = lines(copies[0]!.text);
      expect(out[0]).toBe('using System.Net.Http;');
      expect(out[1]!.trim()).toBe('');
      expect(out[2]!.startsWith('class __RazorCode {')).toBe(true);
      expect(out[2]!.slice('class __RazorCode {'.length).trim()).toBe('');
      expect(out[3]).toBe('    string Pick(string s) { return s == "}" ? "a" : s; }');
      expect(out[4]!.trim()).toBe('');
      expect(out[5]!.trim()).toBe('');
      expect(out[8]).toBe('    int N() => 1;');
      expect(out[9]!.trim()).toBe('');
      expect(out[10]).toBe('}');
      expect(out).toHaveLength(11);
    });

    it('a using after the header stays spaces, and an @using control block is not a using', () => {
      const src = ['', '@using (Html.BeginForm()) {', '}', '@using Late.Namespace', '@code { int A; }', ''].join('\n');
      const out = lines(razorCSharp(src)!);
      expect(out[0]).toBe('');
      expect(out[1]!.startsWith('class __RazorCode {')).toBe(true);
      expect(out[1]).not.toContain('using');
      expect(out[3]!.trim()).toBe('');
      expect(out[4]).toBe('        int A;  ');
      expect(out).toHaveLength(6);
      // A line that is only a Razor comment (a licence header, a commented-out @using) counts as blank: it is not
      // read and does not take the header, so the usings after it are kept.
      const commented = lines(razorCSharp(['@* licence *@', '@* @using Commented.Out *@', '@using Kept', '@*', '  multi-line', '*@', '@code { }'].join('\n'))!);
      for (const i of [0, 1, 3, 4, 5]) expect(commented[i]!.trim()).toBe('');
      expect(commented[2]).toBe('using Kept;');
      expect(commented[6]!.startsWith('class __RazorCode {')).toBe(true);
      // A comment followed by code on its line is not only a comment: it takes the header.
      const mixed = lines(razorCSharp(['@* c *@ <p>x</p>', '@using Late', '@code { }'].join('\n'))!);
      expect(mixed[0]!.startsWith('class __RazorCode {')).toBe(true);
      expect(mixed[1]!.trim()).toBe('');
    });

    it('an HTML comment line before the code counts as blank, and a directive after a comment on its line is read', () => {
      const src = [
        '<!-- Copyright (c) Example. Licensed under MIT. -->', // 0: an HTML comment line
        '<!--',
        '  @using Commented.Html',
        '-->',
        '@* a *@ @using After.Comment', // 4: a Razor comment, then a using
        '@*', // 5
        '*@ @page "/x"', // 6: a multi-line comment closes, then a leading directive
        '<!-- x --> @inject IChatClient Chat', // 7: an HTML comment, then the first code-bearing directive
        '@code { int A; }',
      ].join('\n');
      const out = lines(razorCSharp(src)!);
      for (const i of [0, 1, 2, 3, 5, 6]) expect(out[i]!.trim()).toBe('');
      expect(out[4]).toBe('        using After.Comment;');
      expect(out[7]).toBe(`class __RazorCode {${' '.repeat('<!-- x --> @inject'.length)} IChatClient Chat;`);
      expect(out[8]).toBe('        int A;  ');
      expect(out[9]).toBe('}');
      expect(out.join('\n')).not.toContain('Commented');
    });

    it('an unclosed HTML comment before the code block runs to the block, whose line takes the header', () => {
      const out = lines(razorCSharp(['<!-- licence', '@using Hidden', '@code { int A; }'].join('\n'))!);
      expect(out[0]!.trim()).toBe('');
      expect(out[1]!.trim()).toBe('');
      expect(out[2]!.startsWith('class __RazorCode {')).toBe(true);
      expect(out[2]).toContain(' int A; ');
      expect(out[3]).toBe('}');
      // A Razor comment that never closes swallows the block as well: no code is left, so there is no copy.
      expect(razorCSharp(['@* licence', '@using Hidden', '@code { int A; }'].join('\n'))).toBeNull();
    });

    it('a file of only directives and blank lines around its code block gets one well-formed class', () => {
      for (const src of [
        ['@page "/"', '', '@using A', '@rendermode InteractiveServer @code {', '  int B;', '}', ''].join('\n'),
        ['', '@using A', '', '@code {', '  int B;', '}'].join('\n'),
        '@code{int B;}',
      ]) {
        const out = razorCSharp(src)!;
        expect(out.match(/class __RazorCode \{/g), src).toHaveLength(1);
        expect(out.endsWith('}'), src).toBe(true);
        expect(out).toContain('int B;');
        expect(lines(out)).toHaveLength(lines(src).length + (src.endsWith('\n') ? 0 : 1));
        // The class opens before the body: the header's line is at or before the line holding `int B;`.
        const ls = lines(out);
        expect(ls.findIndex((l) => l.includes('class __RazorCode {'))).toBeLessThanOrEqual(ls.findIndex((l) => l.includes('int B;')));
      }
    });

    it('a code block on a leading directive line still gets the class header', () => {
      // Every non-blank line is a leading directive, and the block starts on one of them.
      const out = lines(razorCSharp(['@using A', '@layout MainLayout @code { int A; }', ''].join('\n'))!);
      expect(out[0]).toBe('using A;');
      expect(out[1]!.startsWith('class __RazorCode {')).toBe(true);
      expect(out[1]).toContain(' int A; ');
      expect(out.join('\n').endsWith('}')).toBe(true);
      // The block opens on a using line itself.
      const own = lines(razorCSharp('@using A @code {\n  int B;\n}')!);
      expect(own.some((l) => l.includes('class __RazorCode {'))).toBe(true);
      expect(own[1]).toBe('  int B;');
    });

    it('@inject takes a space before its semicolon', () => {
      const out = lines(razorCSharp(['@inject ILogger<Foo> Logger ;', '@code { }'].join('\n'))!);
      expect(out[0]).toBe(`class __RazorCode {${' '.repeat('@inject'.length)} ILogger<Foo> Logger;`);
    });

    it('a Razor file can give both copies', () => {
      const src = component.replace('<p>@reply</p>', "<p>@reply</p><script>gtag('config', '@Model.Id');</script>");
      const copies = extractOne('Components/Pages/Chat.razor', src);
      expect(copies.map((c) => path.basename(c.tempPath))).toEqual(['Chat.razor.lexcode.js', 'Chat.razor.lexcode.cs']);
      expect(copies.every((c) => c.originalPath === 'Components/Pages/Chat.razor')).toBe(true);
      expect(lines(copies[0]!.text)[7]).toContain(`gtag('config', '${pad('@Model.Id')}');`);
      expect(lines(copies[1]!.text)[13]).toBe('        var r = await Chat.GetResponseAsync(prompt);');
    });
  });

  describe('on hostile input', () => {
    it('blankRazorTags grows near-linearly over openers that never close', () => {
      for (const unit of ['@(', '@{', '@if (', '@*', "@a('", '@if (x) { <text>', '@{ $"{']) {
        const m = measureScaling({
          small: 20_000,
          large: 200_000,
          setup: (n) => unit.repeat(Math.ceil(n / unit.length)),
          run: (text) => blankRazorTags(text),
        });
        expectNearLinear(m, `blankRazorTags over ${unit}`);
      }
    });

    it('blankRazorTags grows near-linearly over blocks and expressions that close', () => {
      const m = measureScaling({
        small: 20_000,
        large: 200_000,
        setup: (n) => '@if (a) { <text>x(@b.c);</text> } @{ var s = "}"; } '.repeat(n / 50),
        run: (text) => blankRazorTags(text),
      });
      expectNearLinear(m, 'blankRazorTags');
    });

    it('razorCSharp grows near-linearly over a long run of white space in an @using or @inject line', () => {
      // A using or inject pattern ending in two adjacent white-space quantifiers backtracks cubically or
      // quadratically over a run of spaces that ends in a character it rejects. The sizes are small because a
      // cubic regression takes minutes at 20,000 spaces; 10x the input still shows it as 1,000x the time.
      for (const [name, line] of [
        ['@using', (n: number) => `@using x${' '.repeat(n)}(`],
        ['@using, tabs then a semicolon', (n: number) => `@using x${' \t'.repeat(n / 2)};!`],
        ['@inject', (n: number) => `@inject a b${' '.repeat(n)}!`],
        ['@inject, spaces around a semicolon', (n: number) => `@inject a b${' '.repeat(n / 2)};${' '.repeat(n / 2)}!`],
      ] as const) {
        const m = measureScaling({
          small: 500,
          large: 5_000,
          setup: (n) => `${line(n)}\n@inject I X\n@code { }\n`,
          run: (text) => razorCSharp(text),
        });
        expectNearLinear(m, `razorCSharp over ${name}`);
      }
    });

    it('razorCSharp grows near-linearly over each worst-case line shape no other ratio test covers', () => {
      // FIX_BASE took 6 s on a using line of 4,000 spaces then `(` (cubic). Each shape is a long run that ends in
      // a character the pattern rejects; a quadratic or cubic scan shows as 100x or 1,000x the time for 10x the
      // input; the sizes are small, as above, so a cubic regression fails in seconds. (The @using and @inject
      // space runs are timed above, and a run of $ below.)
      for (const [name, text] of [
        ['@inject, many words then !', (n: number) => `@inject I X\n@inject${' a'.repeat(n / 2)}!\n@code { }\n`],
        ['@code, spaces then no brace', (n: number) => `@code${' '.repeat(n)}x\n@code { }\n`],
        ['a leading directive, spaces', (n: number) => `@page${' '.repeat(n)}\n@code { }\n`],
        ['a run of $@ in a code block', (n: number) => `@code { ${'$@'.repeat(n / 2)} }\n`],
        ['markup comments that open', (n: number) => `${'<!--'.repeat(n / 4)}\n@code { }\n`],
      ] as const) {
        const m = measureScaling({ small: 500, large: 5_000, setup: text, run: (t) => razorCSharp(t) });
        expect(m.result, name).not.toBeNull();
        expectNearLinear(m, `razorCSharp over ${name}`);
      }
    });

    it('blankRazorTags grows near-linearly over each worst-case shape no other ratio test covers', () => {
      for (const [name, body] of [
        ['a run of $ in an expression', (n: number) => `@( ${'$'.repeat(n)} )`],
        ['await then spaces', (n: number) => `@await${' '.repeat(n)}!`],
        ['else then spaces', (n: number) => `@if (a) { } else${' '.repeat(n)}!`],
      ] as const) {
        const m = measureScaling({ small: 500, large: 5_000, setup: body, run: (t) => blankRazorTags(t) });
        expect(m.result, name).toHaveLength(body(5_000).length);
        expectNearLinear(m, `blankRazorTags over ${name}`);
      }
    });

    it('razorCSharp and blankRazorTags grow near-linearly over a run of $ in code', () => {
      // Each `$` used to look for a string over the whole run that follows it, quadratic over a long run.
      const csharp = measureScaling({ small: 20_000, large: 200_000, setup: (n) => `@code { ${'$'.repeat(n)} }`, run: (t) => razorCSharp(t) });
      expectNearLinear(csharp, 'razorCSharp over a run of $');
      const tags = measureScaling({ small: 20_000, large: 200_000, setup: (n) => `@{ ${'$'.repeat(n)} }`, run: (t) => blankRazorTags(t) });
      expectNearLinear(tags, 'blankRazorTags over a run of $');
    });

    it('razorCSharp grows near-linearly over code blocks and over an unclosed one', () => {
      const m = measureScaling({
        small: 20_000,
        large: 200_000,
        setup: (n) => '@code { int A() { return 1; } }\n'.repeat(n / 32) + '@code { {{{{',
        run: (text) => razorCSharp(text),
      });
      expectNearLinear(m, 'razorCSharp');
    });
  });
});
