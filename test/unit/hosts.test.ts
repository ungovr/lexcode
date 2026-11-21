import { describe, expect, it } from 'vitest';
import { hostOfLiteral, isOwnHost, urlLiteral } from '../../src/record/hosts.js';
import { blankBladeTags, blankErbTags, blankJspTags, blankTwigTags } from '../../src/scope/extract.js';
import { blankRazorTags } from '../../src/scope/razor.js';

describe('hostOfLiteral', () => {
  it('reads the host of a quoted URL literal', () => {
    expect(hostOfLiteral(`'https://api.example.org/v1'`)).toBe('api.example.org');
    expect(hostOfLiteral('"http://localhost:3000"')).toBe('localhost');
    expect(hostOfLiteral('`https://Example.COM./x`')).toBe('example.com');
    expect(hostOfLiteral(`'//cdn.example.org/a.js'`)).toBe('cdn.example.org');
    expect(hostOfLiteral(`'example.org/path'`)).toBe('example.org');
    expect(hostOfLiteral(`'http://[::1]:8080/x'`)).toBe('::1');
    expect(hostOfLiteral(`u'https://api.example.org/'`)).toBe('api.example.org');
  });

  it('reads a file: URL as loopback', () => {
    expect(hostOfLiteral(`'file:///tmp/a'`)).toBe('localhost');
  });

  it('returns null for anything that is not a plain string literal', () => {
    expect(hostOfLiteral('url')).toBeNull();
    expect(hostOfLiteral('base + "/x"')).toBeNull();
    expect(hostOfLiteral('`https://${host}/x`')).toBeNull();
    expect(hostOfLiteral('f"https://{host}/x"')).toBeNull();
    expect(hostOfLiteral(`'https://' + host`)).toBeNull();
    expect(hostOfLiteral('')).toBeNull();
  });

  it("reads C#'s verbatim and raw string literals as literals, so a C# crawl keeps its host", () => {
    expect(hostOfLiteral('@"https://api.example.org/v1"')).toBe('api.example.org');
    expect(hostOfLiteral('@"https://api.example.org/a""b"')).toBe('api.example.org');
    expect(hostOfLiteral('"""https://api.example.org/v1"""')).toBe('api.example.org');
    expect(hostOfLiteral('""""https://api.example.org/"x""""')).toBe('api.example.org');
    expect(hostOfLiteral('"""\n    https://api.example.org/v1\n    """')).toBe('api.example.org');
    expect(urlLiteral('@"/v1/items"')).toEqual({ literal: true, host: null });
  });

  // The shapes the pinned engine (opengrep 1.33.1) prints for `$URL` in
  // `(HtmlAgilityPack.HtmlWeb $W).Load($URL, ...)`, as `abstract_content`: no closing quote, and the
  // braces of a hole dropped. A hole-free interpolation (the first two) cannot be told from one with a
  // hole (the third), so every one is code (#13012).
  it('reads every C# interpolated string as code, in the shapes the engine prints it', () => {
    for (const printed of [
      '$"https://interp.example.com/deals', // $"https://interp.example.com/deals"
      '$"https://b.example/x', // $"https://b.example/x"
      '$"https://c.example/n/y', // $"https://c.example/{n}/y"
      '$"https://l.example/{{id}}', // $"https://l.example/{{id}}"
      '$@"https://d.example/x', // $@"https://d.example/x"
      '@$"https://e.example/n', // @$"https://e.example/{n}"
      '$"""https://g.example/n', // $"""https://g.example/{n}"""
      '$"""https://h.example/x', // $"""https://h.example/x"""
      '$$"""https://k.example/n', // $$"""https://k.example/{{n}}"""
    ]) {
      expect(urlLiteral(printed), printed).toEqual({ literal: false });
    }
  });

  it('reads a C# interpolated string as code even when it comes with its closing quote and no hole', () => {
    expect(urlLiteral('$"https://api.example.org/v1"')).toEqual({ literal: false });
    expect(urlLiteral('$"https://api.example.org/{{id}}"')).toEqual({ literal: false });
    expect(urlLiteral('$@"https://api.example.org/v1"')).toEqual({ literal: false });
    expect(urlLiteral('@$"https://api.example.org/v1"')).toEqual({ literal: false });
    expect(urlLiteral('$"""https://api.example.org/v1"""')).toEqual({ literal: false });
    expect(urlLiteral('$$"""https://api.example.org/{id}"""')).toEqual({ literal: false });
  });

  it('reads two C# literals joined as code', () => {
    expect(urlLiteral('@"https://a.example.org" + @"/x"')).toEqual({ literal: false });
    expect(urlLiteral('$"https://a.example.org" + "/x"')).toEqual({ literal: false });
    expect(urlLiteral('"""https://a.example.org""" + """/x"""')).toEqual({ literal: false });
    expect(urlLiteral('"""https://a.example.org/x""""')).toEqual({ literal: false });
    // a raw string with no `$` in front and a `$` inside is a Kotlin template
    expect(urlLiteral('"""https://$host/v1"""')).toEqual({ literal: false });
  });

  // The `"""` arm reads every language's triple-quoted text, not only C#'s (#13012, C4).
  it('reads a triple-quoted string in a released language as before: a plain one is a literal, a prefixed or templated one is code', () => {
    expect(urlLiteral('"""https://api.example.org/v1"""')).toEqual({ literal: true, host: 'api.example.org' });
    expect(urlLiteral('"""/v1/items"""')).toEqual({ literal: true, host: null });
    // a Java text block
    expect(urlLiteral('"""\n        https://api.example.org/v1/items\n        """')).toEqual({ literal: true, host: 'api.example.org' });
    // Python: an f-string interpolates, and a raw string is not read as one literal
    expect(urlLiteral('f"""https://api.example.org/v1"""')).toEqual({ literal: false });
    expect(urlLiteral('r"""https://api.example.org/v1"""')).toEqual({ literal: false });
    // Kotlin string templates
    expect(urlLiteral('"""https://$host/v1"""')).toEqual({ literal: false });
    expect(urlLiteral('"""https://$host/v1""".trimIndent()')).toEqual({ literal: false });
  });

  // A Swift string with `\(...)` in its host part names its host at run time, as a JavaScript
  // template's `${...}` does: it is code, never a literal (#13199). Before, `"\(base)/x"` read as a
  // literal with no host, which buildRecord drops as an own-host fetch, and `"https://\(h)/x"` as the
  // host `\(h)`.
  it('reads a Swift string whose host part holds an interpolation as code', () => {
    expect(urlLiteral('"\\(base)/x"')).toEqual({ literal: false });
    expect(urlLiteral('"https://\\(h)/x"')).toEqual({ literal: false });
    expect(urlLiteral('"\\(base)"')).toEqual({ literal: false });
    expect(urlLiteral('"https://api.\\(region).example.com/x"')).toEqual({ literal: false });
    expect(urlLiteral('"https://\\(h):8080/x"')).toEqual({ literal: false });
    expect(urlLiteral('"api\\(region).example.com/x"')).toEqual({ literal: false });
    expect(urlLiteral('"//\\(h)/x"')).toEqual({ literal: false });
    expect(urlLiteral('"\\(scheme)://api.example.com/x"')).toEqual({ literal: false });
    expect(urlLiteral('"""\n    https://\\(h)/x\n    """')).toEqual({ literal: false });
    expect(hostOfLiteral('"https://\\(h)/x"')).toBeNull();
  });

  it('keeps the host of a Swift string whose interpolation is past the host, and of a plain one', () => {
    expect(urlLiteral('"https://api.example.com/x"')).toEqual({ literal: true, host: 'api.example.com' });
    expect(urlLiteral('"https://api.example.com/v1/items/\\(id)"')).toEqual({ literal: true, host: 'api.example.com' });
    expect(urlLiteral('"https://api.example.com/search?q=\\(q)"')).toEqual({ literal: true, host: 'api.example.com' });
    // a relative path names no host whatever follows it
    expect(urlLiteral('"/v1/items/\\(id)"')).toEqual({ literal: true, host: null });
  });

  // What the pinned engine (opengrep 1.33.1) prints for a Swift `$URL` bound to an interpolated string:
  // the `\(` and `)` are dropped and a quote is added in front, so `"\(base)/x"` comes back as
  // `""base/x"`. The doubled quote reads as two literals joined, so each is code; these pin that, since
  // the printed text alone would give the host `h` for `"https://\(h)/x"`.
  it('reads the engine-printed form of a Swift interpolated string as code', () => {
    for (const printed of [
      '""base/x"', // "\(base)/x"
      '""https://h/x"', // "https://\(h)/x"
      '""https://api.example.com/v1/id"', // "https://api.example.com/v1/\(id)"
      '""base"', // "\(base)"
      '""/v1/id"', // "/v1/\(id)"
      'URL(string""https://h/catalog")!', // URL(string: "https://\(h)/catalog")!
      '""""""\n        https://h/multi\n        """', // a multi-line string with `\(h)`
    ]) {
      expect(urlLiteral(printed), printed).toEqual({ literal: false });
    }
  });

  // Two more spellings the pinned engine prints for a Swift `$URL` (probed on swift-html-of-fetched-page
  // and swift-feed-read): a string bound inside a sub-pattern comes back with no quotes, and a bound
  // `URL(string: "https://x")!` comes back as `URL(string"https://x")!`, the colon and space dropped.
  // Each is read as the literal it prints, so a third-party host is evidence and an own host is dropped,
  // as a quoted literal is (#13199).
  it('reads a quote-less bound URL and a Swift URL(string:) wrapper around a literal as that literal', () => {
    expect(urlLiteral('https://plainfront.example.com/front')).toEqual({ literal: true, host: 'plainfront.example.com' });
    expect(urlLiteral('http://localhost:8080/x')).toEqual({ literal: true, host: 'localhost' });
    expect(urlLiteral('URL(string"https://plain.example.com/catalog")!')).toEqual({ literal: true, host: 'plain.example.com' });
    expect(urlLiteral('URL(string: "https://plain.example.com/catalog")!')).toEqual({ literal: true, host: 'plain.example.com' });
    expect(urlLiteral('URL(string: "https://plain.example.com/catalog")')).toEqual({ literal: true, host: 'plain.example.com' });
    expect(urlLiteral('URI(string"https://vapor.example.com/x")')).toEqual({ literal: true, host: 'vapor.example.com' });
    expect(urlLiteral('URL(string"/v1/items")!')).toEqual({ literal: true, host: null });
  });

  it('keeps reading a quote-less or wrapped value as code when it is not one plain URL', () => {
    expect(urlLiteral('URL(string: "https://\\(h)/x")!')).toEqual({ literal: false });
    expect(urlLiteral('URL(string: base)!')).toEqual({ literal: false });
    expect(urlLiteral('URL(string: "https://a.example.org" + path)!')).toEqual({ literal: false });
    expect(urlLiteral('URL(fileURLWithPath: "/tmp/a")')).toEqual({ literal: false });
    expect(urlLiteral('https://a.example.org/x + path')).toEqual({ literal: false });
    expect(urlLiteral('https://a.example.org/x".appending(y)')).toEqual({ literal: false });
    expect(urlLiteral('https://a.example.org/${id}')).toEqual({ literal: false });
    expect(urlLiteral('api.example.org/x')).toEqual({ literal: false });
    expect(urlLiteral('base.url')).toEqual({ literal: false });
  });

  it('returns null for a literal with no host, such as a relative path', () => {
    expect(hostOfLiteral(`'/v1/items'`)).toBeNull();
    expect(urlLiteral(`'/v1/items'`)).toEqual({ literal: true, host: null });
    expect(urlLiteral('url')).toEqual({ literal: false });
  });
});

// The metavariable's text as the file holds it (`urlLiteral(text, { source: true })`), sliced from the
// match's lines by the position the engine gives (#12882). The engine's printed text drops the braces of
// most interpolations, so only the source says where a hole starts: a host written out before the first
// hole is that host, and a hole in the scheme or host part makes the string code.
describe('urlLiteral on source text: the literal scheme and host before the first hole (#12882)', () => {
  const src = (t: string) => urlLiteral(t, { source: true });
  const host = (h: string) => ({ literal: true, host: h });
  const code = { literal: false };

  it('Ruby #{}: a hole past the host keeps the host; one in the host or at the start is code', () => {
    expect(src('"https://api.example.com/v1/#{id}"')).toEqual(host('api.example.com'));
    expect(src('"https://a.example.com/x/#@ivar"')).toEqual(host('a.example.com'));
    expect(src('"https://a.example.com/?q=#$global"')).toEqual(host('a.example.com'));
    expect(src('"#{base}/x"')).toEqual(code);
    expect(src('"https://#{host}/x"')).toEqual(code);
    expect(src('"https://#@host/x"')).toEqual(code);
    expect(src('"api#{env}.example.com/x"')).toEqual(code);
    expect(src('"#{scheme}://api.example.com/x"')).toEqual(code);
    expect(src('"https://api.example.com:#{port}/x"')).toEqual(code);
    expect(src('"/v1/items/#{id}"')).toEqual({ literal: true, host: null });
  });

  it('JavaScript templates', () => {
    expect(src('`https://api.example.com/v1/${id}`')).toEqual(host('api.example.com'));
    expect(src('`${base}/x`')).toEqual(code);
    expect(src('`https://${host}/x`')).toEqual(code);
    expect(src('`https://plain.example.com/v1`')).toEqual(host('plain.example.com'));
  });

  it('Python f-strings', () => {
    expect(src('f"https://api.example.com/v1/{id}"')).toEqual(host('api.example.com'));
    expect(src("F'https://up.example.com/{id}'")).toEqual(host('up.example.com'));
    expect(src('rf"https://rf.example.com/{id}"')).toEqual(host('rf.example.com'));
    expect(src('f"{base}/x"')).toEqual(code);
    expect(src('f"https://{host}/x"')).toEqual(code);
    expect(src('f"""https://{host}/x"""')).toEqual(code);
    expect(src('f"""https://tq.example.com/{id}"""')).toEqual(host('tq.example.com'));
  });

  it('Kotlin and PHP $ templates', () => {
    expect(src('"https://api.example.com/v1/$id"')).toEqual(host('api.example.com'));
    expect(src('"https://api.example.com/v1/${item.id}"')).toEqual(host('api.example.com'));
    expect(src('"$base/x"')).toEqual(code);
    expect(src('"https://$host/x"')).toEqual(code);
    expect(src('"https://${cfg.host}/x"')).toEqual(code);
    expect(src('"https://{$host}/x"')).toEqual(code);
    expect(src('"""https://raw.example.com/$id"""')).toEqual(host('raw.example.com'));
    expect(src('"""https://$host/v1"""')).toEqual(code);
  });

  // The engine's range for a C# interpolated string stops before its closing quote (and before a closing
  // `}` when the string ends in a hole), so the slice is unclosed: `$"https://c.example.com/{id` for
  // `$"https://c.example.com/{id}"`, `$"https://b.example/x` for a string with no hole (engine-real.test.ts).
  it('C# interpolated strings, as the engine slices them: no closing quote', () => {
    expect(src('$"https://api.example.com/v1/{id')).toEqual(host('api.example.com'));
    expect(src('$"https://h.example.com/{a}/{b}/z')).toEqual(host('h.example.com'));
    expect(src('$@"https://d.example.com/{id')).toEqual(host('d.example.com'));
    expect(src('@$"https://e.example.com/{id')).toEqual(host('e.example.com'));
    expect(src('$"""https://g.example.com/{id')).toEqual(host('g.example.com'));
    expect(src('$$"""https://k.example.com/{{id')).toEqual(host('k.example.com'));
    expect(src('$"https://plain.example.com/v1')).toEqual(host('plain.example.com'));
    expect(src('$"""https://rawplain.example.com/v1')).toEqual(host('rawplain.example.com'));
    expect(src('$@"https://vplain.example.com/v1')).toEqual(host('vplain.example.com'));
    expect(src('$"https://q.example.com/{Get("id")')).toEqual(host('q.example.com')); // a hole may hold quotes
    expect(src('$"https://{host}/x')).toEqual(code);
    expect(src('$"{baseUrl}/x')).toEqual(code);
    expect(src('$@"https://{host}/x')).toEqual(code);
    expect(src('$$"""https://{{host}}/x')).toEqual(code);
    expect(src('$"https://a.example.org" + "/x"')).toEqual(code);
    expect(src('$"https://a.example.org" + $"/x/{id')).toEqual(code);
    expect(src('$@"https://a.example.org" + "/x"')).toEqual(code);
  });

  it('C# interpolated strings closed as the file writes them read the same', () => {
    expect(src('$"https://api.example.com/v1/{id}"')).toEqual(host('api.example.com'));
    expect(src('$@"https://d.example.com/{id}"')).toEqual(host('d.example.com'));
    expect(src('$"""https://g.example.com/{id}"""')).toEqual(host('g.example.com'));
    expect(src('$$"""https://k.example.com/{{id}}"""')).toEqual(host('k.example.com'));
    expect(src('$"https://plain.example.com/v1"')).toEqual(host('plain.example.com'));
    expect(src('$"https://{host}/x"')).toEqual(code);
  });

  it('Swift \\( ) interpolation', () => {
    expect(src('"https://api.example.com/v1/\\(id)"')).toEqual(host('api.example.com'));
    expect(src('"\\(base)/x"')).toEqual(code);
    expect(src('"https://\\(h)/x"')).toEqual(code);
    expect(src('URL(string: "https://\\(h)/x")!')).toEqual(code);
    expect(src('URL(string: "https://swift.example.com/\\(id)")!')).toEqual(host('swift.example.com'));
  });

  it('a template output tag blanked in a view copy (`_` and spaces) in the host part is code', () => {
    expect(src('"https://_           /x"')).toEqual(code);
    expect(src('"https://api.example.com/_        "')).toEqual(host('api.example.com'));
  });

  it('a plain literal and code read as they always have', () => {
    expect(src('"https://plain.example.com/v1"')).toEqual(host('plain.example.com'));
    expect(src("'/v1/items'")).toEqual({ literal: true, host: null });
    expect(src("'not a url'")).toEqual({ literal: true, host: null });
    expect(src('base + "/x"')).toEqual(code);
    expect(src('url')).toEqual(code);
    expect(src('"https://a.example.org".format(x)')).toEqual(code);
  });

  it('the printed path still reads every interpolation as code, since the printed text has lost its holes', () => {
    expect(urlLiteral('f"https://api.example.com/v1/{id}"')).toEqual(code);
    expect(urlLiteral('`https://api.example.com/v1/${id}`')).toEqual(code);
    expect(urlLiteral('$"https://api.example.com/v1"')).toEqual(code);
    expect(urlLiteral('"""https://api.example.com/v1/#{id}"')).toEqual(code); // Ruby, as the engine prints it
  });
});

// In a view's script copy each template output tag is blanked to `_` and spaces (blankTwigTags, blankErbTags,
// blankJspTags, blankBladeTags, blankRazorTags). One that stands for the whole base URL (`"{{ api }}/x"`) chooses
// the host at run time: a hole, so the match stays a signal, never a relative path that drops silently (#12882).
describe('a template output tag blanked in a view copy is a hole (#12882)', () => {
  const host = (h: string) => ({ literal: true, host: h });
  const code = { literal: false };
  const views: [string, (s: string) => string, string, string][] = [
    ['Jinja and Twig', blankTwigTags, '{{ api }}', '{{ id }}'],
    ['Twig with a filter', blankTwigTags, '{{ config.api_base|e("js") }}', '{{ item.id }}'],
    ['ERB', blankErbTags, '<%= api_base %>', '<%= id %>'],
    ['JSP', blankJspTags, '${apiBase}', '${id}'],
    ['Blade', blankBladeTags, '{{ $apiBase }}', '{{ $id }}'],
    ['Razor', blankRazorTags, '@apiBase', '@Model.Id'],
  ];
  for (const [name, blankTags, base, id] of views) {
    it(`${name}: a tag for the base URL is a hole; one past a written host keeps the host`, () => {
      const read = (js: string) => {
        const copy = blankTags(js);
        const arg = /fetch\(([\s\S]*)\)/.exec(copy)?.[1] as string;
        return [urlLiteral(arg, { source: true }), urlLiteral(arg)];
      };
      expect(read(`fetch("${base}/x")`)).toEqual([code, code]);
      expect(read(`fetch("${base}")`)).toEqual([code, code]);
      expect(read(`fetch('${base}?q=1')`)).toEqual([code, code]);
      expect(read(`fetch("https://api.example.com/v1/${id}")`)).toEqual([host('api.example.com'), host('api.example.com')]);
      expect(read(`fetch("/v1/items/${id}")`)).toEqual([{ literal: true, host: null }, { literal: true, host: null }]);
    });
  }

  it('an underscore that is not followed by a space is text', () => {
    expect(urlLiteral('"https://my_host.example.com/x"', { source: true })).toEqual(host('my_host.example.com'));
    expect(urlLiteral('"_next/static/x.js"', { source: true })).toEqual({ literal: true, host: null });
  });
});

// A C# raw literal with no `$` in front is plain text, `$` and all: an OData `$metadata` address keeps its host.
// A `$` inside one is a hole only in the host part, where no host can hold one (Kotlin's `"""https://$host"""`).
describe('a raw literal that holds a $ (#13223)', () => {
  it('keeps the host written before the $, on the printed and the source path', () => {
    for (const opts of [undefined, { source: true }]) {
      expect(urlLiteral('"""https://services.odata.org/V4/Northwind/$metadata"""', opts)).toEqual({ literal: true, host: 'services.odata.org' });
      expect(urlLiteral('"""\n    https://services.odata.org/V4/$metadata?$format=json\n    """', opts)).toEqual({ literal: true, host: 'services.odata.org' });
      expect(urlLiteral('"""https://$host/v1"""', opts)).toEqual({ literal: false });
      expect(urlLiteral('"""$base/v1"""', opts)).toEqual({ literal: false });
    }
    // Kotlin's raw template as the engine prints it: the quotes doubled and the `$` tripled.
    expect(urlLiteral('""""""https://raw.example.com/$$$id"""')).toEqual({ literal: false });
  });
});

describe('isOwnHost', () => {
  it('treats loopback as own with no configuration', () => {
    for (const h of ['localhost', 'app.localhost', '127.0.0.1', '127.5.6.7', '::1', '0.0.0.0', 'LOCALHOST', '[::1]', 'localhost:3000']) {
      expect(isOwnHost(h, []), h).toBe(true);
    }
    expect(isOwnHost('128.0.0.1', [])).toBe(false);
    expect(isOwnHost('notlocalhost', [])).toBe(false);
    expect(isOwnHost('example.org', [])).toBe(false);
  });

  it('matches an own host and its subdomains, never a lookalike', () => {
    expect(isOwnHost('example.org', ['example.org'])).toBe(true);
    expect(isOwnHost('api.example.org', ['example.org'])).toBe(true);
    expect(isOwnHost('API.Example.Org.', ['Example.org'])).toBe(true);
    expect(isOwnHost('badexample.org', ['example.org'])).toBe(false);
    expect(isOwnHost('example.org.evil.test', ['example.org'])).toBe(false);
  });

  it('accepts own_hosts written as a URL or a wildcard', () => {
    expect(isOwnHost('api.example.org', ['https://example.org/'])).toBe(true);
    expect(isOwnHost('api.example.org', ['*.example.org'])).toBe(true);
    expect(isOwnHost('www.other.org', ['example.org:8443'])).toBe(false);
  });
});
