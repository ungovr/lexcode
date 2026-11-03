import type { DetectionClass, RuleSet } from '../types.js';

/**
 * The id, its parent, and every id whose parent is that parent or the id.
 * An unknown id is a family of one.
 */
export function familyOf(id: string, rs: RuleSet): Set<string> {
  const parent = rs.registry.get(id)?.parent ?? null;
  const family = new Set<string>([id]);
  if (parent) family.add(parent);
  for (const entry of rs.registry.values()) {
    if (entry.parent !== null && (entry.parent === id || entry.parent === parent)) family.add(entry.id);
  }
  return family;
}

/** The detection class of an id; an id the rule set does not know is declaration-only. */
export function classOf(id: string, rs: RuleSet): DetectionClass {
  return rs.classes.get(id) ?? 'declaration-only';
}
