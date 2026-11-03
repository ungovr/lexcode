import type { Dependency } from '../types.js';

/** PEP 503 normalization: lowercase, runs of `-`, `_` and `.` become one `-`. */
export function normalizePypiName(name: string): string {
  return name.toLowerCase().replace(/[-_.]+/g, '-');
}

/** Percent-encode everything the purl specification does not leave bare. */
function enc(segment: string): string {
  return encodeURIComponent(segment).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function encPath(path: string): string {
  return path.split('/').map(enc).join('/');
}

/**
 * Build the package URL of a dependency. npm keeps its case and percent-encodes a
 * scope's `@`; PyPI is normalized per PEP 503; Go namespace and name are lowercased,
 * as the purl specification requires for the golang type.
 */
export function purlOf(d: Dependency): string {
  let type: string;
  let name: string;
  switch (d.ecosystem) {
    case 'npm':
      type = 'npm';
      name = d.name;
      break;
    case 'pypi':
      type = 'pypi';
      name = normalizePypiName(d.name);
      break;
    case 'golang':
      type = 'golang';
      name = d.name.toLowerCase();
      break;
  }
  const base = `pkg:${type}/${encPath(name)}`;
  return d.version ? `${base}@${enc(d.version)}` : base;
}
