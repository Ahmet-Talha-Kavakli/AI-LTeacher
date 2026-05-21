import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

function getRedis() {
  if (redis) return redis;
  if (!process.env.UPSTASH_REDIS_REST_URL) return null;
  redis = Redis.fromEnv();
  return redis;
}

export function rateLimiter(prefix: string, requests: number, windowSec: number) {
  const r = getRedis();
  if (!r) return null;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(requests, `${windowSec} s`),
    prefix: `rl:${prefix}`,
  });
}

export async function checkLimit(
  prefix: string,
  identifier: string,
  requests: number,
  windowSec: number,
) {
  const limiter = rateLimiter(prefix, requests, windowSec);
  if (!limiter) return { success: true };
  return limiter.limit(identifier);
}
