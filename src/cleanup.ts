import type { ChildProcess } from 'node:child_process';
import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { childEnv } from './proc.js';

/**
 * What lexcode must not leave behind when it stops: the engine processes it started (a whole process
 * group each, since the engine starts workers of its own) and the temporary directories it made.
 * Handlers for SIGINT, SIGTERM, SIGHUP and exit are installed while anything is registered and
 * removed when nothing is.
 */

/** How long a stopped process group gets to exit on SIGTERM before it is killed outright. */
export const KILL_GRACE_MS = 3000;

const children = new Set<ChildProcess>();
const dirs = new Set<string>();
let installed = false;

type Platform = NodeJS.Platform;

/** The command that stops a process and everything it started, on Windows; undefined elsewhere. */
export function windowsKillCommand(pid: number, platform: Platform = process.platform): { file: string; args: string[] } | undefined {
  if (platform !== 'win32') return undefined;
  const root = process.env.SystemRoot ?? process.env.SYSTEMROOT ?? 'C:\\Windows';
  return { file: join(root, 'System32', 'taskkill.exe'), args: ['/T', '/F', '/PID', String(pid)] };
}

/**
 * Send `signal` to the child's whole process group (the child is its leader, see `spawnGroup`). On
 * Windows there are no signals: the tree is stopped with taskkill and the signal name is ignored.
 */
export function killGroup(child: ChildProcess, signal: NodeJS.Signals): void {
  const pid = child.pid;
  if (pid === undefined) return;
  const win = windowsKillCommand(pid);
  if (win) {
    try {
      spawn(win.file, win.args, { stdio: 'ignore', windowsHide: true, cwd: tmpdir(), env: childEnv() }).on('error', () => {});
    } catch {
      /* the process may already be gone */
    }
    return;
  }
  try {
    process.kill(-pid, signal);
  } catch {
    try {
      child.kill(signal);
    } catch {
      /* already gone */
    }
  }
}

/** SIGTERM the group, then SIGKILL it when it has not exited after the grace period. The returned promise settles once the child has exited. */
export function terminateGroup(child: ChildProcess, graceMs: number = KILL_GRACE_MS): Promise<void> {
  return new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) {
      killGroup(child, 'SIGKILL'); // the leader is gone; stragglers in its group are not
      resolve();
      return;
    }
    const hard = setTimeout(() => killGroup(child, 'SIGKILL'), graceMs);
    child.once('exit', () => {
      clearTimeout(hard);
      killGroup(child, 'SIGKILL');
      resolve();
    });
    killGroup(child, 'SIGTERM');
  });
}

function removeDirsSync(): void {
  for (const d of dirs) {
    try {
      rmSync(d, { recursive: true, force: true });
    } catch {
      /* best effort at exit */
    }
  }
  dirs.clear();
}

let stopping = false;

function onSignal(signal: NodeJS.Signals): void {
  const code = 128 + ({ SIGHUP: 1, SIGINT: 2, SIGTERM: 15 } as Record<string, number>)[signal]!;
  if (stopping) {
    // A second signal: stop waiting.
    for (const c of children) killGroup(c, 'SIGKILL');
    removeDirsSync();
    process.exit(code);
  }
  stopping = true;
  void Promise.all([...children].map((c) => terminateGroup(c))).finally(() => {
    removeDirsSync();
    process.exit(code);
  });
}

const onSigint = (): void => onSignal('SIGINT');
const onSigterm = (): void => onSignal('SIGTERM');
const onSighup = (): void => onSignal('SIGHUP');
const onExit = (): void => {
  for (const c of children) killGroup(c, 'SIGKILL');
  removeDirsSync();
};

function install(): void {
  if (installed) return;
  installed = true;
  process.on('SIGINT', onSigint);
  process.on('SIGTERM', onSigterm);
  if (process.platform !== 'win32') process.on('SIGHUP', onSighup);
  process.on('exit', onExit);
}

function uninstallIfIdle(): void {
  if (!installed || children.size > 0 || dirs.size > 0) return;
  installed = false;
  stopping = false;
  process.off('SIGINT', onSigint);
  process.off('SIGTERM', onSigterm);
  process.off('SIGHUP', onSighup);
  process.off('exit', onExit);
}

/** Remove `dir` when lexcode stops for any reason. The returned function removes it now and forgets it. */
export function trackTempDir(dir: string): () => Promise<void> {
  dirs.add(dir);
  install();
  return async () => {
    try {
      await rm(dir, { recursive: true, force: true });
    } finally {
      dirs.delete(dir);
      uninstallIfIdle();
    }
  };
}

/** Kill `child`'s process group when lexcode stops. The returned function forgets the child. */
export function trackChild(child: ChildProcess): () => void {
  children.add(child);
  install();
  return () => {
    children.delete(child);
    uninstallIfIdle();
  };
}
