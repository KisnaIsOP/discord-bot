import assert from 'assert';
import { openRouterService } from '../src/services/openrouter.js';

// Simple test for OpenRouter service
const testMessages = [
  {
    role: 'user',
    content: 'What is 2+2?',
  },
];

console.log('Testing OpenRouter Service...');

if (!process.env.OPENROUTER_API_KEY) {
  console.warn('⚠️ OPENROUTER_API_KEY not set. Skipping API test.');
  console.log('Set OPENROUTER_API_KEY in .env to enable this test.');
  process.exit(0);
}

try {
  const response = await openRouterService.sendMessage(testMessages);
  
  assert(response.success === true, 'Response should be successful');
  assert(response.content.length > 0, 'Content should not be empty');
  assert(response.model !== undefined, 'Model should be defined');
  
  console.log('✅ All tests passed!');
  console.log('Response:', response.content.substring(0, 100) + '...');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
