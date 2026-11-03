import { basename, isAbsolute, join } from 'node:path';
import { ToolError } from '../errors.js';
import { pathPresent } from '../fsread.js';
import type { Declaration, RegistryEntry, ScopeSpec } from '../types.js';
import { readActivitiesMd } from './activities-md.js';
import { readLexlintYml } from './lexlint-yml.js';

type Kind = 'md' | 'yml';

function kindOf(path: string): Kind {
  const name = basename(path).toLowerCase();
  if (name.endsWith('.md')) return 'md';
  if (name.endsWith('.yml') || name.endsWith('.yaml')) return 'yml';
  throw new ToolError(`${path}: a declaration is an ACTIVITIES.md style .md file or a lexlint.yml style .yml file`);
}

/**
 * Pick the declaration that governs. ACTIVITIES.md wins when both exist
 * (it carries the `not:` list); `override` names a file and wins over both.
 * The two positive lists are compared over ids whose registry scope is not
 * `role` (ACTIVITIES.md cannot carry a role); without a registry every id is
 * compared. The scope always comes from lexlint.yml (or the overriding .yml).
 */
export function selectDeclaration(
  root: string,
  override?: string,
  registry?: ReadonlyMap<string, RegistryEntry>,
): { declaration: Declaration | null; disagreements: string[]; scope?: ScopeSpec } {
  let mdDecl: Declaration | null = null;
  let yml: ReturnType<typeof readLexlintYml> | null = null;
  let governing: 'md' | 'yml' | null = null;

  if (override !== undefined) {
    const path = isAbsolute(override) ? override : join(root, override);
    if (!pathPresent(path)) throw new ToolError(`declaration file not found: ${path}`);
    governing = kindOf(path);
    if (governing === 'md') mdDecl = readActivitiesMd(path);
    else yml = readLexlintYml(path);
  }
  const mdPath = join(root, 'ACTIVITIES.md');
  const ymlPath = join(root, 'lexlint.yml');
  if (!mdDecl && pathPresent(mdPath)) mdDecl = readActivitiesMd(mdPath, root);
  if (!yml && pathPresent(ymlPath)) yml = readLexlintYml(ymlPath, root);

  const declaration = governing === 'md' ? mdDecl : governing === 'yml' ? (yml?.declaration ?? null) : (mdDecl ?? yml?.declaration ?? null);

  const disagreements: string[] = [];
  if (mdDecl && yml) {
    const counts = (id: string): boolean => registry?.get(id)?.scope !== 'role';
    const a = new Set([...mdDecl.declared.keys()].filter(counts));
    const b = new Set([...yml.declaration.declared.keys()].filter(counts));
    for (const id of a) if (!b.has(id)) disagreements.push(id);
    for (const id of b) if (!a.has(id)) disagreements.push(id);
    disagreements.sort();
  }

  const out: { declaration: Declaration | null; disagreements: string[]; scope?: ScopeSpec } = { declaration, disagreements };
  if (yml?.scope) out.scope = { include: yml.scope.include, exclude: yml.scope.exclude, includeTests: false };
  return out;
}
