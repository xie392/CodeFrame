/**
 * useKeyboardShortcuts - 键盘快捷键 Hook
 *
 * 处理 Editor 中的键盘快捷键，包括：
 * - Ctrl/Cmd + Z: 撤销
 * - Ctrl/Cmd + Shift + Z / Ctrl/Cmd + Y: 重做
 * - Ctrl/Cmd + A: 全选
 * - Escape: 取消选择/框选/退出裁剪模式
 * - Delete/Backspace: 删除选中
 * - V: 选择工具
 * - A: 箭头工具
 * - R: 矩形工具
 * - T: 文字工具
 * - M: 马赛克工具
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
  onSwitchTool?: (tool: string) => void;
  pushHistory: () => void;
}

/**
 * 键盘快捷键配置
 */
interface KeyboardShortcutsConfig {
  activeTool: string;
  isCropMode: boolean;
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
  const { activeTool, isCropMode, cropArea, selection, isMarqueeSelecting } = config;
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

      // Escape: 取消选择/框选/裁剪模式
      if (e.key === 'Escape') {
        if (isCropMode && cb.onCancelCrop) {
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
      if (isCropMode && e.key === 'Enter' && cropArea && cb.onApplyCrop) {
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

      // 工具快捷键（非组合键，非裁剪模式）
      if (!e.ctrlKey && !e.metaKey && !e.altKey && !isCropMode) {
        switch (e.key.toLowerCase()) {
          case 'v':
          case 'escape':
            cb.onSwitchTool?.('select');
            return;
          case 'a':
            cb.onSwitchTool?.('arrow');
            return;
          case 'r':
            cb.onSwitchTool?.('rect');
            return;
          case 't':
            cb.onSwitchTool?.('text');
            return;
          case 'm':
            cb.onSwitchTool?.('mosaic');
            return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool, isCropMode, cropArea, isMarqueeSelecting]);
}

export default useKeyboardShortcuts;
