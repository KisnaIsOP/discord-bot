import axios from 'axios';
import { logger } from '../utils/logger.js';

const API_BASE_URL = 'https://openrouter.ai/api/v1';
const MAX_RETRIES = 3;

class OpenRouterService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.model = process.env.MODEL || 'deepseek/deepseek-chat:free';
    
    if (!this.apiKey) {
      logger.warn('OPENROUTER_API_KEY not set. OpenRouter service disabled.');
    }
  }

  async sendMessage(messages) {
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/chat/completions`,
          {
            model: this.model,
            messages,
            temperature: 0.7,
            max_tokens: 500,
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://github.com',
              'X-Title': 'Discord ChatBot',
            },
            timeout: 30000,
          }
        );

        const content = response.data.choices?.[0]?.message?.content;
        
        if (!content) {
          throw new Error('Empty response from API');
        }

        logger.debug('OpenRouter API response received', {
          model: this.model,
          tokens: response.data.usage,
        });

        return {
          success: true,
          content: content.trim(),
          model: this.model,
          tokens: response.data.usage,
        };
      } catch (error) {
        const isLastAttempt = attempt === MAX_RETRIES;
        const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 10000);

        if (error.response?.status === 429) {
          logger.warn(`Rate limited on attempt ${attempt}/${MAX_RETRIES}. Retrying in ${backoffMs}ms...`);
          if (!isLastAttempt) {
            await new Promise(resolve => setTimeout(resolve, backoffMs));
            continue;
          }
        } else if (error.response?.status >= 500) {
          logger.warn(`Server error on attempt ${attempt}/${MAX_RETRIES}. Retrying in ${backoffMs}ms...`);
          if (!isLastAttempt) {
            await new Promise(resolve => setTimeout(resolve, backoffMs));
            continue;
          }
        }

        if (isLastAttempt) {
          logger.error('OpenRouter API error after retries:', {
            status: error.response?.status,
            message: error.message,
            data: error.response?.data,
          });

          return {
            success: false,
            error: error.response?.status === 429
              ? 'API rate limit exceeded. Please try again in a moment.'
              : error.response?.data?.error?.message || 'Failed to get response from API',
          };
        }

        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
  }

  isConfigured() {
    return !!this.apiKey;
  }

  getModel() {
    return this.model;
  }
}

export const openRouterService = new OpenRouterService();
