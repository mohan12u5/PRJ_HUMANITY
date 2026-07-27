import 'server-only';

import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { prisma } from '@/app/lib/db';
import { findUserByUserId } from '@/app/lib/auth-storage';

type SessionTokenPayload = {
  sub: string;
  name: string;
  iat: number;
  exp: number;
};

type VerifiedSessionPayload = SessionTokenPayload & {
  rememberMe: boolean;
};

const SESSION_DURATION_SECONDS = 30 * 60;
const REMEMBER_ME_DURATION_SECONDS = 30 * 24 * 60 * 60;
export const SESSION_WARNING_SECONDS = 2 * 60;
export const SESSION_COOKIE_NAME = 'humanity_session';

function getSessionSecret() {
  return process.env.AUTH_JWT_SECRET || 'development-only-secret-change-me';
}

function encodeBase64Url(value: string | Buffer) {
  const buffer = typeof value === 'string' ? Buffer.from(value, 'utf8') : value;
  return buffer
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

function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSessionToken(userId: string, name: string, rememberMe = false) {
  const user = await findUserByUserId(userId);
  if (!user) {
    throw new Error('Cannot create session for unknown user.');
  }

  const durationSeconds = rememberMe ? REMEMBER_ME_DURATION_SECONDS : SESSION_DURATION_SECONDS;
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionTokenPayload = {
    sub: userId,
    name,
    iat: now,
    exp: now + durationSeconds
  };

  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = encodeBase64Url(JSON.stringify(payload));
  const signature = sign(`${header}.${body}`);
  const token = `${header}.${body}.${signature}`;

  await prisma.session.create({
    data: {
      tokenHash: hashSessionToken(token),
      userId: user.id,
      expiresAt: new Date(payload.exp * 1000),
      rememberMe
    }
  });

  return {
    token,
    expiresAt: new Date(payload.exp * 1000).toISOString(),
    maxAge: durationSeconds
  };
}

export async function verifySessionToken(token: string): Promise<VerifiedSessionPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  const [header, body, signature] = parts;
  const expectedSignature = sign(`${header}.${body}`);
  const givenSignature = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    givenSignature.length !== expectedBuffer.length ||
    !timingSafeEqual(new Uint8Array(givenSignature), new Uint8Array(expectedBuffer))
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(body)) as SessionTokenPayload;
    const now = Math.floor(Date.now() / 1000);

    if (!payload.sub || !payload.name || payload.exp <= now) {
      return null;
    }

    const session = await prisma.session.findUnique({
      where: {
        tokenHash: hashSessionToken(token)
      }
    });

    if (!session || session.expiresAt.getTime() <= Date.now()) {
      return null;
    }

    return {
      ...payload,
      rememberMe: session.rememberMe
    };
  } catch {
    return null;
  }
}

export async function revokeSessionToken(token: string) {
  const tokenHash = hashSessionToken(token);
  await prisma.session.deleteMany({
    where: { tokenHash }
  });
}

export async function revokeAllSessionsForUser(userId: string) {
  await prisma.session.deleteMany({
    where: { userId }
  });
}

export async function pruneExpiredSessions() {
  await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date()
      }
    }
  });
}

export function getCookieSecurityOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/'
  };
}
