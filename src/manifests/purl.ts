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
 * as the purl specification requires for the golang type; a gem name is kept as written; a Maven `group:artifact` becomes the namespace and name, as written;
 * a Composer `vendor/name` is the namespace and name; a NuGet package Id is the name, as written;
 * a crate is the name, as written; a Swift package's `host/owner/repo` (or registry `scope/name`) is
 * the namespace and name, as written; a CocoaPods subspec `Pod/Sub` puts its path in the subpath
 * (`pkg:cocoapods/Pod@1.0#Sub`).
 */
export function purlOf(d: Dependency): string {
  let type: string;
  let name: string;
  let subpath = '';
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
    case 'gem':
      type = 'gem';
      name = d.name;
      break;
    case 'maven':
      // group:artifact becomes the purl namespace and name; Maven coordinates are case-sensitive and kept as written.
      type = 'maven';
      name = d.name.replace(':', '/');
      break;
    case 'composer':
      // vendor/name is the purl namespace and name; the reader has already lowercased it, as Composer compares names.
      type = 'composer';
      name = d.name;
      break;
    case 'nuget':
      // A NuGet package Id is compared case-insensitively; the purl keeps it as the manifest first writes it.
      type = 'nuget';
      name = d.name;
      break;
    case 'cargo':
      type = 'cargo';
      name = d.name;
      break;
    case 'swift':
      // The reader has already reduced the repository URL to host/owner/repo; kept as written, compared case-insensitively.
      type = 'swift';
      name = d.name;
      break;
    case 'cocoapods': {
      // A subspec keeps its path in the row's name; the purl names the pod and puts the path in the subpath.
      type = 'cocoapods';
      const slash = d.name.indexOf('/');
      name = slash < 0 ? d.name : d.name.slice(0, slash);
      subpath = slash < 0 ? '' : d.name.slice(slash + 1);
      break;
    }
  }
  const base = `pkg:${type}/${encPath(name)}`;
  const versioned = d.version ? `${base}@${enc(d.version)}` : base;
  return subpath ? `${versioned}#${encPath(subpath)}` : versioned;
}
