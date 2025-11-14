import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { logger } from '../utils/logger.js';
import { apiRouter } from '../services/apiRouter.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show help information'),

  async execute(interaction) {
    try {
      const prefix = process.env.BOT_PREFIX || '!';
      const activeProviders = apiRouter.getAvailableProviders();
      const activeProvider = apiRouter.getActiveProvider();

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('📖 Discord ChatBot Help')
        .addFields(
          {
            name: 'Slash Commands',
            value: '`/ask <question>` - Ask a question\n`/reset` - Clear conversation history\n`/help` - Show this help',
            inline: false,
          },
          {
            name: `Prefix Commands (${prefix})`,
            value: `\`${prefix}ask <question>\` - Ask a question\n\`${prefix}reset\` - Clear history\n\`${prefix}help\` - Show help`,
            inline: false,
          },
          {
            name: 'Mentions',
            value: `Just mention <@${interaction.client.user.id}> in any message and I'll respond!`,
            inline: false,
          },
          {
            name: 'Direct Messages',
            value: 'Send me a DM and I\'ll reply directly!',
            inline: false,
          },
          {
            name: 'Features',
            value: '✅ Conversation context (last 10 messages)\n✅ Safety filter\n✅ Rate limiting\n✅ Typing indicator\n✅ Auto-retry on errors',
            inline: false,
          },
          {
            name: 'API Provider',
            value: `Active: **${activeProvider}**\nAvailable: ${activeProviders.join(', ') || 'None'}`,
            inline: false,
          }
        )
        .setFooter({ text: 'Powered by Free APIs' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      logger.info(`/help executed by ${interaction.user.tag}`);
    } catch (error) {
      logger.error('Error in /help command:', error);
      await interaction.reply('❌ An error occurred displaying help.');
    }
  },
};
