import assert from 'assert';
import { rateLimiter } from '../src/utils/rateLimiter.js';

console.log('Testing Rate Limiter...');

// Test 1: First request should pass
let result = rateLimiter.checkUserCooldown('user123');
assert(result.onCooldown === false, 'First request should not be on cooldown');
console.log('✅ Test 1: First request passed');

// Test 2: Immediate second request should fail
result = rateLimiter.checkUserCooldown('user123');
assert(result.onCooldown === true, 'Second immediate request should be on cooldown');
console.log('✅ Test 2: Cooldown enforcement passed');

// Test 3: Different user should not be affected
result = rateLimiter.checkUserCooldown('user456');
assert(result.onCooldown === false, 'Different user should not share cooldown');
console.log('✅ Test 3: Per-user cooldown passed');

// Test 4: Reset cooldown
rateLimiter.resetUserCooldown('user123');
result = rateLimiter.checkUserCooldown('user123');
assert(result.onCooldown === false, 'Should allow request after reset');
console.log('✅ Test 4: Reset cooldown passed');

console.log('\n✅ All rate limiter tests passed!');
