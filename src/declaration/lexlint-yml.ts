import { readFileSync } from 'node:fs';
import { ToolError } from '../errors.js';
import type { Declaration } from '../types.js';
import { isRecord, parseYamlFile, stringList } from './yaml.js';

/**
 * Read a lexlint.yml. `profile.activities` are declared (the file carries no
 * mentioned value), `profile.activities_left_out` are absent, and `app.scope`
 * is returned when set.
 */
export function readLexlintYml(path: string): {
  declaration: Declaration;
  scope?: { include: string[]; exclude: string[] };
} {
  let text: string;
  try {
    text = readFileSync(path, 'utf8');
  } catch (e) {
    throw new ToolError(`cannot read ${path}: ${(e as NodeJS.ErrnoException).code ?? (e as Error).message}`);
  }
  const doc = parseYamlFile(text, path);
  if (!isRecord(doc)) throw new ToolError(`${path}: the file must be a mapping`);

  const profile = doc.profile ?? {};
  if (!isRecord(profile)) throw new ToolError(`${path}: profile must be a mapping`);
  const declared = new Map<string, 'declared'>();
  for (const id of stringList(profile.activities, path, 'profile.activities')) declared.set(id, 'declared');
  const absent = new Set(stringList(profile.activities_left_out, path, 'profile.activities_left_out'));

  const declaration: Declaration = { source: 'lexlint.yml', file: path, declared, absent };

  const app = doc.app;
  if (isRecord(app) && app.scope !== undefined && app.scope !== null) {
    if (!isRecord(app.scope)) throw new ToolError(`${path}: app.scope must be a mapping`);
    return {
      declaration,
      scope: {
        include: stringList(app.scope.include, path, 'app.scope.include'),
        exclude: stringList(app.scope.exclude, path, 'app.scope.exclude'),
      },
    };
  }
  return { declaration };
}
