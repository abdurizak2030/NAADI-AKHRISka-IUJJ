/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Authentication helpers for Next.js Route Handlers — the direct
 * equivalent of the original Express `authenticateUser` / `requireAdmin`
 * middleware (backend/src/middleware/auth.middleware.ts), adapted to the
 * "check inline, return early" style Route Handlers use instead of
 * middleware chains.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, SessionTokenPayload } from './utils/token';

/** Reads and verifies the Bearer token on a request, if any. Never throws. */
export function getAuthPayload(request: NextRequest): SessionTokenPayload | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length);
  return verifyToken(token);
}

export type AuthResult =
  | { ok: true; payload: SessionTokenPayload }
  | { ok: false; response: NextResponse };

/** Equivalent of `authenticateUser` — call and return `result.response` if `!result.ok`. */
export function requireAuth(request: NextRequest): AuthResult {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { ok: false, response: NextResponse.json({ error: 'Fadlan soo gal nidaamka marka hore.' }, { status: 401 }) };
  }
  const token = authHeader.slice('Bearer '.length);
  const payload = verifyToken(token);
  if (!payload) {
    return { ok: false, response: NextResponse.json({ error: 'Fadhigii wuu dhacay. Fadlan dib ula soo gal.' }, { status: 401 }) };
  }
  return { ok: true, payload };
}

/** Equivalent of `requireAdmin` — authenticates AND checks role === 'ADMIN'. */
export function requireAdmin(request: NextRequest): AuthResult {
  const result = requireAuth(request);
  if (!result.ok) return result;
  if (result.payload.role !== 'ADMIN') {
    return { ok: false, response: NextResponse.json({ error: 'Kaliya maamulaha ayaa loo oggol yahay ficilkan.' }, { status: 403 }) };
  }
  return result;
}
