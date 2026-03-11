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
    projects: [{ name: 'North' }, { name: 'South' }],
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

  it('resolves wildcard object path', () => {
    expect(findByJsonPath(value, '$.profile.*')).toBe('Alice');
  });

  it('resolves wildcard array path', () => {
    expect(findByJsonPath(value, '$.projects[*].name')).toBe('North');
  });

  it('resolves recursive key path', () => {
    expect(findByJsonPath(value, '$..name')).toBe('Alice');
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
    nested: {
      child: {
        tags: ['gamma'],
      },
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

  it('supports wildcard json path value query', () => {
    expect(matchesSearchQuery('Customer', data, '$.profile.tags[*]=beta')).toBe(true);
    expect(matchesSearchQuery('Customer', data, '$.profile.tags[*]=gamma')).toBe(false);
  });

  it('supports recursive json path value query', () => {
    expect(matchesSearchQuery('Customer', data, '$..tags[*]=gamma')).toBe(true);
    expect(matchesSearchQuery('Customer', data, '$..tags[*]=delta')).toBe(false);
  });

  it('falls back to text search for non-path query', () => {
    expect(matchesSearchQuery('Customer', data, 'active')).toBe(true);
    expect(matchesSearchQuery('Customer', data, 'missing-token')).toBe(false);
  });
});
