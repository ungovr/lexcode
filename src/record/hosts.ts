// Which host a URL argument names, and whether that host is the operator's own.
// Own hosts are the sidecar's `own_hosts` plus loopback (`localhost`,
// `*.localhost`, 127.0.0.0/8, ::1, 0.0.0.0, and `file:` URLs). `profile.domains`
// in lexlint.yml is deliberately not read: it holds the counterparties the app
// talks to, so treating it as own hosts would hide real crawling.

const LOCALHOST = 'localhost';

/** Lowercase, drop brackets, a trailing dot and a port. */
function normalizeHost(raw: string): string {
  let h = raw.trim().toLowerCase();
  if (h.startsWith('[')) {
    const end = h.indexOf(']');
    return end > 0 ? h.slice(1, end) : h.slice(1);
  }
  // A bare IPv6 address holds several colons and no port.
  if (h.split(':').length === 2) h = h.slice(0, h.indexOf(':'));
  return h.replace(/\.+$/, '');
}

/** An `own_hosts` entry written as a host, a `*.host` wildcard or a URL, reduced to a bare host. */
function normalizeOwn(entry: string): string {
  let e = entry.trim().toLowerCase();
  e = e.replace(/^[a-z][a-z0-9+.-]*:\/\//, '');
  e = e.replace(/^\*\./, '');
  e = e.split(/[/?#]/)[0] ?? '';
  return normalizeHost(e);
}

function isLoopback(host: string): boolean {
  if (host === LOCALHOST || host.endsWith(`.${LOCALHOST}`)) return true;
  if (host === '::1' || host === '0.0.0.0') return true;
  return /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host);
}

/** True for loopback and for a host (or a subdomain of one) the operator lists in `own_hosts`. */
export function isOwnHost(host: string, ownHosts: string[]): boolean {
  const h = normalizeHost(host);
  if (h === '') return false;
  if (isLoopback(h)) return true;
  for (const entry of ownHosts) {
    const own = normalizeOwn(entry);
    if (own !== '' && (h === own || h.endsWith(`.${own}`))) return true;
  }
  return false;
}

const SWIFT_URL_WRAPPER = /^(?:URL|URI)\(\s*string\s*:?\s*("[\s\S]*")\s*\)[!?]?$/;
const QUOTELESS_URL = /^[a-z][a-z0-9+.-]*:\/\/[^\s"'`\\(){}$<>]+$/i;

export type UrlLiteral = { literal: false } | { literal: true; host: string | null };

/** How `urlLiteral` reads its text. */
export interface UrlLiteralOptions {
  /**
   * The text is the metavariable as the file holds it (`EngineMatch.source`), not as the engine prints it.
   * Only then is an interpolated string read: the printed text drops most holes' braces (`${host}` comes
   * back as `host`), so where a hole starts can only be read from the source (#12882).
   */
  source?: boolean;
}

/** A C# raw string literal (`"""..."""`, three or more quotes) starting at `t`'s first character: its text, or null. */
function rawLiteralText(t: string): string | null {
  const fence = /^"{3,}/.exec(t)?.[0] as string;
  const body = t.slice(fence.length);
  if (body.length < fence.length || !body.endsWith(fence)) return null;
  const inner = body.slice(0, body.length - fence.length);
  // A longer closing run, or the fence inside, means this was not one raw literal.
  if (inner.endsWith('"') || inner.includes(fence)) return null;
  return inner;
}

/** A C# verbatim string (`"..."` after its `@`, where `""` is a quote): its text, or null. */
function verbatimText(t: string): string | null {
  const m = /^"([\s\S]*)"$/.exec(t);
  if (!m) return null;
  const inner = m[1] as string;
  if (inner.replace(/""/g, '').includes('"')) return null; // two literals joined
  return inner.replace(/""/g, '"');
}

/**
 * The text of a C# interpolated string up to and including its first hole's `{` (all of it when it has no
 * hole), read from source; `rest` starts at the opening quote, after the `$`/`@` prefix. Null when the string
 * closes before the end of `rest` with no hole first (two literals joined, or a literal and code).
 *
 * The engine's range for an interpolated string stops before the closing quote, and before the closing `}`
 * when the string ends in a hole, so the slice is unclosed in every form: `$"https://c.example.com/{id` for
 * `$"https://c.example.com/{id}"`, `$"https://b.example/x` for one with no hole (engine-real.test.ts). A
 * closed string is read the same. Only the text before the first hole is checked: a hole's expression may
 * hold quotes of its own (`{Get("id")}`), and the host is written before it or chosen at run time.
 */
function interpolatedText(rest: string, verbatim: boolean): string | null {
  const fence = /^"{3,}/.exec(rest)?.[0] ?? '"';
  const body = rest.slice(fence.length);
  const brace = body.indexOf('{');
  const head = brace === -1 ? body : body.slice(0, brace);
  let text: string;
  if (fence.length > 1) {
    // A raw literal: the fence may close only at the very end.
    const close = head.indexOf(fence);
    if (close !== -1 && !(brace === -1 && close === head.length - fence.length)) return null;
    text = close === -1 ? head : head.slice(0, close);
    if (text.endsWith('"') && close !== -1) return null; // a longer closing run
  } else if (verbatim) {
    // `""` is a quote; a lone `"` closes the string, which may happen only at the very end.
    const m = /^((?:[^"]|"")*)("?)$/.exec(head);
    if (!m || (m[2] !== '' && brace !== -1)) return null;
    text = (m[1] as string).replace(/""/g, '"');
  } else {
    const m = /^((?:[^"\\\r\n]|\\.)*)("?)$/.exec(head);
    if (!m || (m[2] !== '' && brace !== -1)) return null;
    text = m[1] as string;
  }
  return brace === -1 ? text : `${text}{`;
}

/**
 * The text of a string literal in one of C#'s own forms, null when that form is code, or undefined when
 * `t` is in none of them: a verbatim string (`@"..."`, where `""` is a quote), a raw string literal
 * (`"""..."""`, three or more quotes) and an interpolated string (`$"..."`, `$@"..."`, `@$"..."`,
 * `$"""..."""`, `$$"""..."""`).
 *
 * On printed text a `$` in front always means code, with or without a closing quote: the engine prints an
 * interpolated string without its closing quote and with its braces dropped (`$"https://c.example/n/y`
 * for `$"https://c.example/{n}/y"`, `$"https://b.example/x` for a string with no hole), so a hole-free
 * interpolation cannot be told from one with a hole (#13012). On source text the interpolated string's
 * text up to its first hole is returned (`interpolatedText`), and `urlLiteral` reads the host written before it.
 *
 * A raw literal's `$` is its text (an OData `$metadata`, #13223): `urlLiteral` reads a `$` in the host
 * part as a hole, which is what it is in a Kotlin raw template (`"""https://$host/v1"""`).
 */
function csharpLiteralText(t: string, source: boolean): string | null | undefined {
  const interpolated = /^(?:\$+@?|@\$)(?=")/.exec(t);
  if (interpolated) return source ? interpolatedText(t.slice(interpolated[0].length), interpolated[0].includes('@')) : null;
  if (/^\$*"{3,}/.test(t)) {
    if (t.startsWith('$')) return null;
    return rawLiteralText(t);
  }
  if (!t.startsWith('@"')) return undefined;
  return verbatimText(t.slice(1));
}

/** The text of a plain string literal, or null when the argument is code (a name, a concatenation, an interpolation). */
function literalText(text: string, source: boolean): string | null {
  const csharp = csharpLiteralText(text.trim(), source);
  if (csharp !== undefined) return csharp;
  // A Python triple-quoted string with a prefix (`f"""...""""`, `r'''...'''`), read from source only.
  const triple = source ? /^([a-zA-Z]{1,2})("""|''')([\s\S]*)\2$/.exec(text.trim()) : null;
  if (triple) {
    const prefix = (triple[1] as string).toLowerCase();
    const inner = triple[3] as string;
    if (!/^(r|u|b|br|rb|f|rf|fr)$/.test(prefix) || inner.includes(triple[2] as string)) return null;
    return inner;
  }
  const m = /^([a-zA-Z]{0,2})(['"`])([\s\S]*)\2$/.exec(text.trim());
  if (!m) return null;
  const prefix = (m[1] ?? '').toLowerCase();
  const quote = m[2] as string;
  const inner = m[3] as string;
  // Only the plain string prefixes are literals in printed text; an f-string's holes are read from source.
  if (prefix !== '' && !(source ? /^(r|u|b|br|rb|ur|f|rf|fr)$/ : /^(r|u|b|br|rb|ur)$/).test(prefix)) return null;
  if (!source && quote === '`' && inner.includes('${')) return null; // a JS template interpolates
  // An unescaped quote of the same kind inside means this was two literals joined, not one.
  if (new RegExp(`(^|[^\\\\])${quote === '`' ? '`' : quote}`).test(inner)) return null;
  return inner;
}

/**
 * Where the first interpolation or template hole of a literal's text starts, or -1: JavaScript, Kotlin,
 * PHP and Groovy `${...}` and `$name`, Python, C# and PHP `{...}`, Ruby `#{...}`, `#@ivar` and `#$global`,
 * and Swift `\(...)`. Read as language-blind text: a hole marker past the host leaves the host as written
 * (a literal URL's path can hold a `$` or a `{`), and no host can hold one, so in the scheme or the host
 * part it always means the host is chosen at run time.
 */
const HOLE = /\$|#?\{|#@|\\\(/;

/**
 * Classify a metavariable's text. Not a literal: `{literal: false}`. A literal URL:
 * its host (`file:` is `localhost`), or `host: null` when it names none, as a relative path does.
 *
 * A literal whose text holds a hole (an interpolation, on source text) names the host written before the
 * first hole: `"https://api.example.com/v1/#{id}"` is `api.example.com`. One whose scheme or host part
 * holds the hole (`"https://#{host}/x"`, `"#{base}/x"`, `` `${base}/x` ``) chooses its host at run time and
 * is code, as is an authority with white space in it: a template output tag blanked in a view copy
 * (`"https://_          /x"`). A relative path (`"/v1/#{id}"`) still names none.
 */
export function urlLiteral(text: string, opts: UrlLiteralOptions = {}): UrlLiteral {
  const source = opts.source === true;
  const t = text.trim();
  // Swift's `URL(string: "...")` and Vapor's `URI(string: "...")` around one string: the string decides.
  // The pinned engine prints a bound one with the colon and space dropped (`URL(string"https://x")!`).
  const wrapped = SWIFT_URL_WRAPPER.exec(t);
  if (wrapped) return urlLiteral(wrapped[1] as string, opts);
  // A string the engine bound inside a sub-pattern comes back with no quotes (`https://x.example/a`). Only a
  // whole absolute URL is read that way: a bare word, a dotted name or anything with a space, a quote, a
  // bracket or a `$` stays code. An interpolated Swift string is never printed bare (it keeps a `""` in front).
  if (QUOTELESS_URL.test(t)) return urlLiteral(`"${t}"`, opts);
  const inner = literalText(text, source);
  if (inner === null) return { literal: false };
  const s = inner.trim();
  const hole = HOLE.exec(s)?.index ?? -1;
  const fixed = hole === -1 ? s : s.slice(0, hole);
  if (/^file:/i.test(fixed)) return { literal: true, host: LOCALHOST };
  const proto = /^[a-z][a-z0-9+.-]*:\/\/([^/?#]*)/i.exec(fixed) ?? /^\/\/([^/?#]*)/.exec(fixed);
  if (proto) {
    // The hole is in the authority, or right after it, so it may continue the host.
    if (hole !== -1 && proto[0].length === fixed.length) return { literal: false };
    const authority = (proto[1] ?? '').split('@').pop() ?? '';
    if (/\s/.test(authority)) return { literal: false };
    const host = normalizeHost(authority);
    return { literal: true, host: host === '' ? null : host };
  }
  const bare = /^((?:[a-z0-9-]+\.)+[a-z]{2,})(?::\d+)?(?:[/?#]|$)/i.exec(fixed);
  if (bare && (hole === -1 || /[/?#]$/.test(bare[0]))) return { literal: true, host: normalizeHost(bare[1] as string) };
  if (hole !== -1 && !fixed.startsWith('/')) return { literal: false };
  return { literal: true, host: null };
}

/** The host of a string-literal URL, or null when the text is not a literal or names no host. */
export function hostOfLiteral(text: string): string | null {
  const u = urlLiteral(text);
  return u.literal ? u.host : null;
}
