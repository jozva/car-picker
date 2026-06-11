import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

/**
 * A single, consistent response envelope for every API route:
 *   success -> { ok: true, data }
 *   failure -> { ok: false, error: { message, details? } }
 */

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = {
  ok: false;
  error: { message: string; details?: unknown };
};

/** Throw this from anywhere in a route to produce a clean error response. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function ok<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ ok: true, data }, { status });
}

export function fail(
  status: number,
  message: string,
  details?: unknown
): NextResponse<ApiFailure> {
  return NextResponse.json({ ok: false, error: { message, details } }, { status });
}

/**
 * Wraps a route handler so every thrown error becomes a consistent envelope.
 * ZodError -> 400 with field details, ApiError -> its status, anything else -> 500.
 */
export function handleRoute<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse>
) {
  return async (...args: Args): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof ZodError) {
        return fail(400, "Validation failed.", err.flatten());
      }
      if (err instanceof ApiError) {
        return fail(err.status, err.message, err.details);
      }
      console.error("Unhandled API error:", err);
      return fail(500, "Something went wrong.");
    }
  };
}

/** Parse + validate a JSON body, throwing ZodError (-> 400) on failure. */
export async function parseJson<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON.");
  }
  return schema.parse(raw);
}
