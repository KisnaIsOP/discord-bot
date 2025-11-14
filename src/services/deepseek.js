import axios from 'axios';
import { logger } from '../utils/logger.js';

const API_BASE_URL = 'https://api.deepseek.com/chat/completions';
const MAX_RETRIES = 3;

class DeepSeekService {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.model = 'deepseek-chat';
    
    if (!this.apiKey) {
      logger.warn('DEEPSEEK_API_KEY not set. DeepSeek service disabled.');
    }
  }

  async sendMessage(messages) {
    if (!this.apiKey) {
      throw new Error('DEEPSEEK_API_KEY is not configured');
    }

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await axios.post(
          API_BASE_URL,
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
            },
            timeout: 30000,
          }
        );

        const content = response.data.choices?.[0]?.message?.content;
        
        if (!content) {
          throw new Error('Empty response from API');
        }

        logger.debug('DeepSeek API response received', {
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
          logger.error('DeepSeek API error after retries:', {
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

export const deepseekService = new DeepSeekService();
