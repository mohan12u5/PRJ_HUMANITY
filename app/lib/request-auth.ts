import 'server-only';

import { SESSION_COOKIE_NAME, verifySessionToken } from '@/app/lib/auth-session';
import { findUserByUserId } from '@/app/lib/auth-storage';

function getSessionCookieValue(request: Request) {
  const cookieHeader = request.headers.get('cookie');
  const rawToken = cookieHeader
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`))
    ?.split('=')[1];

  if (!rawToken) {
    return undefined;
  }

  try {
    return decodeURIComponent(rawToken);
  } catch {
    return rawToken;
  }
}

export async function getAuthenticatedUser(request: Request) {
  const token = getSessionCookieValue(request);
  if (!token) {
    return null;
  }

  const payload = await verifySessionToken(token);
  if (!payload) {
    return null;
  }

  return findUserByUserId(payload.sub);
}

export async function getAuthenticatedAdmin(request: Request) {
  const user = await getAuthenticatedUser(request);
  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return user;
}
