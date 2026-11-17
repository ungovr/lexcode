// How scripts/rule-cost.mjs samples an engine run, kept apart so test/unit/rule-cost-swift.test.ts can hold it
// without the engine (#13322).

/** Rounds per file at most. Load on the machine only adds time, so each figure is the lowest of its rounds. */
export const ATTEMPTS = 3;

/**
 * The lowest time per file over up to ATTEMPTS rounds, and the match count of the run that gave it.
 * `scanOne(file)` runs the engine on that one file and resolves to `{ times, counts }` (keyed by the file) or
 * `{ error }`. A file named in `always` is run in every round, so it gets all ATTEMPTS samples; the others stop
 * once `enough(best)` holds. Each file is timed in an engine run of its own, so one file's parse cannot change the
 * allocations another is parsed after. The first error ends it (`{ error }`), and so does a round in which any file
 * got no time. Resolves to `{ best, counts }`.
 */
export async function lowest(scanOne, files, { enough = () => false, always = [] } = {}) {
  const best = {};
  const counts = {};
  let settled = false;
  for (let i = 0; i < ATTEMPTS; i++) {
    for (const f of files) {
      if (settled && !always.includes(f)) continue;
      const r = await scanOne(f);
      if (r.error) return { error: r.error };
      const t = r.times[f];
      if (t !== undefined && t < (best[f] ?? Infinity)) {
        best[f] = t;
        counts[f] = r.counts[f];
      } else if (!(f in counts)) {
        counts[f] = r.counts[f];
      }
    }
    if (files.some((f) => best[f] === undefined)) break;
    settled = enough(best);
    if (settled && always.length === 0) break;
  }
  return { best, counts };
}
