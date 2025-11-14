import assert from 'assert';
import { checkSafety, getBannedWords } from '../src/utils/safety.js';

console.log('Testing Safety Filter...');

// Test 1: Safe content
let result = checkSafety('Hello, how are you today?');
assert(result.safe === true, 'Normal greeting should be safe');
console.log('✅ Test 1: Safe content detection passed');

// Test 2: Unsafe content
result = checkSafety('I hate this');
assert(result.safe === false, 'Hate should be flagged');
assert(result.reason !== undefined, 'Should provide reason');
console.log('✅ Test 2: Unsafe content detection passed');

// Test 3: Case insensitivity
result = checkSafety('I HATE YOU');
assert(result.safe === false, 'Should catch uppercase');
console.log('✅ Test 3: Case insensitivity passed');

// Test 4: Get banned words
const banned = getBannedWords();
assert(Array.isArray(banned), 'Should return array');
assert(banned.length > 0, 'Should have banned words');
console.log('✅ Test 4: Get banned words passed');

console.log('\n✅ All safety tests passed!');
