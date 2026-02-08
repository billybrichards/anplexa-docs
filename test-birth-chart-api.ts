/**
 * Test Script for Birth Chart API Endpoint
 *
 * Tests the /api/birth-chart/calculate endpoint without requiring a running server.
 * This script directly imports and tests the components.
 */

import { configureContainer } from './apps/api/src/container.js';
import { createApp } from './apps/api/src/app.js';
import type { Request, Response } from 'express';

// Test data
const testCases = [
  {
    name: 'Valid Birth Chart - New York',
    data: {
      userId: 'test-user-123',
      birthDate: '1990-01-15',
      birthTime: '14:30',
      timeZone: 'America/New_York',
      latitude: 40.7128,
      longitude: -74.0060,
      placeName: 'New York',
      country: 'USA',
    },
    expectSuccess: true,
  },
  {
    name: 'Valid Birth Chart - Unknown Time',
    data: {
      userId: 'test-user-456',
      birthDate: '1985-06-22',
      birthTime: null,
      timeZone: 'America/Los_Angeles',
      latitude: 34.0522,
      longitude: -118.2437,
      placeName: 'Los Angeles',
      country: 'USA',
    },
    expectSuccess: true,
  },
  {
    name: 'Invalid - Missing Required Fields',
    data: {
      userId: 'test-user-789',
      birthDate: '1995-03-10',
      // Missing other required fields
    },
    expectSuccess: false,
    expectedError: 'Validation error',
  },
  {
    name: 'Invalid - Invalid Date Format',
    data: {
      userId: 'test-user-999',
      birthDate: '01/15/1990', // Wrong format
      birthTime: '14:30',
      timeZone: 'America/New_York',
      latitude: 40.7128,
      longitude: -74.0060,
      placeName: 'New York',
      country: 'USA',
    },
    expectSuccess: false,
  },
];

async function runTests() {
  console.log('🧪 Birth Chart API Endpoint Test Suite\n');
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`\n📋 Test: ${testCase.name}`);
    console.log('-'.repeat(60));

    try {
      // Initialize container and app
      const container = configureContainer();
      const app = createApp(container);

      // Get the use case
      const { useCases } = container.cradle;
      const calculateBirthChart = useCases.calculateBirthChart;

      // Execute the use case
      const result = await calculateBirthChart.execute(testCase.data as any);

      if (testCase.expectSuccess) {
        console.log('✅ PASSED');
        console.log(`   Sun Sign: ${result.sunSign}`);
        console.log(`   Moon Sign: ${result.moonSign}`);
        console.log(`   Rising Sign: ${result.risingSign}`);
        console.log(`   Birth Chart ID: ${result.birthChart.id}`);
        console.log(`   Interpretation: ${result.interpretation.substring(0, 100)}...`);
        passed++;
      } else {
        console.log('❌ FAILED: Expected error but got success');
        failed++;
      }
    } catch (error) {
      if (!testCase.expectSuccess) {
        console.log('✅ PASSED (Expected error)');
        console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        passed++;
      } else {
        console.log('❌ FAILED');
        console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        if (error instanceof Error && error.stack) {
          console.log(`   Stack: ${error.stack.substring(0, 200)}...`);
        }
        failed++;
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  console.log(`   Total: ${testCases.length} tests\n`);

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  console.error('💥 Fatal error running tests:', error);
  process.exit(1);
});
