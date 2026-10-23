import { describe, expect, it } from 'vitest';
import { categoryIdsInTree } from './category-ids.js';

describe('categoryIdsInTree', () => {
  const rows = [
    { id: 'makeup', parentId: null },
    { id: 'face', parentId: 'makeup' },
    { id: 'foundation', parentId: 'face' },
    { id: 'hair', parentId: null },
  ];

  it('includes the category and every nested subcategory', () => {
    expect(categoryIdsInTree(rows, 'makeup').sort()).toEqual([
      'face',
      'foundation',
      'makeup',
    ]);
  });

  it('stops at a category with no children', () => {
    expect(categoryIdsInTree(rows, 'foundation')).toEqual(['foundation']);
  });
});
