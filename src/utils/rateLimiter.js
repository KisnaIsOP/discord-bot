import { logger } from './logger.js';

class RateLimiter {
  constructor() {
    this.userCooldowns = new Map();
    this.serverLimits = new Map();
    this.cooldownSeconds = parseInt(process.env.COOLDOWN_SECONDS || '5', 10);
    this.rateLimitPerMinute = parseInt(process.env.RATE_LIMIT_PER_MINUTE || '10', 10);
  }

  // Check user cooldown (per user across all servers)
  checkUserCooldown(userId) {
    const now = Date.now();
    const cooldownTime = this.cooldownSeconds * 1000;

    if (this.userCooldowns.has(userId)) {
      const expirationTime = this.userCooldowns.get(userId);
      if (now < expirationTime) {
        const remainingSeconds = ((expirationTime - now) / 1000).toFixed(1);
        return {
          onCooldown: true,
          remainingSeconds: parseFloat(remainingSeconds),
        };
      }
    }

    // Set new cooldown
    this.userCooldowns.set(userId, now + cooldownTime);
    return { onCooldown: false };
  }

  // Check server rate limit
  checkServerLimit(serverId) {
    const now = Date.now();
    const oneMinute = 60 * 1000;

    if (!this.serverLimits.has(serverId)) {
      this.serverLimits.set(serverId, []);
    }

    const timestamps = this.serverLimits.get(serverId);
    
    // Remove old timestamps
    const recentTimestamps = timestamps.filter(ts => now - ts < oneMinute);
    
    if (recentTimestamps.length >= this.rateLimitPerMinute) {
      const oldestTimestamp = recentTimestamps[0];
      const resetTime = ((oldestTimestamp + oneMinute - now) / 1000).toFixed(1);
      return {
        limited: true,
        resetIn: parseFloat(resetTime),
        limit: this.rateLimitPerMinute,
      };
    }

    // Add current timestamp
    recentTimestamps.push(now);
    this.serverLimits.set(serverId, recentTimestamps);
    
    return { limited: false };
  }

  // Reset user cooldown (e.g., for owner)
  resetUserCooldown(userId) {
    this.userCooldowns.delete(userId);
    logger.info(`Reset cooldown for user: ${userId}`);
  }

  // Clear all cooldowns (for maintenance)
  clearAll() {
    this.userCooldowns.clear();
    this.serverLimits.clear();
    logger.info('Cleared all rate limits');
  }
}

export const rateLimiter = new RateLimiter();
