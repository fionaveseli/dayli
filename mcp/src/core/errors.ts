/**
 * Errors a tool can return. Each has a stable code the agent can branch on,
 * a message that says what went wrong, and a hint that says what to do next.
 */
export type ErrorCode =
  | 'INVALID_INPUT'
  | 'INVALID_DAY'
  | 'AMBIGUOUS_DAY'
  | 'DAY_OUT_OF_RANGE'
  | 'TASK_NOT_FOUND'
  | 'DATA_UNAVAILABLE';

export class ToolError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly hint?: string,
  ) {
    super(message);
    this.name = 'ToolError';
  }
}

export type ErrorResult = {
  isError: true;
  content: { type: 'text'; text: string }[];
  structuredContent: { error: { code: ErrorCode; message: string; hint?: string } };
};

/** Turns any thrown value into a tool error result. Unknown errors never leak details. */
export function toErrorResult(err: unknown): ErrorResult {
  const e =
    err instanceof ToolError
      ? err
      : new ToolError('DATA_UNAVAILABLE', 'Dayli could not read the plan.', 'Try again later.');
  const error = { code: e.code, message: e.message, ...(e.hint ? { hint: e.hint } : {}) };
  const text = `${e.code}: ${e.message}${e.hint ? ` ${e.hint}` : ''}`;
  return { isError: true, content: [{ type: 'text', text }], structuredContent: { error } };
}
