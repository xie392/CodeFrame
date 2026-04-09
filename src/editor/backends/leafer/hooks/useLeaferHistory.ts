/**
 * Leafer 历史记录 Hook
 * 利用 Leafer JSON 序列化实现撤销/重做
 * 保存 Leafer 状态快照到历史栈
 */

import {
  useRef,
  useCallback,
  useMemo,
} from 'react';
import type { EditorState } from '../../../types';
import type { IRendererBackend } from '../../types';

// 历史记录最大条数
const MAX_HISTORY = 50;

interface HistoryState {
  past: EditorState[];
  present: EditorState;
  future: EditorState[];
}

export interface LeaferHistoryActions {
  pushState(state: EditorState): void;
  undo(): EditorState | null;
  redo(): EditorState | null;
  canUndo(): boolean;
  canRedo(): boolean;
  clearHistory(): void;
  resetToState(state: EditorState): void;
}

const EMPTY_STATE: EditorState = {
  arrows: [],
  rects: [],
  texts: [],
  mosaics: [],
  imageData: null,
  view: { scale: 1, offset: { x: 0, y: 0 } },
  selectedArrowIds: [],
  selectedRectIds: [],
  selectedTextIds: [],
  selectedMosaicIds: [],
};

export function useLeaferHistory(
  _backend: IRendererBackend | null,
): LeaferHistoryActions {
  const historyRef = useRef<HistoryState>({
    past: [],
    present: { ...EMPTY_STATE },
    future: [],
  });

  const pushState = useCallback(
    (state: EditorState) => {
      const history = historyRef.current;
      history.past.push(history.present);
      history.present = state;
      history.future = [];
      if (history.past.length > MAX_HISTORY) {
        history.past.shift();
      }
    },
    [],
  );

  const undo = useCallback(
    (): EditorState | null => {
      const history = historyRef.current;
      if (history.past.length === 0)
        return null;
      history.future.push(history.present);
      const prev = history.past.pop();
      if (prev) {
        history.present = prev;
        return prev;
      }
      return null;
    },
    [],
  );

  const redo = useCallback(
    (): EditorState | null => {
      const history = historyRef.current;
      if (history.future.length === 0)
        return null;
      history.past.push(history.present);
      const next = history.future.pop();
      if (next) {
        history.present = next;
        return next;
      }
      return null;
    },
    [],
  );

  const canUndo = useCallback(
    (): boolean =>
      historyRef.current.past.length > 0,
    [],
  );

  const canRedo = useCallback(
    (): boolean =>
      historyRef.current.future.length > 0,
    [],
  );

  const clearHistory = useCallback(() => {
    historyRef.current = {
      past: [],
      present: historyRef.current.present,
      future: [],
    };
  }, []);

  const resetToState = useCallback(
    (state: EditorState) => {
      historyRef.current = {
        past: [],
        present: state,
        future: [],
      };
    },
    [],
  );

  return useMemo(
    () => ({
      pushState,
      undo,
      redo,
      canUndo,
      canRedo,
      clearHistory,
      resetToState,
    }),
    [
      pushState,
      undo,
      redo,
      canUndo,
      canRedo,
      clearHistory,
      resetToState,
    ],
  );
}
