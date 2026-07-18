/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import { env } from '../config/env';
import { Role } from '../types';

export interface SessionTokenPayload {
  userId: string;
  email: string;
  role: Role;
  name: string;
}

interface SignedPayload extends SessionTokenPayload {
  exp: number;
}

/** Simple HMAC-SHA256 signed session token (kept identical to the original implementation). */
export function signToken(payload: SessionTokenPayload): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString(
    'base64url'
  );
  const data = Buffer.from(
    JSON.stringify({ ...payload, exp: Date.now() + 24 * 60 * 60 * 1000 })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', env.JWT_SECRET)
    .update(`${header}.${data}`)
    .digest('base64url');
  return `${header}.${data}.${signature}`;
}

export function verifyToken(token: string): SessionTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, data, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', env.JWT_SECRET)
      .update(`${header}.${data}`)
      .digest('base64url');
    if (signature !== expectedSignature) return null;

    const decoded = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8')) as SignedPayload;
    if (decoded.exp && decoded.exp < Date.now()) {
      return null; // Expired
    }
    return decoded;
  } catch {
    return null;
  }
}
