import { describe, expect, it } from 'vitest';
import { normalizeFieldValue } from '@/app/lib/auth-validation';

describe('normalizeFieldValue', () => {
  it('formats names with title case and preserves separators', () => {
    expect(normalizeFieldValue('name', 'jane o\'connor-smith', true)).toBe('Jane O\'Connor-Smith');
  });

  it('lowercases and trims email addresses', () => {
    expect(normalizeFieldValue('email', '  John.Doe@Example.com  ')).toBe('john.doe@example.com');
  });

  it('strips non-digit characters from phone numbers and caps at 10 digits', () => {
    expect(normalizeFieldValue('phone', '(123) 456-7890 999')).toBe('1234567890');
  });

  it('formats date of birth digits into dd/mm/yyyy progressively', () => {
    expect(normalizeFieldValue('dob', '01012000')).toBe('01/01/2000');
    expect(normalizeFieldValue('dob', '0101')).toBe('01/01');
    expect(normalizeFieldValue('dob', '01')).toBe('01');
  });

  it('truncates password input to 15 characters and removes whitespace', () => {
    expect(normalizeFieldValue('password', 'abc def ghijklmnopqrstuvwxyz')).toBe('abcdefghijklmno');
  });
});
