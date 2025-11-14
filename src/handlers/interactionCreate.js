import { logger } from '../utils/logger.js';

export async function handleInteractionCreate(interaction, client) {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    logger.warn(`No command found for: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
    logger.debug(`Executed command: ${interaction.commandName} by ${interaction.user.tag}`);
  } catch (error) {
    logger.error(`Error executing command ${interaction.commandName}:`, error);
    
    const errorMessage = '❌ There was an error executing this command!';
    
    if (interaction.replied) {
      await interaction.followUp(errorMessage);
    } else if (interaction.deferred) {
      await interaction.editReply(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
}
