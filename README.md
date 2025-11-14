# Discord Chatbot

A production-ready Discord chatbot using free APIs (OpenRouter/DeepSeek) with slash commands, prefix commands, conversation context, safety filtering, and rate limiting.

## Features

✨ **Commands**
- Slash commands: `/ask`, `/reset`, `/help`
- Prefix commands: `!ask`, `!reset`, `!help`
- Mention support: Reply to bot mentions
- Direct Messages: DM the bot directly

🛡️ **Safety & Rate Limiting**
- Content safety filter with customizable banned words
- Per-user cooldown (5 seconds)
- Per-server rate limiting (10 messages/minute)
- Typing indicator while processing

💬 **Conversation Context**
- Maintains last 10 messages per user
- LRU (Least Recently Used) memory management
- Per-user conversation reset

⚙️ **API Support**
- OpenRouter (default) - Free tier available
- DeepSeek API support
- Automatic retry with exponential backoff
- Error handling and graceful fallbacks

## Requirements

- Node.js 18+ or higher
- A Discord Bot Token
- An API Key (OpenRouter or DeepSeek)

## Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd discord-bot
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```env
DISCORD_TOKEN=your_discord_bot_token
OPENROUTER_API_KEY=your_openrouter_key
BOT_PREFIX=!
OWNER_ID=your_user_id_optional
```

### 3. Run Locally

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

## Free API Keys

### OpenRouter
1. Go to https://openrouter.ai/
2. Sign up for free
3. Generate API key from dashboard
4. Uses `deepseek/deepseek-chat:free` model by default

### DeepSeek (Alternative)
1. Go to https://platform.deepseek.com/
2. Sign up for free
3. Generate API key from console
4. Set `API_PROVIDER=deepseek` in `.env`

## Usage

### Slash Commands (Recommended)
```
/ask <question>      - Ask the bot a question
/reset              - Clear your conversation history
/help               - Show help message
```

### Prefix Commands
```
!ask <question>     - Ask the bot a question
!reset              - Clear your conversation history
!help               - Show help message
```

### Mentions
Simply mention the bot in any message to get a response.

### Direct Messages
Send any message to the bot in DMs.

## Deployment

### Render
1. Create new Web Service
2. Build Command: `npm install`
3. Start Command: `npm start`
4. Add environment variables

### Railway
1. Create Node.js project
2. Add `.env` variables in project settings
3. Deploy automatically

### Heroku (with Procfile)
1. Create Heroku app
2. Set config vars from `.env`
3. Deploy with `git push heroku main`

Create `Procfile`:
```
web: npm start
```

### Docker
See `Dockerfile` for containerized deployment.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Bot not responding | Enable Message Content Intent in Discord Developer Portal |
| Slash commands not visible | Wait 10 minutes for propagation or reinvite bot with `applications.commands` scope |
| API errors | Check API key validity and rate limits |
| Missing .env | Copy `.env.example` to `.env` and fill values |

## Project Structure

```
discord-bot/
├── src/
│   ├── index.js              # Main bot entry point
│   ├── commands/             # Command handlers
│   │   ├── ask.js
│   │   ├── help.js
│   │   └── reset.js
│   ├── services/             # API integrations
│   │   ├── openrouter.js
│   │   └── deepseek.js
│   ├── utils/                # Utilities
│   │   ├── logger.js
│   │   ├── safety.js
│   │   ├── rateLimiter.js
│   │   └── context.js
│   └── handlers/             # Event handlers
│       ├── messageCreate.js
│       └── interactionCreate.js
├── tests/                    # Unit tests
├── .env.example              # Example environment file
├── .gitignore
├── package.json
├── Dockerfile
└── README.md
```

## License

MIT

## Support

For issues and questions, open an issue on GitHub.
