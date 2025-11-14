import { openRouterService } from './openrouter.js';
import { deepseekService } from './deepseek.js';
import { logger } from '../utils/logger.js';

class APIRouter {
  constructor() {
    this.primaryProvider = process.env.API_PROVIDER || 'openrouter';
    this.providers = {
      openrouter: openRouterService,
      deepseek: deepseekService,
    };
  }

  async sendMessage(messages) {
    const provider = this.providers[this.primaryProvider];

    if (!provider || !provider.isConfigured()) {
      logger.warn(`Primary provider "${this.primaryProvider}" not configured. Trying alternatives...`);
      
      // Try alternative providers
      for (const [name, svc] of Object.entries(this.providers)) {
        if (name !== this.primaryProvider && svc.isConfigured()) {
          logger.info(`Falling back to ${name}`);
          return svc.sendMessage(messages);
        }
      }

      return {
        success: false,
        error: 'No API provider is configured. Please set OPENROUTER_API_KEY or DEEPSEEK_API_KEY.',
      };
    }

    return provider.sendMessage(messages);
  }

  getActiveProvider() {
    const provider = this.providers[this.primaryProvider];
    return provider && provider.isConfigured() ? this.primaryProvider : null;
  }

  getAvailableProviders() {
    return Object.entries(this.providers)
      .filter(([_, svc]) => svc.isConfigured())
      .map(([name]) => name);
  }
}

export const apiRouter = new APIRouter();
