import { SlashCommandBuilder } from 'discord.js';
import { logger } from '../utils/logger.js';
import { checkSafety } from '../utils/safety.js';
import { rateLimiter } from '../utils/rateLimiter.js';
import { conversationContext } from '../utils/context.js';
import { apiRouter } from '../services/apiRouter.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Ask the bot a question')
    .addStringOption(option =>
      option
        .setName('question')
        .setDescription('Your question')
        .setRequired(true)
        .setMaxLength(500)
    ),

  async execute(interaction) {
    const question = interaction.options.getString('question');
    const userId = interaction.user.id;

    try {
      // Check safety
      const safetyCheck = checkSafety(question);
      if (!safetyCheck.safe) {
        await interaction.reply(safetyCheck.reason);
        return;
      }

      // Check rate limit
      const cooldown = rateLimiter.checkUserCooldown(userId);
      if (cooldown.onCooldown) {
        await interaction.reply(`⏱️ Please wait ${cooldown.remainingSeconds}s before asking again.`);
        return;
      }

      // Check server rate limit
      if (interaction.guildId) {
        const serverLimit = rateLimiter.checkServerLimit(interaction.guildId);
        if (serverLimit.limited) {
          await interaction.reply(
            `⚠️ Server rate limit reached (${serverLimit.limit} requests/min). Try again in ${serverLimit.resetIn}s.`
          );
          return;
        }
      }

      // Defer reply (API call might take a while)
      await interaction.deferReply();

      // Add user message to context
      if (process.env.ENABLE_CONVERSATION_CONTEXT !== 'false') {
        conversationContext.addMessage(userId, 'user', question);
      }

      // Get conversation context
      let messages = [];
      if (process.env.ENABLE_CONVERSATION_CONTEXT !== 'false') {
        messages = conversationContext.getFormattedContext(userId);
      } else {
        messages = [{ role: 'user', content: question }];
      }

      // Send to API
      const response = await apiRouter.sendMessage(messages);

      if (!response.success) {
        logger.error('API error:', response.error);
        await interaction.editReply(`❌ Error: ${response.error}`);
        return;
      }

      // Add assistant response to context
      if (process.env.ENABLE_CONVERSATION_CONTEXT !== 'false') {
        conversationContext.addMessage(userId, 'assistant', response.content);
      }

      // Send response (split if too long)
      const maxLength = 2000;
      if (response.content.length > maxLength) {
        const chunks = response.content.match(/[\s\S]{1,1900}/g);
        await interaction.editReply(chunks[0]);
        for (let i = 1; i < chunks.length; i++) {
          await interaction.followUp(chunks[i]);
        }
      } else {
        await interaction.editReply(response.content);
      }

      logger.info(`/ask executed by ${interaction.user.tag}`, {
        provider: response.model,
        contentLength: response.content.length,
      });
    } catch (error) {
      logger.error('Error in /ask command:', error);
      const errorMessage = '❌ An error occurred processing your question. Please try again.';
      
      if (interaction.deferred) {
        await interaction.editReply(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  },
};
