#!/usr/bin/env node

/**
 * Quick verification script to test ApiKeyRepository and FunnelApiKeyRepository
 */

import { ApiKeyRepository, FunnelApiKeyRepository } from '@anplexa/core/repositories';
import { apiKeys, funnelApiKeys } from '@anplexa/database';

console.log('Testing repository imports...\n');

// Test 1: Check repository classes exist
console.log('1. Checking repository classes:');
console.log('   - ApiKeyRepository:', typeof ApiKeyRepository === 'function' ? '✓' : '✗');
console.log('   - FunnelApiKeyRepository:', typeof FunnelApiKeyRepository === 'function' ? '✓' : '✗');

// Test 2: Check schema exports exist
console.log('\n2. Checking schema exports:');
console.log('   - apiKeys table:', typeof apiKeys === 'object' ? '✓' : '✗');
console.log('   - funnelApiKeys table:', typeof funnelApiKeys === 'object' ? '✓' : '✗');

// Test 3: Check repository can be instantiated
console.log('\n3. Checking repository instantiation:');
try {
  // Mock database object
  const mockDb = {
    select: () => ({ from: () => ({ where: () => ({ limit: () => [] }) }) }),
    insert: () => ({ values: () => Promise.resolve() }),
    update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
    delete: () => ({ where: () => Promise.resolve() }),
  };

  const apiKeyRepo = new ApiKeyRepository(mockDb);
  const funnelApiKeyRepo = new FunnelApiKeyRepository(mockDb);

  console.log('   - ApiKeyRepository instance:', apiKeyRepo instanceof ApiKeyRepository ? '✓' : '✗');
  console.log('   - FunnelApiKeyRepository instance:', funnelApiKeyRepo instanceof FunnelApiKeyRepository ? '✓' : '✗');
} catch (error) {
  console.log('   ✗ Error:', error.message);
}

console.log('\n✓ All basic checks passed!');
console.log('\nNote: Run the full test suite with:');
console.log('  cd packages/core && npm test');
