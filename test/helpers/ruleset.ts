import type { DetectionClass, RegistryEntry, RuleMeta, RuleSet } from '../../src/types.js';

type Row = [id: string, scope: RegistryEntry['scope'], parent: string | null, cls: DetectionClass];

// A small hand-built rule set: enough registry for the families, the classes
// and a couple of rules per activity, with no file on disk.
const ROWS: Row[] = [
  ['crawls_web', 'code', null, 'evidence'],
  ['trains_models', 'code', null, 'evidence'],
  ['processes_voice', 'code', null, 'evidence'],
  ['tracks_devices', 'code', null, 'evidence'],
  ['generates_content', 'code', null, 'evidence'],
  ['generates_text', 'code', 'generates_content', 'evidence'],
  ['generates_images', 'code', 'generates_content', 'evidence'],
  ['generates_video', 'code', 'generates_content', 'evidence'],
  ['generates_audio', 'code', 'generates_content', 'evidence'],
  ['deploys_chatbot', 'code', null, 'evidence'],
  ['deploys_companion_chatbot', 'code', 'deploys_chatbot', 'declaration-only'],
  ['deploys_mental_health_chatbot', 'code', 'deploys_chatbot', 'declaration-only'],
  ['operates_social_platform', 'deployment', null, 'signal'],
  ['serves_minors', 'deployment', null, 'declaration-only'],
  ['handles_health_records', 'role', null, 'declaration-only'],
];

export function makeRuleSet(): RuleSet {
  const registry = new Map<string, RegistryEntry>();
  const classes = new Map<string, DetectionClass>();
  const rules: RuleMeta[] = [];
  for (const [id, scope, parent, cls] of ROWS) {
    registry.set(id, {
      id,
      scope,
      parent,
      status: 'active',
      term: id,
      lint_definition: `Definition of ${id}.`,
      page: `https://lexlint.io/activities/${id}`,
    });
    classes.set(id, cls);
    if (cls === 'evidence') {
      for (const n of [1, 2]) {
        rules.push({
          id: `lexcode.${id}.r${n}`,
          file: `/nowhere/${id}-${n}.yml`,
          activity: id,
          mentioned: 'performs',
          strength: 'evidence',
          definition: `https://lexlint.io/activities/${id}`,
          languages: ['python'],
          message: id,
          replaces: [],
        });
      }
    }
  }
  return { version: '1.0.0', registryVersion: '1.15', rules, classes, registry, components: [] };
}
