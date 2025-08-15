#!/usr/bin/env node

/**
 * Fast test execution script for frontend development workflow
 * Optimizes test execution based on mode and provides detailed feedback
 */

import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

async function runTests(mode = 'unit') {
  log('blue', '🚀 NeoForge Frontend Fast Test Suite');
  log('blue', '=====================================');

  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  const testCommand = packageJson.scripts?.test?.includes('vitest') ? 'vitest' : 'npm test';

  try {
    switch (mode) {
      case 'unit':
        log('blue', 'Running unit tests (component tests only)');
        log('yellow', 'Duration estimate: ~3-4 seconds');
        await runCommand('npm', ['run', 'test', '--', '--run', '--reporter=basic', 'src/test/components/', '--bail=5']);
        break;

      case 'accessibility':
        log('blue', 'Running accessibility tests');
        log('yellow', 'Duration estimate: ~10-15 seconds');
        await runCommand('npm', ['run', 'test', '--', '--run', '--reporter=verbose', 'src/test/advanced/accessibility-comprehensive.test.js']);
        break;

      case 'integration':
        log('blue', 'Running integration tests');
        log('yellow', 'Duration estimate: ~20-30 seconds');
        await runCommand('npm', ['run', 'test', '--', '--run', '--reporter=basic', 'src/test/integration/', '--bail=10']);
        break;

      case 'performance':
        log('blue', 'Running performance tests');
        log('yellow', 'Duration estimate: ~5-10 seconds');
        await runCommand('npm', ['run', 'test', '--', '--run', '--reporter=verbose', 'src/test/performance/']);
        break;

      case 'visual':
        log('blue', 'Running visual regression tests');
        log('yellow', 'Duration estimate: ~15-30 seconds');
        await runCommand('npm', ['run', 'test', '--', '--run', '--reporter=verbose', 'src/test/visual/']);
        break;

      case 'quick':
        log('blue', 'Running quick test suite (critical components + accessibility)');
        log('yellow', 'Duration estimate: ~20-30 seconds');
        
        // Run critical component tests
        await runCommand('npm', ['run', 'test', '--', '--run', '--reporter=basic', 'src/test/components/atoms/', '--bail=5']);
        log('green', '✓ Critical component tests passed');
        
        // Run accessibility tests
        await runCommand('npm', ['run', 'test', '--', '--run', '--reporter=basic', 'src/test/advanced/accessibility-comprehensive.test.js']);
        log('green', '✓ Accessibility tests passed');
        break;

      case 'coverage':
        log('blue', 'Running tests with coverage analysis');
        log('yellow', 'Duration estimate: ~60-90 seconds');
        await runCommand('npm', ['run', 'test', '--', '--run', '--coverage', '--reporter=verbose']);
        break;

      case 'ci':
        log('blue', 'Running CI-optimized test suite');
        log('yellow', 'Duration estimate: ~45-60 seconds');
        await runCommand('npm', ['run', 'test', '--', '--run', '--reporter=json', '--threads=false', '--bail=10']);
        break;

      case 'all':
        log('blue', 'Running comprehensive test suite');
        log('yellow', 'Duration estimate: ~2-3 minutes');
        
        // Phase 1: Unit tests
        log('yellow', 'Phase 1: Unit Tests');
        await runCommand('npm', ['run', 'test', '--', '--run', '--reporter=basic', 'src/test/components/', '--bail=10']);
        log('green', '✓ Unit tests completed');
        
        // Phase 2: Integration tests
        log('yellow', 'Phase 2: Integration Tests');
        await runCommand('npm', ['run', 'test', '--', '--run', '--reporter=basic', 'src/test/integration/', '--bail=5']);
        log('green', '✓ Integration tests completed');
        
        // Phase 3: Accessibility tests
        log('yellow', 'Phase 3: Accessibility Tests');
        await runCommand('npm', ['run', 'test', '--', '--run', '--reporter=basic', 'src/test/advanced/accessibility-comprehensive.test.js']);
        log('green', '✓ Accessibility tests completed');
        
        // Phase 4: Performance tests
        log('yellow', 'Phase 4: Performance Tests');
        await runCommand('npm', ['run', 'test', '--', '--run', '--reporter=basic', 'src/test/performance/']);
        log('green', '✓ Performance tests completed');
        break;

      default:
        log('red', `Invalid mode: ${mode}`);
        console.log('Available modes:');
        console.log('  unit           - Unit tests only (~3-4s)');
        console.log('  accessibility  - Accessibility tests (~10-15s)');
        console.log('  integration    - Integration tests (~20-30s)');
        console.log('  performance    - Performance tests (~5-10s)');
        console.log('  visual         - Visual regression tests (~15-30s)');
        console.log('  quick          - Critical tests (~20-30s)');
        console.log('  coverage       - Tests with coverage (~60-90s)');
        console.log('  ci             - CI-optimized suite (~45-60s)');
        console.log('  all            - Complete test suite (~2-3min)');
        console.log('');
        console.log('Usage: node scripts/test-fast.js [mode]');
        process.exit(1);
    }

    log('green', '🎉 Test execution completed successfully!');
    
  } catch (error) {
    log('red', `❌ Test execution failed: ${error.message}`);
    process.exit(1);
  }
}

// Get mode from command line arguments
const mode = process.argv[2] || 'unit';
runTests(mode);