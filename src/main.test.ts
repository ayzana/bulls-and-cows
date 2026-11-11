import { describe, expect, it } from 'vitest';
import { generateSecret, createDigitValidator, evaluateGuess, isValidGuess } from './main';

describe('generateSecret', () => {
  it('детерминирована при заданном random', () => {
    const seq = (() => {
      let i = 0;
      const v = [0.1, 0.1, 0.1, 0.1];
      return () => v[i++ % v.length];
    })();
    expect(generateSecret(4, 10, seq)).toBe('1023');
  });
});

describe('evaluateGuess', () => {
  it('считает bulls/cows', () => {
    expect(evaluateGuess('1234', '1243')).toEqual({ bulls: 2, cows: 2 });
  });
  it('hex нечувствителен к регистру', () => {
    expect(evaluateGuess('a1b2', 'A2B3')).toEqual({ bulls: 2, cows: 1 });
  });
});

describe('isValidGuess', () => {
  it('валидирует длину/алфавит/уникальность', () => {
    expect(isValidGuess('0123', 4, 10)).toBe(true);
    expect(isValidGuess('0012', 4, 10)).toBe(false);
    expect(isValidGuess('0128', 4, 8)).toBe(false);
  });
});

describe('createDigitValidator', () => {
  it('hex: a и A', () => {
    const v = createDigitValidator(16);
    expect(v('a')).toBe(true);
    expect(v('A')).toBe(true);
    expect(v('g')).toBe(false);
  });
});
