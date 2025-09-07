import { RateLimiter } from 'limiter';

export const rateLimit = ({
  interval = 60 * 1000,
}: {
  interval?: number;
  uniqueTokenPerInterval?: number;
}) => {
  const limiters = new Map<string, RateLimiter>();

  return {
    check: async (identifier: string, limit: number) => {
      if (!limiters.has(identifier)) {
        limiters.set(identifier, new RateLimiter({ tokensPerInterval: limit, interval }));
      }
      
      const limiter = limiters.get(identifier)!;
      const remaining = await limiter.removeTokens(1);
      
      return { success: remaining >= 0 };
    },
  };
};