import { describe, expect, it } from 'vitest';
import { hostOfLiteral, isOwnHost, urlLiteral } from '../../src/record/hosts.js';

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

  it('returns null for a literal with no host, such as a relative path', () => {
    expect(hostOfLiteral(`'/v1/items'`)).toBeNull();
    expect(urlLiteral(`'/v1/items'`)).toEqual({ literal: true, host: null });
    expect(urlLiteral('url')).toEqual({ literal: false });
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
