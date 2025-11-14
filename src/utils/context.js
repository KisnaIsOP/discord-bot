import { logger } from './logger.js';

class ConversationContext {
  constructor() {
    this.conversations = new Map();
    this.contextLimit = parseInt(process.env.CONTEXT_LIMIT || '10', 10);
  }

  addMessage(userId, role, content) {
    if (!this.conversations.has(userId)) {
      this.conversations.set(userId, []);
    }

    const messages = this.conversations.get(userId);
    messages.push({ role, content, timestamp: Date.now() });

    // Keep only the last N messages
    if (messages.length > this.contextLimit) {
      messages.shift();
    }

    logger.debug(`Added message for user ${userId}. Context size: ${messages.length}`);
  }

  getContext(userId) {
    if (!this.conversations.has(userId)) {
      return [];
    }
    return this.conversations.get(userId);
  }

  getFormattedContext(userId) {
    const context = this.getContext(userId);
    return context.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  resetContext(userId) {
    if (this.conversations.has(userId)) {
      this.conversations.delete(userId);
      logger.info(`Reset conversation context for user: ${userId}`);
      return true;
    }
    return false;
  }

  clearAll() {
    this.conversations.clear();
    logger.info('Cleared all conversation contexts');
  }

  getStats() {
    return {
      activeConversations: this.conversations.size,
      totalMessages: Array.from(this.conversations.values()).reduce((sum, msgs) => sum + msgs.length, 0),
    };
  }
}

export const conversationContext = new ConversationContext();
