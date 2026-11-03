import { ToolError } from './errors.js';
import { UsageError, defaultIo, type Io } from './commands/args.js';
import { USAGE } from './usage.js';

export { USAGE };

type Runner = (argv: string[], io: Io) => Promise<number>;

async function load(name: string): Promise<Runner | undefined> {
  switch (name) {
    case 'scan':
      return (await import('./commands/scan.js')).runScanCommand;
    case 'engine': {
      const { runEngineCommand } = await import('./commands/engine.js');
      return (argv, io) => runEngineCommand(argv, { stdout: io.stdout, stderr: io.stderr });
    }
    default:
      return undefined;
  }
}

/** Run one command line. Returns the exit code; writes through `io`; has no effect on import. */
export async function main(argv: string[], io: Io = defaultIo()): Promise<number> {
  const [command, ...rest] = argv;
  if (!command || command === '--help' || command === '-h' || command === 'help') {
    io.stdout(USAGE);
    return 0;
  }
  const run = await load(command);
  if (!run) {
    io.stderr(`lexcode: unknown command "${command}"\n\n${USAGE}`);
    return 2;
  }
  try {
    return await run(rest, io);
  } catch (err) {
    if (err instanceof UsageError) {
      io.stderr(`lexcode: ${err.message}\n\n${USAGE}`);
      return 2;
    }
    if (err instanceof ToolError) {
      io.stderr(`lexcode: ${err.message}\n`);
      return 2;
    }
    throw err;
  }
}
