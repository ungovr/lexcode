#!/usr/bin/env node
import { main } from './main.js';

// A reader that closes the pipe early (`lexcode deps | head -1`) is not an error. Without a
// listener Node throws the EPIPE as an unhandled 'error' event and prints a stack (#12745); the
// rest of the output goes nowhere and the command ends as it would have.
process.stdout.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code !== 'EPIPE') throw err;
});

main(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code;
  },
  (err: unknown) => {
    process.stderr.write(`lexcode: unexpected error: ${err instanceof Error ? (err.stack ?? err.message) : String(err)}\n`);
    process.exitCode = 2;
  },
);
