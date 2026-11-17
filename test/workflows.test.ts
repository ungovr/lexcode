import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

// The Socket Firewall gate (socket.yml) must run on exactly the runners the jobs it guards install on:
// npm installs a platform's native bindings only on that platform, so a runner the gate skips installs
// packages the firewall never saw (Codex P1 on ungovr/ungovr#13476), and a runner the gate adds that no
// guarded job uses only makes a release wait for it (ungovr/ungovr#13493).

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));

interface Job {
  uses?: string;
  with?: Record<string, string>;
  needs?: string | string[];
  'runs-on'?: string;
  strategy?: { matrix?: { os?: string[] } };
  steps?: { run?: string }[];
}
interface Workflow {
  on: Record<string, unknown> & { push?: { branches?: string[]; tags?: string[] } | null };
  jobs: Record<string, Job>;
}

function workflow(name: string): Workflow {
  return parse(readFileSync(join(root, '.github/workflows', name), 'utf8')) as Workflow;
}

/** The runner labels a caller hands socket.yml, or its default when it passes none. */
function socketRunners(wf: Workflow): string[] {
  const call = Object.values(wf.jobs).find((j) => j.uses === './.github/workflows/socket.yml');
  expect(call, 'the workflow calls socket.yml').toBeDefined();
  const socket = workflow('socket.yml') as unknown as {
    on: { workflow_call: { inputs: { runners: { default: string } } } };
  };
  return JSON.parse(call?.with?.runners ?? socket.on.workflow_call.inputs.runners.default) as string[];
}

/** Jobs that install the lockfile (`npm ci` or `npm install` with no package named). */
function installingJobs(wf: Workflow): [string, Job][] {
  return Object.entries(wf.jobs).filter(([, j]) =>
    (j.steps ?? []).some((s) => /^\s*npm (ci|install)\s*$/m.test(s.run ?? '')),
  );
}

function needsSocket(job: Job): boolean {
  const needs = Array.isArray(job.needs) ? job.needs : job.needs ? [job.needs] : [];
  return needs.includes('socket');
}

/** What each runner label is, as the socket.yml step sees it in `$RUNNER_OS-$RUNNER_ARCH`. */
const LABEL_PLATFORM: Record<string, string> = {
  'ubuntu-24.04': 'Linux-X64',
  'macos-15': 'macOS-ARM64',
};

describe('workflows: the Socket Firewall gate covers what it guards, and nothing more', () => {
  it('ci.yml runs the gate on every OS its test matrix installs on', () => {
    const ci = workflow('ci.yml');
    const osList = ci.jobs.test?.strategy?.matrix?.os ?? [];
    expect(osList.length).toBeGreaterThan(0);
    expect([...socketRunners(ci)].sort()).toEqual([...osList].sort());
  });

  it('release.yml runs the gate only on the runner its build installs on', () => {
    const release = workflow('release.yml');
    const buildRunner = release.jobs.build?.['runs-on'];
    expect(buildRunner).toBeDefined();
    expect(socketRunners(release)).toEqual([buildRunner]);
  });

  it('every job that installs the lockfile waits on the gate', () => {
    for (const name of ['ci.yml', 'release.yml']) {
      const jobs = installingJobs(workflow(name));
      expect(jobs.length, `${name} installs the lockfile somewhere`).toBeGreaterThan(0);
      for (const [id, job] of jobs) expect(needsSocket(job), `${name} ${id} needs socket`).toBe(true);
    }
  });

  it('every runner a caller passes has a pinned firewall build', () => {
    const script = (workflow('socket.yml').jobs.firewall?.steps ?? []).map((s) => s.run ?? '').join('\n');
    for (const name of ['ci.yml', 'release.yml']) {
      for (const label of socketRunners(workflow(name))) {
        const platform = LABEL_PLATFORM[label];
        expect(platform, `${name} passes ${label}; add it to LABEL_PLATFORM and pin its build`).toBeDefined();
        expect(script).toContain(`${platform})`);
      }
    }
  });

  it('a tag push runs only the release workflow', () => {
    const push = workflow('ci.yml').on.push;
    expect(push?.branches, 'ci.yml push is limited to branches').toEqual(['**']);
    expect(push?.tags).toBeUndefined();
    const release = workflow('release.yml').on.push;
    expect(release?.tags).toEqual(['v*']);
  });
});
