/**
 * 选中状态桥接
 * Store selectedIds ↔ Leafer Editor 选中同步
 * 含 isSyncing 守卫防止循环更新
 */

import type {
  IEditorBridge,
  ShapeType,
} from '../../types';

const SHAPE_TYPES: ShapeType[] = [
  'arrow',
  'rect',
  'text',
  'mosaic',
];

export class SelectionBridge
  implements IEditorBridge
{
  private syncing = false;
  private callback:
    | ((
        ids: Record<ShapeType, string[]>
      ) => void)
    | null = null;

  isSyncing(): boolean {
    return this.syncing;
  }

  /** Store → Leafer 选中同步 */
  syncSelectionToBackend(
    ids: Record<ShapeType, string[]>
  ): void {
    this.syncing = true;
    try {
      // Phase 1 中实现：遍历 ids，
      // 将对应 Leafer 元素设为选中
      // 通过 app.editor.select(elements)
      void ids; // stub
    } finally {
      this.syncing = false;
    }
  }

  /** 注册 Leafer → Store 选中回调 */
  onSelectionChange(
    callback: (
      ids: Record<ShapeType, string[]>
    ) => void
  ): void {
    this.callback = callback;
  }

  /** Leafer Editor 选中事件触发时调用 */
  handleLeaferSelect(
    selectedIds: Record<ShapeType, string[]>
  ): void {
    if (this.syncing) return;
    this.callback?.(selectedIds);
  }

  /** 获取空选中状态 */
  static emptySelection(): Record<
    ShapeType,
    string[]
  > {
    const result = {} as Record<
      ShapeType,
      string[]
    >;
    for (const type of SHAPE_TYPES) {
      result[type] = [];
    }
    return result;
  }
}
