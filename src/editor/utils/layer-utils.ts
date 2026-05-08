/**
 * 图层排序工具
 * 提供 zIndex 相关的计算和操作
 */

interface ZIndexItem {
  id: string;
  zIndex: number;
}

/** 获取当前最大 zIndex，空数组返回 -1 */
export function getMaxZIndex(
  shapes: ZIndexItem[]
): number {
  if (shapes.length === 0) return -1;
  return Math.max(...shapes.map((s) => s.zIndex));
}

/** 按 zIndex 升序排序（返回新数组） */
export function sortByZIndex<T extends ZIndexItem>(
  shapes: T[]
): T[] {
  return [...shapes].sort((a, b) => a.zIndex - b.zIndex);
}

/** 交换两个图形的 zIndex（返回新数组） */
export function swapZIndex<T extends ZIndexItem>(
  shapes: T[],
  idA: string,
  idB: string
): T[] {
  const a = shapes.find((s) => s.id === idA);
  const b = shapes.find((s) => s.id === idB);
  if (!a || !b) return shapes;
  return shapes.map((s) => {
    if (s.id === idA) return { ...s, zIndex: b.zIndex };
    if (s.id === idB) return { ...s, zIndex: a.zIndex };
    return s;
  });
}
