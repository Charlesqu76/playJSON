import { describe, expect, it } from 'vitest';
import { findByJsonPath, flattenSearchText, matchesSearchQuery } from '../utils/search';

describe('flattenSearchText', () => {
  it('collects title, keys, and values', () => {
    const text = flattenSearchText('Customer', {
      profile: {
        name: 'Alice',
        age: 30,
      },
      active: true,
    });

    expect(text).toContain('customer');
    expect(text).toContain('profile');
    expect(text).toContain('alice');
    expect(text).toContain('30');
    expect(text).toContain('true');
  });
});

describe('findByJsonPath', () => {
  const value = {
    profile: {
      name: 'Alice',
      tags: ['alpha', 'beta'],
      meta: { 'display name': 'Alice W' },
    },
  };

  it('resolves nested object path', () => {
    expect(findByJsonPath(value, '$.profile.name')).toBe('Alice');
  });

  it('resolves array index path', () => {
    expect(findByJsonPath(value, '$.profile.tags[1]')).toBe('beta');
  });

  it('resolves quoted key path', () => {
    expect(findByJsonPath(value, '$.profile.meta["display name"]')).toBe('Alice W');
  });

  it('returns undefined for missing path', () => {
    expect(findByJsonPath(value, '$.profile.missing')).toBeUndefined();
  });
});

describe('matchesSearchQuery', () => {
  const data = {
    profile: {
      age: 30,
      tags: ['alpha', 'beta'],
    },
    active: true,
  };

  it('supports json path existence query', () => {
    expect(matchesSearchQuery('Customer', data, '$.profile.tags[0]')).toBe(true);
    expect(matchesSearchQuery('Customer', data, '$.profile.tags[3]')).toBe(false);
  });

  it('supports json path value query', () => {
    expect(matchesSearchQuery('Customer', data, '$.profile.age=30')).toBe(true);
    expect(matchesSearchQuery('Customer', data, '$.profile.age=31')).toBe(false);
  });

  it('falls back to text search for non-path query', () => {
    expect(matchesSearchQuery('Customer', data, 'active')).toBe(true);
    expect(matchesSearchQuery('Customer', data, 'missing-token')).toBe(false);
  });
});
