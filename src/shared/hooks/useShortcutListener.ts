import { useEffect, useCallback } from 'react';
import { useSettingsStore } from '@shared/stores/settings-store';
import type { ShortcutCommand } from '@shared/types';
import { normalizeShortcut } from '@shared/utils/shortcut-utils';

/**
 * 快捷键回调映射
 */
export interface ShortcutCallbacks {
  captureVisible?: () => void;
  captureRegion?: () => void;
  captureFullpage?: () => void;
  captureDesktop?: () => void;
}

/**
 * 页面快捷键监听 Hook
 * 用于在 Popup、Editor、CodeGen 页面中监听自定义快捷键
 */
export function useShortcutListener(callbacks: ShortcutCallbacks) {
  const { settings } = useSettingsStore();
  const { shortcuts } = settings;

  // 检查是否匹配快捷键
  const matchShortcut = useCallback(
    (event: KeyboardEvent, shortcut: string): boolean => {
      if (!shortcut) return false;

      const normalized = normalizeShortcut(shortcut);
      const parts = normalized.split('+');

      // 检查修饰键
      const hasCtrl = parts.includes('CTRL');
      const hasAlt = parts.includes('ALT');
      const hasShift = parts.includes('SHIFT');

      // 检查修饰键匹配
      const ctrlMatch = hasCtrl
        ? event.ctrlKey || event.metaKey
        : !event.ctrlKey && !event.metaKey;
      const altMatch = hasAlt ? event.altKey : !event.altKey;
      const shiftMatch = hasShift ? event.shiftKey : !event.shiftKey;

      if (!ctrlMatch || !altMatch || !shiftMatch) return false;

      // 检查主键
      const mainKey = parts.find(
        (p) => !['CTRL', 'ALT', 'SHIFT'].includes(p)
      );

      if (!mainKey) return false;

      return event.key.toUpperCase() === mainKey;
    },
    []
  );

  // 键盘事件处理
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // 如果快捷键未启用，不处理
      if (!shortcuts.enabled) return;

      // 如果在输入框中，不处理
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // 遍历所有命令，检查是否匹配
      const commands: ShortcutCommand[] = [
        'captureVisible',
        'captureRegion',
        'captureFullpage',
        'captureDesktop',
      ];

      for (const command of commands) {
        const shortcut = shortcuts.custom[command];
        if (shortcut && matchShortcut(event, shortcut)) {
          event.preventDefault();
          event.stopPropagation();
          callbacks[command]?.();
          return;
        }
      }
    },
    [shortcuts, callbacks, matchShortcut]
  );

  // 注册事件监听
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    shortcuts,
    isEnabled: shortcuts.enabled,
  };
}
