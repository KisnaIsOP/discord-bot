import { logger } from './logger.js';

const bannedWords = [
  'hate',
  'racism',
  'abuse',
  'violence',
  'self-harm',
  'suicide',
  'illegal',
  'drugs',
];

export function checkSafety(content) {
  if (!process.env.ENABLE_SAFETY_FILTER || process.env.ENABLE_SAFETY_FILTER === 'false') {
    return { safe: true };
  }

  const lowerContent = content.toLowerCase();
  
  for (const word of bannedWords) {
    if (lowerContent.includes(word)) {
      logger.warn(`Safety filter blocked message containing: ${word}`);
      return {
        safe: false,
        reason: `Your message contains restricted content. Please avoid: ${word}`,
      };
    }
  }

  return { safe: true };
}

export function addBannedWord(word) {
  if (!bannedWords.includes(word.toLowerCase())) {
    bannedWords.push(word.toLowerCase());
    logger.info(`Added banned word: ${word}`);
  }
}

export function removeBannedWord(word) {
  const index = bannedWords.indexOf(word.toLowerCase());
  if (index > -1) {
    bannedWords.splice(index, 1);
    logger.info(`Removed banned word: ${word}`);
  }
}

export function getBannedWords() {
  return [...bannedWords];
}
