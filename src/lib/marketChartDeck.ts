export function getStableMarketChartDeck<T extends { id: string }>(
  visibleItems: readonly T[],
  currentItem: T,
  adjacentItems: readonly T[],
): T[] {
  const keepIds = new Set([currentItem.id, ...adjacentItems.map(item => item.id)]);
  const ordered = visibleItems.filter(item => keepIds.has(item.id));
  return ordered.some(item => item.id === currentItem.id) ? ordered : [currentItem];
}
