/**
 * Critical Components Working Test
 *
 * Verify our critical components can actually load successfully
 */
import { describe, it, expect } from 'vitest';

describe('Critical Components - Success Test', () => {
  it('should successfully load icon component', async () => {
    const module = await import('../../components/atoms/icon/icon.js');
    expect(module).toBeDefined();
    // Icon component should be available
    expect(typeof module.default === 'function' || module.NeoIcon).toBeTruthy();
  });

  it('should successfully load badge component', async () => {
    const module = await import('../../components/atoms/badge/badge.js');
    expect(module).toBeDefined();
  });

  it('should successfully load checkbox component', async () => {
    const module = await import('../../components/atoms/checkbox/checkbox.js');
    expect(module).toBeDefined();
  });
});
