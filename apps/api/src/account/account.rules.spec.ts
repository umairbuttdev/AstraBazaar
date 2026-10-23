import { describe, expect, it } from 'vitest';
import { parseAddress, parseFullName } from './account.rules.js';

describe('account profile name', () => {
  it('keeps a trimmed name and allows clearing it', () => {
    expect(parseFullName('  Ada Lovelace  ')).toBe('Ada Lovelace');
    expect(parseFullName('   ')).toBeNull();
  });

  it('rejects an overly long name', () => {
    expect(parseFullName('A'.repeat(121))).toEqual({
      error: 'Name must be 120 characters or fewer',
    });
  });
});

describe('account addresses', () => {
  const valid = {
    fullName: 'Ada Lovelace',
    line1: '1 Analytical Way',
    city: 'London',
    postalCode: 'W1',
    country: 'gb',
    phone: '+44 20 7946 0000',
    isDefault: true,
  };

  it('normalizes a complete address', () => {
    expect(parseAddress(valid)).toEqual({
      value: {
        label: null,
        fullName: 'Ada Lovelace',
        line1: '1 Analytical Way',
        line2: null,
        city: 'London',
        state: null,
        postalCode: 'W1',
        country: 'GB',
        phone: '+44 20 7946 0000',
        isDefault: true,
      },
    });
  });

  it('requires the delivery fields and rejects an invalid phone', () => {
    expect(parseAddress({ ...valid, city: ' ' })).toEqual({
      error: 'City is required',
    });
    expect(parseAddress({ ...valid, phone: 'call-me' })).toEqual({
      error: 'Enter a valid phone number',
    });
  });
});
