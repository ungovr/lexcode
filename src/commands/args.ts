import { parseArgs, type ParseArgsConfig } from 'node:util';
import { ToolError } from '../errors.js';

/** A command line lexcode cannot read: an unknown flag, a missing value, the wrong number of arguments. */
export class UsageError extends ToolError {
  constructor(message: string) {
    super(message);
    this.name = 'UsageError';
  }
}

export interface Io {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
}

export function defaultIo(): Io {
  return {
    stdout: (s) => void process.stdout.write(s),
    stderr: (s) => void process.stderr.write(s),
  };
}

type OptionSpec = NonNullable<ParseArgsConfig['options']>;

export interface Parsed {
  values: Record<string, string | boolean | (string | boolean)[] | undefined>;
  positionals: string[];
}

/** `node:util` parseArgs in strict mode; its errors become a UsageError (exit 2 with the usage). */
export function parseFlags(argv: string[], options: OptionSpec, positionals: { min: number; max: number; what: string }): Parsed {
  let parsed;
  try {
    parsed = parseArgs({ args: argv, options: { ...options, help: { type: 'boolean', short: 'h' } }, allowPositionals: true, strict: true });
  } catch (e) {
    throw new UsageError((e as Error).message.replace(/\.$/, ''));
  }
  const n = parsed.positionals.length;
  if (n < positionals.min || n > positionals.max) {
    throw new UsageError(n < positionals.min ? `expected ${positionals.what}` : `too many arguments; expected ${positionals.what}`);
  }
  return { values: parsed.values as Parsed['values'], positionals: parsed.positionals };
}

export function str(p: Parsed, name: string): string | undefined {
  const v = p.values[name];
  return typeof v === 'string' ? v : undefined;
}

export function flag(p: Parsed, name: string): boolean {
  return p.values[name] === true;
}

export function strList(p: Parsed, name: string): string[] {
  const v = p.values[name];
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}
