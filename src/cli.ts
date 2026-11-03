#!/usr/bin/env node
import { ToolError } from './errors.js';

export const USAGE = `lexcode: local evidence of what a repository's code does, in LexLint's activity vocabulary

  lexcode scan   [path] [--out lexcode.json] [--json] [--sarif out.sarif] [--snippets] [--rules <dir>] [--engine <path>] [--include-tests]
  lexcode check  [path] [--declaration lexlint.yml|ACTIVITIES.md] [--config .lexcode.yml] [--fail-on-enables]
                 [--include-tests] [--allow-undeclared] [--sarif out.sarif] [--out lexcode.json] [--json] [--quiet]
  lexcode explain <activity-id | rule-id | purl>... [--json]
  lexcode rules  [--json]
  lexcode engine fetch | path | verify
  lexcode version
`;

type Runner = (argv: string[]) => Promise<number>;

async function load(name: string): Promise<Runner | undefined> {
  switch (name) {
    case 'engine':
      return (await import('./commands/engine.js')).runEngineCommand;
    default:
      return undefined;
  }
}

export async function main(argv: string[]): Promise<number> {
  const [command, ...rest] = argv;
  if (!command || command === '--help' || command === '-h' || command === 'help') {
    process.stdout.write(USAGE);
    return 0;
  }
  const run = await load(command);
  if (!run) {
    process.stderr.write(`lexcode: unknown command "${command}"\n\n${USAGE}`);
    return 2;
  }
  try {
    return await run(rest);
  } catch (err) {
    if (err instanceof ToolError) {
      process.stderr.write(`lexcode: ${err.message}\n`);
      return 2;
    }
    throw err;
  }
}

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (err: unknown) => {
    process.stderr.write(`lexcode: unexpected error: ${err instanceof Error ? err.stack ?? err.message : String(err)}\n`);
    process.exitCode = 2;
  },
);
