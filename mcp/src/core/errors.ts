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

export type ToolErrorBody = { code: ErrorCode; message: string; hint?: string };

/**
 * Errors go out as JSON text only. Structured content is reserved for results that
 * match the tool's output schema, and clients check it against that schema.
 */
export type ErrorResult = { isError: true; content: { type: 'text'; text: string }[] };

/** Turns any thrown value into a tool error result. Unknown errors never leak details. */
export function toErrorResult(err: unknown): ErrorResult {
  const e =
    err instanceof ToolError
      ? err
      : new ToolError('DATA_UNAVAILABLE', 'Dayli could not read the plan.', 'Try again later.');
  const error: ToolErrorBody = {
    code: e.code,
    message: e.message,
    ...(e.hint ? { hint: e.hint } : {}),
  };
  return { isError: true, content: [{ type: 'text', text: JSON.stringify({ error }) }] };
}

/** Reads the error back out of a result (for tests and clients written in TypeScript). */
export function readError(result: { content: { type: string; text?: string }[] }): ToolErrorBody {
  return JSON.parse(result.content[0].text ?? '{}').error;
}
