import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { isRecord, parseYamlFile, stringList } from '../declaration/yaml.js';
import { ToolError } from '../errors.js';
import type { Sidecar } from '../types.js';

export const SIDECAR_SCHEMA = 'https://lexlint.io/lexcode/config/v1';
const TOP_KEYS = new Set(['schema', 'ignore', 'fail_on_enables', 'own_hosts', 'include', 'exclude']);
const IGNORE_KEYS = new Set(['rule', 'where', 'reason', 'by', 'on']);

function optionalString(v: unknown, file: string, what: string): string | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'string') throw new ToolError(`${file}: ${what} must be a string (quote it)`);
  return v;
}

/**
 * Read the sidecar. The default file is `.lexcode.yml` at `root`, and an
 * absent default returns undefined; a path named on the command line must
 * exist. Validation is by hand: unknown keys, a missing `reason` and a wrong
 * type are ToolErrors naming the file.
 */
export function loadSidecar(root: string, path?: string): Sidecar | undefined {
  const file = path === undefined ? join(root, '.lexcode.yml') : isAbsolute(path) ? path : join(root, path);
  if (!existsSync(file)) {
    if (path === undefined) return undefined;
    throw new ToolError(`config file not found: ${file}`);
  }
  let text: string;
  try {
    text = readFileSync(file, 'utf8');
  } catch (e) {
    throw new ToolError(`cannot read ${file}: ${(e as NodeJS.ErrnoException).code ?? (e as Error).message}`);
  }
  const doc = parseYamlFile(text, file);
  if (!isRecord(doc)) throw new ToolError(`${file}: the file must be a mapping with a schema key`);
  for (const k of Object.keys(doc)) {
    if (!TOP_KEYS.has(k)) throw new ToolError(`${file}: unknown key ${k}`);
  }
  if (doc.schema !== SIDECAR_SCHEMA) throw new ToolError(`${file}: schema must be ${SIDECAR_SCHEMA}`);

  const ignore: Sidecar['ignore'] = [];
  if (doc.ignore !== undefined && doc.ignore !== null) {
    if (!Array.isArray(doc.ignore)) throw new ToolError(`${file}: ignore must be a list`);
    doc.ignore.forEach((entry: unknown, i: number) => {
      const at = `ignore[${i}]`;
      if (!isRecord(entry)) throw new ToolError(`${file}: ${at} must be a mapping`);
      for (const k of Object.keys(entry)) {
        if (!IGNORE_KEYS.has(k)) throw new ToolError(`${file}: ${at} has unknown key ${k}`);
      }
      if (typeof entry.rule !== 'string' || entry.rule.trim() === '') {
        throw new ToolError(`${file}: ${at} needs a rule`);
      }
      if (typeof entry.reason !== 'string' || entry.reason.trim() === '') {
        throw new ToolError(`${file}: ${at} (${entry.rule}) needs a reason; an ignore is a recorded human decision`);
      }
      const item: Sidecar['ignore'][number] = { rule: entry.rule, reason: entry.reason };
      const where = optionalString(entry.where, file, `${at}.where`);
      if (where !== undefined) {
        if (where.trim() === '' || where.includes('\\') || where.startsWith('/')) {
          throw new ToolError(`${file}: ${at}.where must be a repository-relative path with / separators, or a directory prefix ending in /`);
        }
        item.where = where;
      }
      const by = optionalString(entry.by, file, `${at}.by`);
      if (by !== undefined) item.by = by;
      const on = optionalString(entry.on, file, `${at}.on`);
      if (on !== undefined) item.on = on;
      ignore.push(item);
    });
  }

  const failOnEnables = doc.fail_on_enables ?? false;
  if (typeof failOnEnables !== 'boolean') throw new ToolError(`${file}: fail_on_enables must be true or false`);

  return {
    ignore,
    fail_on_enables: failOnEnables,
    own_hosts: stringList(doc.own_hosts, file, 'own_hosts'),
    include: stringList(doc.include, file, 'include'),
    exclude: stringList(doc.exclude, file, 'exclude'),
  };
}
