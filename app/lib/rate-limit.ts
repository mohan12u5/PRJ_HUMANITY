import 'server-only';

import { logger } from '@/app/lib/logger';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const memoryStore = new Map<string, RateLimitEntry>();

let redisClientPromise: Promise<import('@upstash/redis').Redis | null> | null = null;

function isRedisConfigured() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

async function getRedisClient() {
  if (!isRedisConfigured()) {
    return null;
  }

  if (!redisClientPromise) {
    redisClientPromise = import('@upstash/redis')
      .then(({ Redis }) =>
        new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL as string,
          token: process.env.UPSTASH_REDIS_REST_TOKEN as string
        })
      )
      .catch((error) => {
        logger.error('rate_limit.redis_init_failed', error);
        return null;
      });
  }

  return redisClientPromise;
}

export function getClientIpAddress(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  return request.headers.get('x-real-ip') || 'unknown';
}

function applyInMemoryRateLimit(key: string, maxRequests: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = memoryStore.get(key);

  if (!existing || existing.resetAt <= now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= maxRequests) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
    };
  }

  existing.count += 1;
  memoryStore.set(key, existing);

  return { allowed: true, retryAfterSeconds: 0 };
}

export async function applyRateLimit(key: string, maxRequests: number, windowMs: number): Promise<RateLimitResult> {
  const redis = await getRedisClient();

  if (!redis) {
    return applyInMemoryRateLimit(key, maxRequests, windowMs);
  }

  try {
    const redisKey = `rate-limit:${key}`;
    const count = await redis.incr(redisKey);

    if (count === 1) {
      await redis.pexpire(redisKey, windowMs);
    }

    if (count > maxRequests) {
      const ttl = await redis.pttl(redisKey);
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((ttl > 0 ? ttl : windowMs) / 1000))
      };
    }

    return { allowed: true, retryAfterSeconds: 0 };
  } catch (error) {
    logger.error('rate_limit.redis_failed', error);
    return applyInMemoryRateLimit(key, maxRequests, windowMs);
  }
}

