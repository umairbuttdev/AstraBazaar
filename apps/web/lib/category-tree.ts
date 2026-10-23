export type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  children: CategoryNode[];
};

export type FlatCategory = CategoryNode & {
  depth: number;
  path: string;
};

type CategorySource = {
  id: string;
  name: string;
  slug?: string;
  parentId?: string | null;
};

export function buildCategoryTree(items: CategorySource[]): CategoryNode[] {
  const nodes = new Map<string, CategoryNode>();

  for (const item of items) {
    nodes.set(item.id, {
      id: item.id,
      name: item.name,
      slug: item.slug ?? "",
      parentId: item.parentId ?? null,
      children: [],
    });
  }

  const roots: CategoryNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent && parent.id !== node.id) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortLevel = (level: CategoryNode[]) => {
    level.sort((a, b) => a.name.localeCompare(b.name));
    for (const node of level) sortLevel(node.children);
  };
  sortLevel(roots);
  return roots;
}

/** Direct product counts keyed by category id (not including descendants). */
export function categoryCountMap(
  items: Array<{ id: string; _count?: { products?: number } }>,
) {
  return new Map(
    items.map((item) => [item.id, item._count?.products ?? 0] as const),
  );
}

/** Products on this category plus all descendants. */
export function countCategoryProducts(
  node: CategoryNode,
  counts: Map<string, number>,
): number {
  return (
    (counts.get(node.id) ?? 0) +
    node.children.reduce(
      (sum, child) => sum + countCategoryProducts(child, counts),
      0,
    )
  );
}

/** Drop categories (and empty branches) that have no products in the subtree. */
export function pruneEmptyCategories(
  nodes: CategoryNode[],
  counts: Map<string, number>,
): CategoryNode[] {
  return nodes.flatMap((node) => {
    if (countCategoryProducts(node, counts) <= 0) {
      return [];
    }
    return [
      {
        ...node,
        children: pruneEmptyCategories(node.children, counts),
      },
    ];
  });
}

export function flattenCategoryTree(
  nodes: CategoryNode[],
  depth = 0,
  prefix: string[] = [],
): FlatCategory[] {
  const rows: FlatCategory[] = [];
  for (const node of nodes) {
    const path = [...prefix, node.name];
    rows.push({ ...node, depth, path: path.join(" / ") });
    rows.push(...flattenCategoryTree(node.children, depth + 1, path));
  }
  return rows;
}

export function categoryOptionLabel(category: FlatCategory) {
  return `${"— ".repeat(category.depth)}${category.name}`;
}
