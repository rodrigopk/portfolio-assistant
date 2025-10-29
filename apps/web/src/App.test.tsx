import { describe, it, expect } from 'vitest';

describe('App', () => {
  it('smoke test - module can be imported', async () => {
    const module = await import('./App');
    expect(module.default).toBeDefined();
  });
});
