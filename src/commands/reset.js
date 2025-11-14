import { SlashCommandBuilder } from 'discord.js';
import { logger } from '../utils/logger.js';
import { conversationContext } from '../utils/context.js';

export default {
  data: new SlashCommandBuilder()
    .setName('reset')
    .setDescription('Clear your conversation history'),

  async execute(interaction) {
    try {
      const reset = conversationContext.resetContext(interaction.user.id);
      const response = reset
        ? '✅ Your conversation history has been cleared!'
        : 'ℹ️ No conversation history to clear.';

      await interaction.reply(response);
      logger.info(`/reset executed by ${interaction.user.tag}`);
    } catch (error) {
      logger.error('Error in /reset command:', error);
      await interaction.reply('❌ An error occurred clearing your history.');
    }
  },
};
