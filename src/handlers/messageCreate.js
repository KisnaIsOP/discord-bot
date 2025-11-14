import { logger } from '../utils/logger.js';
import { checkSafety } from '../utils/safety.js';
import { rateLimiter } from '../utils/rateLimiter.js';
import { conversationContext } from '../utils/context.js';
import { apiRouter } from '../services/apiRouter.js';

const PREFIX = process.env.BOT_PREFIX || '!';

export async function handleMessageCreate(message, client) {
  // Ignore bot messages
  if (message.author.bot) return;

  const isPrefix = message.content.startsWith(PREFIX);
  const isMention = message.mentions.has(client.user);
  const isDM = message.isDMBased();

  if (!isPrefix && !isMention && !isDM) return;

  try {
    // Check safety
    const safetyCheck = checkSafety(message.content);
    if (!safetyCheck.safe) {
      await message.reply(safetyCheck.reason);
      return;
    }

    // Check rate limit
    const cooldown = rateLimiter.checkUserCooldown(message.author.id);
    if (cooldown.onCooldown) {
      await message.reply(`⏱️ Please wait ${cooldown.remainingSeconds}s before using the bot again.`);
      return;
    }

    // Check server rate limit
    if (message.guild) {
      const serverLimit = rateLimiter.checkServerLimit(message.guildId);
      if (serverLimit.limited) {
        await message.reply(
          `⚠️ Server rate limit reached (${serverLimit.limit} messages/min). Try again in ${serverLimit.resetIn}s.`
        );
        return;
      }
    }

    let userMessage = message.content;

    // Handle prefix commands
    if (isPrefix) {
      const args = message.content.slice(PREFIX.length).trim().split(/ +/);
      const command = args.shift().toLowerCase();

      if (command === 'reset') {
        const reset = conversationContext.resetContext(message.author.id);
        const response = reset ? '✅ Conversation history cleared!' : 'No conversation history to clear.';
        await message.reply(response);
        return;
      }

      if (command === 'help') {
        const helpEmbed = {
          color: 0x0099ff,
          title: '📖 Bot Help',
          fields: [
            {
              name: 'Slash Commands',
              value: '`/ask` - Ask a question\n`/reset` - Clear history\n`/help` - Show this help',
            },
            {
              name: 'Prefix Commands',
              value: `\`${PREFIX}ask\` - Ask a question\n\`${PREFIX}reset\` - Clear history\n\`${PREFIX}help\` - Show this help`,
            },
            {
              name: 'Mentions',
              value: 'Mention the bot in any message and I\'ll respond!',
            },
            {
              name: 'Direct Messages',
              value: 'Send me a DM and I\'ll reply directly!',
            },
          ],
          footer: { text: 'Powered by Free APIs' },
        };
        await message.reply({ embeds: [helpEmbed] });
        return;
      }

      if (command === 'ask') {
        userMessage = args.join(' ');
        if (!userMessage) {
          await message.reply('Please provide a question. Usage: `!ask <question>`');
          return;
        }
      }
    } else if (isMention) {
      // Remove bot mention and get message
      userMessage = message.content.replace(`<@${client.user.id}>`, '').trim();
    }

    // Empty message check
    if (!userMessage || userMessage.length === 0) {
      await message.reply('Please provide a question or message.');
      return;
    }

    // Show typing indicator
    await message.channel.sendTyping();

    // Add user message to context
    if (process.env.ENABLE_CONVERSATION_CONTEXT !== 'false') {
      conversationContext.addMessage(message.author.id, 'user', userMessage);
    }

    // Get conversation context
    let messages = [];
    if (process.env.ENABLE_CONVERSATION_CONTEXT !== 'false') {
      messages = conversationContext.getFormattedContext(message.author.id);
    } else {
      messages = [{ role: 'user', content: userMessage }];
    }

    // Send to API
    const response = await apiRouter.sendMessage(messages);

    if (!response.success) {
      logger.error('API error:', response.error);
      await message.reply(`❌ Error: ${response.error}`);
      return;
    }

    // Add assistant response to context
    if (process.env.ENABLE_CONVERSATION_CONTEXT !== 'false') {
      conversationContext.addMessage(message.author.id, 'assistant', response.content);
    }

    // Send response (split if too long)
    const maxLength = 2000;
    if (response.content.length > maxLength) {
      const chunks = response.content.match(/[\s\S]{1,1900}/g);
      for (const chunk of chunks) {
        await message.reply(chunk);
      }
    } else {
      await message.reply(response.content);
    }

    logger.info(`Message processed for user ${message.author.tag}`, {
      provider: response.model,
      contentLength: response.content.length,
    });
  } catch (error) {
    logger.error('Error handling message:', error);
    await message.reply('❌ An error occurred processing your message. Please try again.').catch(() => {});
  }
}
