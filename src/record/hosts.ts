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

/** The text of a plain string literal, or null when the argument is code (a name, a concatenation, an interpolation). */
function literalText(text: string): string | null {
  const m = /^([a-zA-Z]{0,2})(['"`])([\s\S]*)\2$/.exec(text.trim());
  if (!m) return null;
  const prefix = (m[1] ?? '').toLowerCase();
  const quote = m[2] as string;
  const inner = m[3] as string;
  // An f-string interpolates; only the plain string prefixes are literals.
  if (prefix !== '' && !/^(r|u|b|br|rb|ur)$/.test(prefix)) return null;
  if (quote === '`' && inner.includes('${')) return null; // a JS template interpolates
  // An unescaped quote of the same kind inside means this was two literals joined, not one.
  if (new RegExp(`(^|[^\\\\])${quote === '`' ? '`' : quote}`).test(inner)) return null;
  return inner;
}

export type UrlLiteral = { literal: false } | { literal: true; host: string | null };

/**
 * Classify a metavariable's text. Not a literal: `{literal: false}`. A literal URL:
 * its host (`file:` is `localhost`), or `host: null` when it names none, as a relative path does.
 */
export function urlLiteral(text: string): UrlLiteral {
  const inner = literalText(text);
  if (inner === null) return { literal: false };
  const s = inner.trim();
  if (/^file:/i.test(s)) return { literal: true, host: LOCALHOST };
  const scheme = /^[a-z][a-z0-9+.-]*:\/\/([^/?#]*)/i.exec(s);
  const proto = scheme ?? /^\/\/([^/?#]*)/.exec(s);
  if (proto) {
    const authority = (proto[1] ?? '').split('@').pop() ?? '';
    const host = normalizeHost(authority);
    return { literal: true, host: host === '' ? null : host };
  }
  const bare = /^((?:[a-z0-9-]+\.)+[a-z]{2,})(?::\d+)?(?:[/?#]|$)/i.exec(s);
  if (bare) return { literal: true, host: normalizeHost(bare[1] as string) };
  return { literal: true, host: null };
}

/** The host of a string-literal URL, or null when the text is not a literal or names no host. */
export function hostOfLiteral(text: string): string | null {
  const u = urlLiteral(text);
  return u.literal ? u.host : null;
}
