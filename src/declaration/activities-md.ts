import { ToolError } from '../errors.js';
import { readRegularFile } from '../fsread.js';
import type { Declaration, Mentioned } from '../types.js';
import { isRecord, parseYamlFile } from './yaml.js';

/** The YAML between the first two `---` lines, and the file line it starts on. */
function frontMatter(text: string, path: string): { yaml: string; firstLine: number } {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/);
  if ((lines[0] ?? '').trimEnd() !== '---') {
    throw new ToolError(`${path}: no YAML front matter (the file must start with a --- line)`);
  }
  for (let i = 1; i < lines.length; i++) {
    if ((lines[i] ?? '').trimEnd() === '---') {
      return { yaml: lines.slice(1, i).join('\n'), firstLine: 2 };
    }
  }
  throw new ToolError(`${path}: the YAML front matter is not closed (no second --- line)`);
}

/**
 * Read an ACTIVITIES.md front matter. `root` is set when the file was found in a repository (see `readRegularFile`). Every component's activities are
 * unioned, `performs` in any component beats `enables`, and every `not:` id
 * goes to `absent`.
 */
export function readActivitiesMd(path: string, root?: string): Declaration {
  const fm = frontMatter(readRegularFile(path, root === undefined ? {} : { insideRoot: root }), path);
  const doc = parseYamlFile(fm.yaml, path, fm.firstLine - 1);
  if (!isRecord(doc)) throw new ToolError(`${path}: the front matter must be a mapping`);
  const components = doc.components;
  if (!Array.isArray(components)) throw new ToolError(`${path}: components must be a list`);

  const declared = new Map<string, Mentioned>();
  const absent = new Set<string>();
  components.forEach((c, ci) => {
    if (!isRecord(c)) throw new ToolError(`${path}: components[${ci}] must be a mapping`);
    const activities = c.activities ?? [];
    if (!Array.isArray(activities)) throw new ToolError(`${path}: components[${ci}].activities must be a list`);
    for (const a of activities) {
      if (!isRecord(a) || typeof a.id !== 'string' || a.id === '') {
        throw new ToolError(`${path}: components[${ci}].activities has an entry without an id`);
      }
      if (a.mentioned !== 'performs' && a.mentioned !== 'enables') {
        throw new ToolError(`${path}: ${a.id} must say mentioned: performs or enables`);
      }
      if (a.mentioned === 'performs' || !declared.has(a.id)) declared.set(a.id, a.mentioned);
    }
    const not = c.not ?? [];
    if (!Array.isArray(not)) throw new ToolError(`${path}: components[${ci}].not must be a list`);
    for (const n of not) {
      if (!isRecord(n) || typeof n.id !== 'string' || n.id === '') {
        throw new ToolError(`${path}: components[${ci}].not has an entry without an id`);
      }
      absent.add(n.id);
    }
  });
  return { source: 'ACTIVITIES.md', file: path, declared, absent };
}
