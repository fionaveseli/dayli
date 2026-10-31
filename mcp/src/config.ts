import { fixedClock, systemClock, type Clock } from './core/clock';
import { SampleSource, type PlanSource } from './data/source';

/**
 * Settings come from environment variables so a client config can set them:
 * - DAYLI_TZ   time zone for "today" and "now" (default: the machine's)
 * - DAYLI_NOW  pin "now" for demos and evals, e.g. 2026-10-31T15:00:00+01:00
 */
export type Config = { clock: Clock; source: PlanSource };

export function loadConfig(env: Record<string, string | undefined>): Config {
  const tz = env.DAYLI_TZ || undefined;
  const clock = env.DAYLI_NOW ? fixedClock(env.DAYLI_NOW, tz) : systemClock(tz);
  return { clock, source: new SampleSource() };
}
