import { createHash } from 'crypto';
import { NextRequest } from 'next/server';
import { SessionTokenPayload } from './token';

function hashKey(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 32);
}

function visitorIdFromHeader(request: NextRequest): string | null {
  const visitorId = request.headers.get('x-visitor-id')?.trim();
  if (!visitorId || !/^[a-zA-Z0-9_-]{16,96}$/.test(visitorId)) return null;
  return visitorId;
}

export function getArticleLikeUserKey(request: NextRequest, auth: SessionTokenPayload | null): string {
  if (auth) return `user:${auth.userId}`;

  const visitorId = visitorIdFromHeader(request);
  if (visitorId) return `anon:${hashKey(`visitor:${visitorId}`)}`;

  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = request.headers.get('x-real-ip')?.trim();
  const userAgent = request.headers.get('user-agent')?.trim() || 'unknown-agent';
  return `anon:${hashKey(`network:${forwardedFor || realIp || 'unknown-ip'}:${userAgent}`)}`;
}