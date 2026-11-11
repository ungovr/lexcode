import { expect } from 'vitest';

/**
 * Performance tests in this repository check how the cost of a function grows
 * with its input, never how many milliseconds it takes: CI runners differ in
 * speed several-fold, so a fixed budget is a coin flip on a slow one, while a
 * ratio between two timings taken on the same machine in the same test is not.
 * See "Performance tests" in CONTRIBUTING.md.
 */

/** For 10x the input, linear code costs about 10x and quadratic code about 100x; 30x separates them with room on both sides. */
export const MAX_RATIO_FOR_10X = 30;

/** Per-call minimum time, in ms, over `reps` repetitions. A repetition that would run under `floorMs` runs the call in a loop so the clock is not the noise. */
function timePerCall(run: () => unknown, reps: number, floorMs: number): number {
  run(); // warm up: JIT, module caches, file cache
  const t0 = performance.now();
  run();
  const once = performance.now() - t0;
  const loops = Math.min(5_000, Math.max(1, Math.ceil(floorMs / Math.max(once, 0.001))));
  // A call that already takes seconds is far past the noise: two repetitions are enough, and a quadratic regression fails in seconds, not minutes.
  let best = Infinity;
  for (let r = 0; r < (once > 1_000 ? Math.min(reps, 2) : reps); r++) {
    const start = performance.now();
    for (let i = 0; i < loops; i++) run();
    best = Math.min(best, (performance.now() - start) / loops);
  }
  return best;
}

export interface Scaling<R> {
  smallMs: number;
  largeMs: number;
  /** Cost of the large input over cost of the small one. */
  ratio: number;
  /** What the function returned for the large input, for the test's own correctness assertions. */
  result: R;
}

/**
 * Times `run` on a small and a large input built by `setup` (outside the
 * clock), each as the minimum of several repetitions after a warm-up.
 */
export function measureScaling<T, R>(opts: {
  small: number;
  large: number;
  setup: (n: number) => T;
  run: (input: T) => R;
  reps?: number;
}): Scaling<R> {
  const reps = opts.reps ?? 4;
  const smallInput = opts.setup(opts.small);
  const largeInput = opts.setup(opts.large);
  const smallMs = timePerCall(() => opts.run(smallInput), reps, 5);
  const largeMs = timePerCall(() => opts.run(largeInput), reps, 5);
  return { smallMs, largeMs, ratio: largeMs / smallMs, result: opts.run(largeInput) };
}

/** Asserts the cost grew no faster than near-linearly for a 10x larger input. */
export function expectNearLinear(m: Scaling<unknown>, what = 'the function'): void {
  if (process.env['LEXCODE_SCALING_LOG']) process.stderr.write(`scaling ${what}: ${m.ratio.toFixed(2)}x (${m.smallMs.toFixed(3)} ms -> ${m.largeMs.toFixed(3)} ms)` + '\n');
  expect(
    m.ratio,
    `${what}: 10x the input cost ${m.ratio.toFixed(1)}x the time (${m.smallMs.toFixed(3)} ms, then ${m.largeMs.toFixed(3)} ms); linear is about 10x, quadratic about 100x`,
  ).toBeLessThan(MAX_RATIO_FOR_10X);
}
