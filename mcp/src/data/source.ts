import { SAMPLE_PLAN, type PlanData } from '../dayli';

/**
 * Where the plan comes from. Tools only ever see this interface, so swapping
 * sample data for a JSON snapshot or Supabase later does not touch the tools.
 */
export interface PlanSource {
  /** Short description for logs and the README, e.g. "sample data". */
  readonly name: string;
  load(): Promise<PlanData>;
}

/** The app's built-in sample plan. Each load is a fresh copy, so nothing can leak between calls. */
export class SampleSource implements PlanSource {
  readonly name = 'sample data';
  async load(): Promise<PlanData> {
    return structuredClone(SAMPLE_PLAN);
  }
}

/** A fixed plan, for tests and evals. */
export class MemorySource implements PlanSource {
  readonly name = 'in-memory plan';
  constructor(private readonly plan: PlanData) {}
  async load(): Promise<PlanData> {
    return structuredClone(this.plan);
  }
}
