/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Shared plumbing used by every /api/* Route Handler — the direct
 * equivalent of the original Express `app.ts` DB-readiness gate and
 * `middleware/errorHandler.ts` centralized error handler, adapted to the
 * per-request style of Next.js Route Handlers (no middleware chain, so
 * every route calls these explicitly at the top of its try/catch).
 */

import { NextResponse } from 'next/server';
import { initPool, isDatabaseReady, getLastDatabaseError } from './db/pool';
import { ensureSchema, isSchemaReady, getSchemaError } from './db/schema';

/**
 * Lazily connects to Neon + verifies/creates the schema (matches the
 * original `startServer()` boot sequence, just deferred to first request
 * instead of process start — the natural adaptation for a serverless/
 * Route Handler deployment).
 *
 * IMPORTANT: this must be safe to call again on every request until it
 * actually succeeds. A single transient failure (e.g. a Neon database
 * waking up from idle, a brief network blip) should never be cached as a
 * permanent "not ready" state — that would wedge every route into 503s
 * for the rest of the server's lifetime even after the database becomes
 * reachable again. `initPool()` and `ensureSchema()` each already retry
 * on failure internally, so simply calling them again here (instead of
 * memoizing this whole function in a one-shot promise) gives correct
 * self-healing behavior with no extra bookkeeping.
 */
async function ensureBooted(): Promise<void> {
  if (isDatabaseReady() && isSchemaReady()) return;

  const connected = await initPool();
  if (connected && !isSchemaReady()) {
    try {
      await ensureSchema();
    } catch (err) {
      console.error('[db] Failed to initialize schema — will retry on next request:', err instanceof Error ? err.message : err);
    }
  }
}

/**
 * Equivalent of the `/api` DB-readiness gate in app.ts. Call at the top of
 * every database-backed route; returns a NextResponse to return early if
 * the database/schema isn't ready, or `null` if it's safe to proceed.
 */
export async function requireDbReady(): Promise<NextResponse | null> {
  await ensureBooted();

  if (!isDatabaseReady()) {
    return NextResponse.json(
      {
        error: 'The database is not connected. Check DATABASE_URL in your environment and the server logs for details.',
        details: getLastDatabaseError(),
      },
      { status: 503 }
    );
  }
  if (!isSchemaReady()) {
    return NextResponse.json(
      {
        error: 'The database schema is not fully initialized yet. Check the server logs for details.',
        details: getSchemaError(),
      },
      { status: 503 }
    );
  }
  return null;
}

interface ErrorWithStatus extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
  detail?: string;
}

/** Postgres error codes worth turning into a clean 400 instead of a raw 500. */
const PG_CLIENT_ERROR_CODES: Record<string, string> = {
  '23502': 'A required field is missing.',
  '23503': 'This action references a record that no longer exists.',
  '23505': 'A record with these details already exists.',
  '23514': 'One of the submitted values is not allowed.',
  '22P02': 'One of the submitted values has an invalid format.',
};

/**
 * Equivalent of the Express centralized `errorHandler`. Call from a
 * route's `catch` block: `return handleError(err, request)`.
 */
export function handleError(err: unknown, context?: string): NextResponse {
  console.error(`Unhandled API error${context ? ` on ${context}` : ''}:`, err);

  const e = err as ErrorWithStatus;
  const message = err instanceof Error ? err.message : 'Internal Server Error';

  if (message.includes('DATABASE_URL')) {
    return NextResponse.json({ error: message }, { status: 503 });
  }

  if (e?.code && PG_CLIENT_ERROR_CODES[e.code]) {
    return NextResponse.json({ error: PG_CLIENT_ERROR_CODES[e.code] }, { status: 400 });
  }

  const status = e?.status || e?.statusCode || 500;
  return NextResponse.json({ error: message }, { status });
}

/**
 * Safely parses a JSON request body; returns `{}` for empty/invalid bodies (mirrors express.json() leniency used implicitly by routes that read optional fields).
 *
 * Intentionally returns `any`: every route handler destructures/reshapes this
 * parsed body and passes it straight into a strongly-typed repository
 * function (e.g. `createTestimonial(body)`), so the real validation happens
 * there. Narrowing this return type to `unknown` would require touching
 * every one of this helper's 25+ call sites purely to satisfy the type
 * checker, with no behavior change.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function safeJsonBody(request: Request): Promise<any> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
