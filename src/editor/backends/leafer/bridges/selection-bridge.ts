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

  /** 开始同步（扩大守卫范围）*/
  startSync(): void {
    this.syncing = true;
  }

  /** 结束同步 */
  endSync(): void {
    this.syncing = false;
  }

  /** Store → Leafer 选中同步
   * 实际同步逻辑在 LeaferBackend.setSelection() 中处理，
   * 此方法仅提供 syncing 守卫。
   */
  syncSelectionToBackend(
    _ids: Record<ShapeType, string[]>
  ): void {
    // syncing 守卫由 LeaferBackend.setSelection() 中的
    // selectionBridge.startSync/endSync 管理
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
