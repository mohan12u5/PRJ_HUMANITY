import 'server-only';

import { createHash, randomBytes } from 'crypto';
import { prisma } from '@/app/lib/db';

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function createPasswordResetToken(userId: string) {
  const rawToken = randomBytes(32).toString('hex');

  await prisma.passwordResetToken.create({
    data: {
      tokenHash: hashToken(rawToken),
      userId,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS)
    }
  });

  return rawToken;
}

export async function consumePasswordResetToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash }
  });

  if (!record || record.usedAt || record.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  await prisma.passwordResetToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() }
  });

  return record.userId;
}
