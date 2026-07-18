/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Single shared Neon PostgreSQL connection pool used by every part of the
 * backend that needs direct SQL access (authentication in particular).
 *
 * The connection string is read exclusively from the DATABASE_URL
 * environment variable — never hardcoded — so the same code works against
 * any Postgres-compatible database (Neon in production, a local Postgres
 * instance in development, etc.) simply by changing the environment.
 */

import pg from 'pg';
import { env, validateDatabaseUrl } from '../config/env';

const { Pool } = pg;

let pool: pg.Pool | null = null;
let initPromise: Promise<boolean> | null = null;
let isReady = false;
let lastError: string | null = null;

/** True once DATABASE_URL is set and at least one connection has succeeded. */
export function isDatabaseReady(): boolean {
  return isReady;
}

/** The most recent connection failure reason, if any — surfaced by /api/health. */
export function getLastDatabaseError(): string | null {
  return lastError;
}

/**
 * Lazily creates the connection pool. Safe to call multiple times — the
 * pool is only constructed once and reused for every query afterwards.
 */
function getOrCreatePool(): pg.Pool | null {
  if (pool) return pool;
  if (!env.DATABASE_URL) return null;

  pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Neon requires SSL
    connectionTimeoutMillis: 8000,
    max: 10,
  });

  // A broken idle connection should never crash the process — just log it.
  pool.on('error', (err) => {
    console.error('[db] Unexpected error on idle Neon PostgreSQL client:', err.message);
  });

  return pool;
}

/**
 * Returns the pool, throwing a clear, catchable error if the database was
 * never configured or never came up. Every repository/query call should go
 * through this so callers get a consistent, descriptive failure instead of
 * a null-pointer crash.
 */
export function getPool(): pg.Pool {
  const p = getOrCreatePool();
  if (!p) {
    throw new Error(
      'DATABASE_URL is not configured. Set it in backend/.env before starting the server.'
    );
  }
  return p;
}

/**
 * Verifies the database is reachable. Call this once at startup, before the
 * HTTP server begins accepting authentication requests, so connection
 * problems are surfaced immediately instead of on a user's first login.
 */
export async function initPool(): Promise<boolean> {
  // Only reuse an in-flight or previously-SUCCESSFUL attempt. A failed
  // attempt must NOT be cached forever — otherwise a single transient
  // hiccup on the very first request (e.g. a Neon database briefly
  // "waking up" from idle) would permanently wedge every request for the
  // rest of the server's lifetime into a false "not connected" state,
  // even though a retry moments later would succeed.
  if (initPromise && isReady) return initPromise;

  initPromise = (async () => {
    const check = validateDatabaseUrl();
    if (!check.valid) {
      isReady = false;
      lastError = check.reason || 'DATABASE_URL is invalid.';
      console.error('╔══════════════════════════════════════════════════════════════════');
      console.error('║ [db] DATABASE_URL PROBLEM — every database-backed API route will');
      console.error('║ return 503 until this is fixed:');
      console.error(`║   ${lastError}`);
      console.error('╚══════════════════════════════════════════════════════════════════');
      return false;
    }

    const p = getOrCreatePool();
    if (!p) {
      lastError = 'DATABASE_URL is not set.';
      console.error(
        '[db] DATABASE_URL is not set. Authentication and all database-backed routes will fail.'
      );
      isReady = false;
      return false;
    }

    try {
      const client = await p.connect();
      try {
        await client.query('SELECT 1');
        isReady = true;
        lastError = null;
        console.log('[db] Connected to Neon PostgreSQL.');
        return true;
      } finally {
        client.release();
      }
    } catch (error) {
      isReady = false;
      lastError = error instanceof Error ? error.message : String(error);
      console.error('[db] Failed to connect to Neon PostgreSQL — will retry on next request:', lastError);
      return false;
    }
  })();

  return initPromise;
}
