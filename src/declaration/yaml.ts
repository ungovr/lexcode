import { parseDocument } from 'yaml';
import { ToolError } from '../errors.js';

/**
 * Parse YAML text for a file lexcode reads (a declaration or the sidecar).
 * Default schema, no custom tags, alias expansion capped. A syntax error
 * becomes a ToolError naming the file and the line, never a stack trace.
 * `lineOffset` is added to reported lines, for text cut out of a larger file.
 */
export function parseYamlFile(text: string, file: string, lineOffset = 0): unknown {
  const doc = parseDocument(text);
  const first = doc.errors[0];
  if (first) {
    const line = (first.linePos?.[0]?.line ?? 1) + lineOffset;
    const message = (first.message.split('\n')[0] ?? 'invalid YAML').replace(/ at line \d+, column \d+:?$/, '');
    throw new ToolError(`${file}, line ${line}: ${message}`);
  }
  try {
    return doc.toJS({ maxAliasCount: 100 });
  } catch (e) {
    throw new ToolError(`${file}: ${(e as Error).message}`);
  }
}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** A list of non-empty strings, or a ToolError naming `what`. */
export function stringList(v: unknown, file: string, what: string): string[] {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v) || v.some((x) => typeof x !== 'string' || x.trim() === '')) {
    throw new ToolError(`${file}: ${what} must be a list of non-empty strings`);
  }
  return v as string[];
}
