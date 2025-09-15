/**
 * Global teardown for Playwright E2E tests
 * Cleans up test data and environment
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function globalTeardown(config) {
  console.log('🧹 Cleaning up E2E test environment...');

  try {
    // 1. Clean up test data
    console.log('🗑️ Cleaning up test data...');
    await cleanupTestData();

    // 2. Reset test database (optional - keep for debugging)
    console.log('🔄 Resetting test database...');
    await resetTestDatabase();

    // 3. Clean up test artifacts
    console.log('🧽 Cleaning up test artifacts...');
    await cleanupTestArtifacts();

    console.log('✅ E2E test environment cleanup complete!');
  } catch (error) {
    console.error('❌ Failed to clean up E2E test environment:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}

async function cleanupTestData() {
  try {
    // Remove test data file
    const testDataPath = path.join(__dirname, 'test-data.json');
    if (fs.existsSync(testDataPath)) {
      fs.unlinkSync(testDataPath);
      console.log('🗑️ Removed test data file');
    }

    // Clean up test users and data via API
    const testUsers = [
      'testuser@example.com',
      'admin@example.com',
      'manager@example.com'
    ];

    for (const email of testUsers) {
      try {
        // Note: In a real implementation, you'd make API calls to clean up
        // For now, we'll just log the cleanup intention
        console.log(`🧹 Would clean up test user: ${email}`);
      } catch (error) {
        console.log(`⚠️ Failed to clean up ${email}, continuing...`);
      }
    }

  } catch (error) {
    console.log('⚠️ Test data cleanup may have issues, continuing...');
  }
}

async function resetTestDatabase() {
  try {
    // Optional: Reset database to clean state
    // Only do this if explicitly requested to avoid losing debug data
    if (process.env.E2E_RESET_DATABASE === 'true') {
      console.log('Resetting database to clean state...');
      execSync('cd ../backend && make reset-db', {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..', '..', 'backend')
      });
    } else {
      console.log('Skipping database reset (set E2E_RESET_DATABASE=true to enable)');
    }
  } catch (error) {
    console.log('⚠️ Database reset may have issues, continuing...');
  }
}

async function cleanupTestArtifacts() {
  try {
    // Clean up test screenshots, videos, and traces
    const artifactsDir = path.join(__dirname, '..', 'test-results');
    if (fs.existsSync(artifactsDir)) {
      const files = fs.readdirSync(artifactsDir);
      let cleanedCount = 0;

      for (const file of files) {
        // Keep only recent artifacts for debugging
        const filePath = path.join(artifactsDir, file);
        const stats = fs.statSync(filePath);
        const ageInHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);

        if (ageInHours > 24) { // Clean files older than 24 hours
          fs.unlinkSync(filePath);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        console.log(`🧽 Cleaned up ${cleanedCount} old test artifacts`);
      }
    }

    // Clean up .env.e2e file
    const envPath = path.join(__dirname, '..', '.env.e2e');
    if (fs.existsSync(envPath)) {
      fs.unlinkSync(envPath);
      console.log('🗑️ Removed E2E environment config file');
    }

  } catch (error) {
    console.log('⚠️ Test artifacts cleanup may have issues, continuing...');
  }
}

export default globalTeardown;