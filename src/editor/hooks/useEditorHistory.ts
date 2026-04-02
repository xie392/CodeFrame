import { useRef, useCallback } from 'react';
import type { EditorState, HistoryState, HistoryActions } from '../types';

// 历史记录最大条数
const MAX_HISTORY_LENGTH = 50;

// 初始空状态
export const createEmptyEditorState = (): EditorState => ({
  arrows: [],
  rects: [],
  texts: [],
  mosaics: [],
  imageData: null,
  view: {
    scale: 1,
    offset: { x: 0, y: 0 },
  },
  selectedArrowIds: [],
  selectedRectIds: [],
  selectedTextIds: [],
  selectedMosaicIds: [],
});

/**
 * Editor 历史记录 Hook
 * 使用快照模式实现撤销/恢复功能
 */
export function useEditorHistory(): HistoryActions {
  // 使用 ref 存储历史状态，避免触发重渲染
  const historyRef = useRef<HistoryState>({
    past: [],
    present: createEmptyEditorState(),
    future: [],
  });

  // 推送新状态到历史记录
  const pushState = useCallback((state: EditorState) => {
    const history = historyRef.current;

    // 将当前状态推入 past 栈
    history.past.push(history.present);
    history.present = state;
    // 清空 future 栈（新操作后不可重做）
    history.future = [];

    // 限制历史记录长度
    if (history.past.length > MAX_HISTORY_LENGTH) {
      history.past.shift();
    }
  }, []);

  // 撤销
  const undo = useCallback((): EditorState | null => {
    const history = historyRef.current;

    if (history.past.length === 0) {
      return null;
    }

    // 将当前状态推入 future 栈
    history.future.push(history.present);
    // 从 past 栈弹出上一个状态
    const previous = history.past.pop();
    if (previous) {
      history.present = previous;
      return previous;
    }

    return null;
  }, []);

  // 重做
  const redo = useCallback((): EditorState | null => {
    const history = historyRef.current;

    if (history.future.length === 0) {
      return null;
    }

    // 将当前状态推入 past 栈
    history.past.push(history.present);
    // 从 future 栈弹出下一个状态
    const next = history.future.pop();
    if (next) {
      history.present = next;
      return next;
    }

    return null;
  }, []);

  // 是否可撤销
  const canUndo = useCallback((): boolean => {
    return historyRef.current.past.length > 0;
  }, []);

  // 是否可重做
  const canRedo = useCallback((): boolean => {
    return historyRef.current.future.length > 0;
  }, []);

  // 清空历史
  const clearHistory = useCallback(() => {
    historyRef.current = {
      past: [],
      present: historyRef.current.present,
      future: [],
    };
  }, []);

  // 重置到新状态（清除所有历史）
  const resetToState = useCallback((state: EditorState) => {
    historyRef.current = {
      past: [],
      present: state,
      future: [],
    };
  }, []);

  return {
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    resetToState,
  };
}
