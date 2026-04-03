/**
 * useTextEditing - 文字编辑 Hook
 *
 * 处理文字编辑功能，包括：
 * - 双击文字进入编辑模式
 * - 文字输入处理
 * - Enter 确认、Escape 取消
 * - 失焦保存
 */

import { useCallback, useRef } from 'react';
import type { TextShape } from '../types';

/**
 * 文字编辑状态
 */
interface TextEditingState {
  editingTextId: string | null;
  editingTextValue: string;
}

/**
 * 文字编辑回调
 */
interface TextEditingCallbacks {
  setEditingTextId: (id: string | null) => void;
  setEditingTextValue: (value: string) => void;
  setTexts: (updater: (prev: TextShape[]) => TextShape[]) => void;
  setSelectedTextIds: (ids: string[]) => void;
}

/**
 * 文字编辑 Hook 返回值
 */
interface UseTextEditingReturn {
  textInputRef: React.RefObject<HTMLInputElement>;
  startEditing: (text: TextShape) => void;
  stopEditing: (save: boolean) => void;
  handleTextChange: (value: string) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleBlur: () => void;
}

/**
 * 文字编辑 Hook
 */
export function useTextEditing(
  state: TextEditingState,
  callbacks: TextEditingCallbacks
): UseTextEditingReturn {
  const { editingTextId, editingTextValue } = state;
  const { setEditingTextId, setEditingTextValue, setTexts, setSelectedTextIds } = callbacks;
  const textInputRef = useRef<HTMLInputElement>(null);

  /**
   * 开始编辑文字
   */
  const startEditing = useCallback(
    (text: TextShape) => {
      setEditingTextId(text.id);
      setEditingTextValue(text.text);
      setSelectedTextIds([text.id]);
      // 延迟聚焦，确保 DOM 已更新
      setTimeout(() => {
        textInputRef.current?.focus();
        textInputRef.current?.select();
      }, 0);
    },
    [setEditingTextId, setEditingTextValue, setSelectedTextIds]
  );

  /**
   * 停止编辑
   */
  const stopEditing = useCallback(
    (save: boolean) => {
      if (save && editingTextId && editingTextValue.trim()) {
        setTexts((prev) =>
          prev.map((t) =>
            t.id === editingTextId ? { ...t, text: editingTextValue } : t
          )
        );
      }
      setEditingTextId(null);
      setEditingTextValue('');
    },
    [editingTextId, editingTextValue, setTexts, setEditingTextId, setEditingTextValue]
  );

  /**
   * 处理文字输入
   */
  const handleTextChange = useCallback(
    (value: string) => {
      setEditingTextValue(value);
    },
    [setEditingTextValue]
  );

  /**
   * 处理键盘事件
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        stopEditing(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        stopEditing(false);
      }
    },
    [stopEditing]
  );

  /**
   * 处理失焦
   */
  const handleBlur = useCallback(() => {
    stopEditing(true);
  }, [stopEditing]);

  return {
    textInputRef,
    startEditing,
    stopEditing,
    handleTextChange,
    handleKeyDown,
    handleBlur,
  };
}

export default useTextEditing;
