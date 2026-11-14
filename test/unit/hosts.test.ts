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

  it("reads C#'s verbatim, hole-free interpolated and raw string literals as literals, so a C# crawl keeps its host", () => {
    expect(hostOfLiteral('@"https://api.example.org/v1"')).toBe('api.example.org');
    expect(hostOfLiteral('@"https://api.example.org/a""b"')).toBe('api.example.org');
    expect(hostOfLiteral('$"https://api.example.org/v1"')).toBe('api.example.org');
    expect(hostOfLiteral('$"https://api.example.org/{{id}}"')).toBe('api.example.org');
    expect(hostOfLiteral('$@"https://api.example.org/v1"')).toBe('api.example.org');
    expect(hostOfLiteral('@$"https://api.example.org/v1"')).toBe('api.example.org');
    expect(hostOfLiteral('"""https://api.example.org/v1"""')).toBe('api.example.org');
    expect(hostOfLiteral('""""https://api.example.org/"x""""')).toBe('api.example.org');
    expect(hostOfLiteral('"""\n    https://api.example.org/v1\n    """')).toBe('api.example.org');
    expect(hostOfLiteral('$"""https://api.example.org/v1"""')).toBe('api.example.org');
    expect(hostOfLiteral('$$"""https://api.example.org/{id}"""')).toBe('api.example.org');
    expect(urlLiteral('@"/v1/items"')).toEqual({ literal: true, host: null });
  });

  it('reads a C# interpolation with a hole, or two C# literals joined, as code', () => {
    expect(urlLiteral('$"https://{host}/v1"')).toEqual({ literal: false });
    expect(urlLiteral('$@"https://{host}/v1"')).toEqual({ literal: false });
    expect(urlLiteral('$"""https://{host}/v1"""')).toEqual({ literal: false });
    expect(urlLiteral('$$"""https://{{host}}/v1"""')).toEqual({ literal: false });
    expect(urlLiteral('@"https://a.example.org" + @"/x"')).toEqual({ literal: false });
    expect(urlLiteral('$"https://a.example.org" + "/x"')).toEqual({ literal: false });
    expect(urlLiteral('"""https://a.example.org""" + """/x"""')).toEqual({ literal: false });
    expect(urlLiteral('"""https://a.example.org/x""""')).toEqual({ literal: false });
    // a raw string with no `$` in front and a `$` inside is a Kotlin template
    expect(urlLiteral('"""https://$host/v1"""')).toEqual({ literal: false });
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
