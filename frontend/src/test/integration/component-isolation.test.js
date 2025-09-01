/**
 * Component Isolation Test
 *
 * First Principle: A component is testable if it can load independently
 * Test: Every component should import without throwing module resolution errors
 */
import { describe, it, expect } from 'vitest';

describe('Component Isolation - Import Resolution', () => {
  // This test will fail until we fix import consistency
  it('should load button component without import errors', async () => {
    // This will fail because button.js uses CDN imports
    // but our test environment expects npm imports
    const { NeoButton } = await import('../../components/atoms/button/button.js');
    expect(NeoButton).toBeDefined();
  });

  it('should load text-input component without import errors', async () => {
    // This will also fail for same reason
    const module = await import('../../components/atoms/text-input/text-input.js');
    expect(module).toBeDefined();
  });
});
