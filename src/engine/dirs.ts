import { lstat } from 'node:fs/promises';
import { ToolError } from '../errors.js';

export function currentUid(): number | undefined {
  return typeof process.getuid === 'function' ? process.getuid() : undefined;
}

/**
 * The engine directory holds a program lexcode will run, so it must be the user's own and
 * closed to everyone else: a directory someone else owns, or one that group or world can write to, lets
 * them swap the binary between the check and the run. Not checked on Windows, whose permission model
 * is different. `uid` is injectable for tests.
 */
export async function checkEngineDir(dir: string, uid: number | undefined = currentUid(), platform: string = process.platform): Promise<void> {
  if (platform === 'win32') return;
  const st = await lstat(dir);
  const fix = `Remove it and run \`lexcode engine fetch\` again, or point LEXCODE_CACHE_DIR at a directory only you can write to.`;
  if (st.isSymbolicLink() || !st.isDirectory()) {
    throw new ToolError(`the engine directory ${dir} is not a plain directory (it is a link or a file), so lexcode will not run a program from it. ${fix}`);
  }
  if (uid !== undefined && st.uid !== uid) {
    throw new ToolError(`the engine directory ${dir} is owned by another user (uid ${st.uid}), so lexcode will not run a program from it. ${fix}`);
  }
  if ((st.mode & 0o022) !== 0) {
    throw new ToolError(
      `the engine directory ${dir} is writable by its group or by everyone (mode ${(st.mode & 0o777).toString(8)}), so lexcode will not run a program from it. ` +
        `Run \`chmod go-w '${dir}'\`, or ${fix.charAt(0).toLowerCase()}${fix.slice(1)}`,
    );
  }
}
