export function categoryIdsInTree(
  rows: { id: string; parentId: string | null }[],
  rootId: string,
) {
  const children = new Map<string, string[]>();
  for (const row of rows) {
    if (!row.parentId) continue;
    const list = children.get(row.parentId) ?? [];
    list.push(row.id);
    children.set(row.parentId, list);
  }

  const ids: string[] = [];
  const pending = [rootId];
  const seen = new Set<string>();
  while (pending.length > 0) {
    const id = pending.pop();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    for (const childId of children.get(id) ?? []) pending.push(childId);
  }
  return ids;
}
