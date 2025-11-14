import { Client, GatewayIntentBits, Collection } from 'discord.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readdirSync } from 'fs';
import { logger } from './utils/logger.js';
import { handleMessageCreate } from './handlers/messageCreate.js';
import { handleInteractionCreate } from './handlers/interactionCreate.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Validate environment variables
const requiredEnvVars = ['DISCORD_TOKEN'];
const optionalApiVars = ['OPENROUTER_API_KEY', 'DEEPSEEK_API_KEY'];

const hasApiKey = optionalApiVars.some(key => process.env[key]);

if (!process.env.DISCORD_TOKEN) {
  logger.error('DISCORD_TOKEN is required in .env file');
  process.exit(1);
}

if (!hasApiKey) {
  logger.error('At least one API key (OPENROUTER_API_KEY or DEEPSEEK_API_KEY) is required in .env file');
  process.exit(1);
}

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Store commands
client.commands = new Collection();

// Load commands
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = join(commandsPath, file);
  const command = await import(`file://${filePath}`);
  client.commands.set(command.default.data.name, command.default);
  logger.info(`Loaded command: ${command.default.data.name}`);
}

// Event: Ready
client.on('ready', async () => {
  logger.info(`✅ Bot logged in as ${client.user.tag}`);
  client.user.setActivity('/ask | /help', { type: 'LISTENING' });

  try {
    const commands = client.commands.map(cmd => cmd.data.toJSON());
    await client.application.commands.set(commands);
    logger.info(`✅ Registered ${commands.length} slash commands globally`);
  } catch (error) {
    logger.error('Failed to register slash commands:', error);
  }
});

// Event: Message Create (for prefix commands and mentions)
client.on('messageCreate', (message) => handleMessageCreate(message, client));

// Event: Interaction Create (for slash commands)
client.on('interactionCreate', (interaction) => handleInteractionCreate(interaction, client));

// Error handling
client.on('error', error => {
  logger.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
  logger.error('Unhandled rejection:', error);
});

// Login
client.login(process.env.DISCORD_TOKEN);
