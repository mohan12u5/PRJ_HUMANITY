import { NextResponse } from 'next/server';

import {
  createSessionToken,
  getCookieSecurityOptions,
  pruneExpiredSessions,
  revokeSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_WARNING_SECONDS,
  verifySessionToken
} from '@/app/lib/auth-session';

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

function unauthorized() {
  const response = NextResponse.json({ success: false, message: 'Session is not valid.' }, { status: 401 });
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    ...getCookieSecurityOptions(),
    maxAge: 0
  });
  return response;
}

export async function GET(request: Request) {
  const cookieValue = getSessionCookieValue(request);

  if (!cookieValue) {
    return unauthorized();
  }

  const payload = await verifySessionToken(cookieValue);
  if (!payload) {
    return unauthorized();
  }

  await pruneExpiredSessions();

  return NextResponse.json({
    success: true,
    session: {
      userId: payload.sub,
      name: payload.name,
      expiresAt: new Date(payload.exp * 1000).toISOString(),
      warningAt: new Date(payload.exp * 1000 - SESSION_WARNING_SECONDS * 1000).toISOString()
    }
  });
}

export async function POST(request: Request) {
  const cookieValue = getSessionCookieValue(request);

  if (!cookieValue) {
    return unauthorized();
  }

  const payload = await verifySessionToken(cookieValue);
  if (!payload) {
    return unauthorized();
  }

  await revokeSessionToken(cookieValue);
  const refreshedSession = await createSessionToken(payload.sub, payload.name, payload.rememberMe);
  const response = NextResponse.json({
    success: true,
    session: {
      userId: payload.sub,
      name: payload.name,
      expiresAt: refreshedSession.expiresAt,
      warningAt: new Date(new Date(refreshedSession.expiresAt).getTime() - SESSION_WARNING_SECONDS * 1000).toISOString()
    }
  });

  response.cookies.set(SESSION_COOKIE_NAME, refreshedSession.token, {
    ...getCookieSecurityOptions(),
    maxAge: refreshedSession.maxAge
  });

  return response;
}

export async function DELETE(request: Request) {
  const cookieValue = getSessionCookieValue(request);
  if (cookieValue) {
    await revokeSessionToken(cookieValue);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    ...getCookieSecurityOptions(),
    maxAge: 0
  });
  return response;
}
