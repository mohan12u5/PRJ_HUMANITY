import 'server-only';

import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

export type StoredUser = {
  name: string;
  gender: string;
  dob: string;
  email: string;
  phone: string;
  userId: string;
  passwordHash: string;
  createdAt: string;
  failedLoginAttempts: number;
  lockUntil: string | null;
};

const usersFilePath = path.join(process.cwd(), 'data', 'users.json');

async function ensureUsersFile() {
  await mkdir(path.dirname(usersFilePath), { recursive: true });

  try {
    await readFile(usersFilePath, 'utf8');
  } catch {
    await writeFile(usersFilePath, '[]', 'utf8');
  }
}

export async function readUsers() {
  await ensureUsersFile();

  try {
    const content = await readFile(usersFilePath, 'utf8');
    const parsed = JSON.parse(content) as Partial<StoredUser>[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((user) =>
        typeof user?.name === 'string' &&
        typeof user?.gender === 'string' &&
        typeof user?.dob === 'string' &&
        typeof user?.email === 'string' &&
        typeof user?.phone === 'string' &&
        typeof user?.userId === 'string' &&
        typeof user?.passwordHash === 'string' &&
        typeof user?.createdAt === 'string'
      )
      .map((user) => ({
        name: user.name as string,
        gender: user.gender as string,
        dob: user.dob as string,
        email: user.email as string,
        phone: user.phone as string,
        userId: user.userId as string,
        passwordHash: user.passwordHash as string,
        createdAt: user.createdAt as string,
        failedLoginAttempts: typeof user.failedLoginAttempts === 'number' ? user.failedLoginAttempts : 0,
        lockUntil: typeof user.lockUntil === 'string' || user.lockUntil === null ? user.lockUntil : null
      }));
  } catch {
    return [];
  }
}

async function writeUsers(users: StoredUser[]) {
  await ensureUsersFile();
  await writeFile(usersFilePath, JSON.stringify(users, null, 2), 'utf8');
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

export async function createUser(user: Omit<StoredUser, 'passwordHash' | 'createdAt' | 'failedLoginAttempts' | 'lockUntil'> & { password: string }) {
  const users = await readUsers();
  const storedUser: StoredUser = {
    name: user.name,
    gender: user.gender,
    dob: user.dob,
    email: user.email,
    phone: user.phone,
    userId: user.userId,
    passwordHash: hashPassword(user.password),
    createdAt: new Date().toISOString(),
    failedLoginAttempts: 0,
    lockUntil: null
  };

  users.push(storedUser);
  await writeUsers(users);
  return storedUser;
}

export async function findUserByUserId(userId: string) {
  const users = await readUsers();
  return users.find((user) => user.userId.toLowerCase() === userId.toLowerCase()) ?? null;
}

export async function findUserByLoginIdentifier(identifier: string) {
  const normalized = identifier.toLowerCase();
  const users = await readUsers();
  return users.find((user) => user.userId.toLowerCase() === normalized || user.email.toLowerCase() === normalized) ?? null;
}

export function isAccountLocked(user: StoredUser) {
  if (!user.lockUntil) {
    return false;
  }

  const lockExpiryTime = Date.parse(user.lockUntil);
  return Number.isFinite(lockExpiryTime) && lockExpiryTime > Date.now();
}

export async function clearLoginFailures(userId: string) {
  const users = await readUsers();
  const index = users.findIndex((user) => user.userId.toLowerCase() === userId.toLowerCase());

  if (index < 0) {
    return;
  }

  users[index] = {
    ...users[index],
    failedLoginAttempts: 0,
    lockUntil: null
  };

  await writeUsers(users);
}

export async function registerLoginFailure(userId: string) {
  const users = await readUsers();
  const index = users.findIndex((user) => user.userId.toLowerCase() === userId.toLowerCase());

  if (index < 0) {
    return null;
  }

  const attempts = users[index].failedLoginAttempts + 1;
  const shouldLock = attempts >= 5;

  users[index] = {
    ...users[index],
    failedLoginAttempts: shouldLock ? 0 : attempts,
    lockUntil: shouldLock ? new Date(Date.now() + 30 * 60 * 1000).toISOString() : users[index].lockUntil
  };

  await writeUsers(users);
  return users[index];
}

export async function isEmailTaken(email: string) {
  const users = await readUsers();
  return users.some((user) => user.email.toLowerCase() === email.toLowerCase());
}

export async function isUserIdTaken(userId: string) {
  const users = await readUsers();
  return users.some((user) => user.userId.toLowerCase() === userId.toLowerCase());
}