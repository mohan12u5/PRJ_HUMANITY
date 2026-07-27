import 'server-only';

import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { prisma } from '@/app/lib/db';

export type StoredUser = {
  id: string;
  name: string;
  gender: string;
  dob: string;
  email: string;
  phone: string;
  userId: string;
  passwordHash: string;
  role: 'CUSTOMER' | 'ADMIN';
  createdAt: string;
  failedLoginAttempts: number;
  lockUntil: string | null;
};

function parseDobToDate(value: string) {
  const [dayPart, monthPart, yearPart] = value.split('/');
  const day = Number(dayPart);
  const month = Number(monthPart);
  const year = Number(yearPart);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDobFromDate(value: Date) {
  const day = `${value.getUTCDate()}`.padStart(2, '0');
  const month = `${value.getUTCMonth() + 1}`.padStart(2, '0');
  const year = `${value.getUTCFullYear()}`;
  return `${day}/${month}/${year}`;
}

function mapToStoredUser(user: {
  id: string;
  name: string;
  gender: string;
  dob: Date;
  email: string;
  phone: string;
  userId: string;
  passwordHash: string;
  role: 'CUSTOMER' | 'ADMIN';
  createdAt: Date;
  failedLoginAttempts: number;
  lockUntil: Date | null;
}): StoredUser {
  return {
    id: user.id,
    name: user.name,
    gender: user.gender,
    dob: formatDobFromDate(user.dob),
    email: user.email,
    phone: user.phone,
    userId: user.userId,
    passwordHash: user.passwordHash,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    failedLoginAttempts: user.failedLoginAttempts,
    lockUntil: user.lockUntil ? user.lockUntil.toISOString() : null
  };
}

export async function readUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' }
  });
  return users.map(mapToStoredUser);
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, existingHash] = storedHash.split(':');
  if (!salt || !existingHash) {
    return false;
  }

  const derivedKey = scryptSync(password, salt, 64);
  const storedKey = Buffer.from(existingHash, 'hex');
  const derivedKeyView = new Uint8Array(derivedKey);
  const storedKeyView = new Uint8Array(storedKey);

  return derivedKeyView.length === storedKeyView.length && timingSafeEqual(derivedKeyView, storedKeyView);
}

export async function updateUserPassword(userId: string, newPassword: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: hashPassword(newPassword),
      failedLoginAttempts: 0,
      lockUntil: null
    }
  });
}

export async function createUser(user: Omit<StoredUser, 'id' | 'passwordHash' | 'createdAt' | 'failedLoginAttempts' | 'lockUntil' | 'role'> & { password: string }) {
  const created = await prisma.user.create({
    data: {
      name: user.name,
      gender: user.gender,
      dob: parseDobToDate(user.dob),
      email: user.email,
      phone: user.phone,
      userId: user.userId,
      passwordHash: hashPassword(user.password)
    }
  });

  return mapToStoredUser(created);
}

export async function findUserByUserId(userId: string) {
  const user = await prisma.user.findFirst({
    where: {
      userId: {
        equals: userId,
        mode: 'insensitive'
      }
    }
  });
  return user ? mapToStoredUser(user) : null;
}

export async function findUserByLoginIdentifier(identifier: string) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        {
          userId: {
            equals: identifier,
            mode: 'insensitive'
          }
        },
        {
          email: {
            equals: identifier,
            mode: 'insensitive'
          }
        }
      ]
    }
  });

  return user ? mapToStoredUser(user) : null;
}

export function isAccountLocked(user: StoredUser) {
  if (!user.lockUntil) {
    return false;
  }

  const lockExpiryTime = Date.parse(user.lockUntil);
  return Number.isFinite(lockExpiryTime) && lockExpiryTime > Date.now();
}

export async function clearLoginFailures(userId: string) {
  const existing = await findUserByUserId(userId);
  if (!existing) {
    return;
  }

  await prisma.user.update({
    where: { id: existing.id },
    data: {
      failedLoginAttempts: 0,
      lockUntil: null
    }
  });
}

export async function registerLoginFailure(userId: string) {
  const existing = await findUserByUserId(userId);
  if (!existing) {
    return null;
  }

  const attempts = existing.failedLoginAttempts + 1;
  const shouldLock = attempts >= 5;

  const updated = await prisma.user.update({
    where: { id: existing.id },
    data: {
      failedLoginAttempts: shouldLock ? 0 : attempts,
      lockUntil: shouldLock ? new Date(Date.now() + 30 * 60 * 1000) : existing.lockUntil ? new Date(existing.lockUntil) : null
    }
  });

  return mapToStoredUser(updated);
}

export async function isEmailTaken(email: string) {
  const count = await prisma.user.count({
    where: {
      email: {
        equals: email,
        mode: 'insensitive'
      }
    }
  });

  return count > 0;
}

export async function isUserIdTaken(userId: string) {
  const count = await prisma.user.count({
    where: {
      userId: {
        equals: userId,
        mode: 'insensitive'
      }
    }
  });

  return count > 0;
}