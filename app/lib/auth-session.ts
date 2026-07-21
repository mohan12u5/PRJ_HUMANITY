import 'server-only';

import { createHmac, timingSafeEqual } from 'crypto';

type SessionTokenPayload = {
  sub: string;
  name: string;
  iat: number;
  exp: number;
};

const SESSION_DURATION_SECONDS = 30 * 60;
export const SESSION_WARNING_SECONDS = 2 * 60;
export const SESSION_COOKIE_NAME = 'humanity_session';

function getSessionSecret() {
  return process.env.AUTH_JWT_SECRET || 'development-only-secret-change-me';
}

function encodeBase64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, 'base64').toString('utf8');
}

function sign(data: string) {
  return encodeBase64Url(createHmac('sha256', getSessionSecret()).update(data).digest());
}

export function createSessionToken(userId: string, name: string) {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionTokenPayload = {
    sub: userId,
    name,
    iat: now,
    exp: now + SESSION_DURATION_SECONDS
  };

  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = encodeBase64Url(JSON.stringify(payload));
  const signature = sign(`${header}.${body}`);

  return {
    token: `${header}.${body}.${signature}`,
    expiresAt: new Date(payload.exp * 1000).toISOString(),
    maxAge: SESSION_DURATION_SECONDS
  };
}

export function verifySessionToken(token: string) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  const [header, body, signature] = parts;
  const expectedSignature = sign(`${header}.${body}`);
  const givenSignature = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (givenSignature.length !== expectedBuffer.length || !timingSafeEqual(givenSignature, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(body)) as SessionTokenPayload;
    const now = Math.floor(Date.now() / 1000);

    if (!payload.sub || !payload.name || payload.exp <= now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getCookieSecurityOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/'
  };
}
