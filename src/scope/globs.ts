// The glob dialect of `include` and `exclude`: `*` (inside one path segment),
// `**` (across segments, and as `**/` also zero of them), `?` (one character
// that is not a slash). Every other character, brackets and braces included,
// is itself. A pattern matches a whole POSIX relative path, anchored at the
// repository root; there is no dependency.

const REGEX_SPECIAL = /[\\^$.*+?()[\]{}|/]/;

function escapeChar(ch: string): string {
  return REGEX_SPECIAL.test(ch) ? `\\${ch}` : ch;
}

/** The regular-expression source for a glob, without anchors. */
export function globToRegExpSource(glob: string): string {
  let out = '';
  let i = 0;
  while (i < glob.length) {
    const ch = glob[i] as string;
    if (ch === '*') {
      let j = i;
      while (glob[j] === '*') j++;
      if (j - i >= 2) {
        // `**/` also matches zero segments; a bare `**` is anything.
        if (glob[j] === '/') {
          out += '(?:.*/)?';
          j++;
        } else {
          out += '.*';
        }
      } else {
        out += '[^/]*';
      }
      i = j;
    } else if (ch === '?') {
      out += '[^/]';
      i++;
    } else {
      out += escapeChar(ch);
      i++;
    }
  }
  return out;
}

export function globToRegExp(glob: string): RegExp {
  return new RegExp(`^(?:${globToRegExpSource(glob)})$`, 's');
}

export function matchGlob(rel: string, glob: string): boolean {
  return globToRegExp(glob).test(rel);
}
