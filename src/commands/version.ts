import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENGINE_PIN } from '../engine/pin.js';
import { loadRuleSet } from '../rules/load.js';
import { defaultIo, flag, parseFlags, type Io } from './args.js';
import { USAGE } from '../usage.js';

/** The package's own version. From src/commands/ and from dist/commands/ package.json is two levels up. */
export function packageVersion(): string {
  const file = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', 'package.json');
  const doc = JSON.parse(readFileSync(file, 'utf8')) as { version?: unknown };
  return typeof doc.version === 'string' ? doc.version : 'unknown';
}

export async function runVersionCommand(argv: string[], io: Io = defaultIo()): Promise<number> {
  const p = parseFlags(argv, {}, { min: 0, max: 0, what: 'no arguments' });
  if (flag(p, 'help')) {
    io.stdout(USAGE);
    return 0;
  }
  const rs = loadRuleSet();
  io.stdout(
    `lexcode ${packageVersion()}\nrules ${rs.version}\nengine ${ENGINE_PIN.name} ${ENGINE_PIN.version}\nregistry ${rs.registryVersion}\n`,
  );
  return 0;
}
