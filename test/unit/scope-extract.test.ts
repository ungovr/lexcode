import { mkdirSync, mkdtempSync, readFileSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { blankErbTags, blankJspTags, blankOutsideScripts, extractScripts } from '../../src/scope/extract.js';
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
