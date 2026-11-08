import { describe, expect, it } from 'vitest';
import { generateSecret } from './main';

describe('generateSecret', () => {
  it('детерминирована при заданном random', () => {
    const seq = (() => {
      let i = 0;
      const v = [0.1, 0.1, 0.1, 0.1];
      return () => v[i++ % v.length];
    })();
    expect(generateSecret(4, 10, seq)).toBe('0123');
  });
});
