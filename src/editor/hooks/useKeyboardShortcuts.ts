/**
 * useKeyboardShortcuts - 键盘快捷键 Hook
 *
 * 处理 Editor 中的键盘快捷键，包括：
 * - Ctrl/Cmd + Z: 撤销
 * - Ctrl/Cmd + Shift + Z / Ctrl/Cmd + Y: 重做
 * - Ctrl/Cmd + A: 全选
 * - Escape: 取消选择/框选
 * - Delete/Backspace: 删除选中
 * - Enter (裁剪模式): 应用裁剪
 */

import { useEffect } from 'react';
import { useSyncedRef } from './useSyncedRef';

/**
 * 图形选择状态
 */
interface SelectionState {
  arrowIds: string[];
  rectIds: string[];
  textIds: string[];
  mosaicIds: string[];
}

/**
 * 键盘快捷键回调
 */
interface KeyboardShortcutsCallbacks {
  onUndo: () => void;
  onRedo: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDelete: () => void;
  onApplyCrop?: () => void;
  onCancelCrop?: () => void;
  onCancelMarquee?: () => void;
  pushHistory: () => void;
}

/**
 * 键盘快捷键配置
 */
interface KeyboardShortcutsConfig {
  activeTool: string;
  cropArea: unknown;
  selection: SelectionState;
  isMarqueeSelecting: React.MutableRefObject<boolean>;
}

/**
 * 键盘快捷键 Hook
 */
export function useKeyboardShortcuts(
  config: KeyboardShortcutsConfig,
  callbacks: KeyboardShortcutsCallbacks
): void {
  const { activeTool, cropArea, selection, isMarqueeSelecting } = config;
  const callbacksRef = useSyncedRef(callbacks);
  const selectionRef = useSyncedRef(selection);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略输入框中的快捷键
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const cb = callbacksRef.current;

      // Ctrl/Cmd + Z: 撤销
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        cb.onUndo();
        return;
      }

      // Ctrl/Cmd + Shift + Z 或 Ctrl/Cmd + Y: 重做
      if (((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) ||
          ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        e.preventDefault();
        cb.onRedo();
        return;
      }

      // Ctrl/Cmd + A: 全选
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        cb.onSelectAll();
        return;
      }

      // Escape: 取消选择/框选/裁剪
      if (e.key === 'Escape') {
        if (activeTool === 'crop' && cb.onCancelCrop) {
          e.preventDefault();
          cb.onCancelCrop();
          return;
        }
        if (isMarqueeSelecting.current && cb.onCancelMarquee) {
          cb.onCancelMarquee();
          return;
        }
        cb.onClearSelection();
        return;
      }

      // 裁剪模式下的 Enter
      if (activeTool === 'crop' && e.key === 'Enter' && cropArea && cb.onApplyCrop) {
        e.preventDefault();
        cb.onApplyCrop();
        return;
      }

      // Delete/Backspace: 删除选中
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const sel = selectionRef.current;
        const hasSelection =
          sel.arrowIds.length > 0 ||
          sel.rectIds.length > 0 ||
          sel.textIds.length > 0 ||
          sel.mosaicIds.length > 0;

        if (hasSelection) {
          cb.pushHistory();
          cb.onDelete();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool, cropArea, isMarqueeSelecting]);
}

export default useKeyboardShortcuts;
