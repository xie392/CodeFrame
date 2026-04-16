/**
 * 共享编辑器操作 Hook
 * 统一 pushHistory / undo / redo 逻辑
 * 消除 Canvas2DCanvas 和 LeaferCanvas 中的重复代码
 */

import { useCallback } from 'react';
import { useEditorStore } from '../store/editor-store';
import { useEditorHistory } from './useEditorHistory';
import type { EditorState } from '../types';

/** 将 EditorState 应用到 Store */
function applyStateToStore(state: EditorState): void {
  const store = useEditorStore.getState();
  store.setArrows(state.arrows);
  store.setRects(state.rects);
  store.setTexts(state.texts);
  store.setMosaics(state.mosaics);
  if (
    state.imageData &&
    state.imageData !== store.imageData
  ) {
    store.setImageData(state.imageData);
  }
  store.setScale(state.view.scale);
  store.setOffset(state.view.offset);
  store.setSelectedArrowIds(state.selectedArrowIds);
  store.setSelectedRectIds(state.selectedRectIds);
  store.setSelectedTextIds(state.selectedTextIds);
  store.setSelectedMosaicIds(state.selectedMosaicIds);
}

/** 从当前 Store 快照一个 EditorState */
function snapshotState(): EditorState {
  const store = useEditorStore.getState();
  return {
    arrows: structuredClone(store.arrows),
    rects: structuredClone(store.rects),
    texts: structuredClone(store.texts),
    mosaics: structuredClone(store.mosaics),
    imageData: store.imageData,
    view: {
      scale: store.scale,
      offset: { ...store.offset },
    },
    selectedArrowIds: [...store.selectedArrowIds],
    selectedRectIds: [...store.selectedRectIds],
    selectedTextIds: [...store.selectedTextIds],
    selectedMosaicIds: [...store.selectedMosaicIds],
  };
}

export interface EditorActions {
  pushHistory: () => void;
  handleUndo: () => void;
  handleRedo: () => void;
  updateHistoryButtons: () => void;
  historyActions: ReturnType<typeof useEditorHistory>;
}

export function useEditorActions(): EditorActions {
  const historyActions = useEditorHistory();
  const setCanUndo = useEditorStore((s) => s.setCanUndo);
  const setCanRedo = useEditorStore((s) => s.setCanRedo);

  const updateHistoryButtons = useCallback(() => {
    setCanUndo(historyActions.canUndo());
    setCanRedo(historyActions.canRedo());
  }, [historyActions, setCanUndo, setCanRedo]);

  const pushHistory = useCallback(() => {
    const state = snapshotState();
    historyActions.pushState(state);
    updateHistoryButtons();
  }, [historyActions, updateHistoryButtons]);

  const handleUndo = useCallback(() => {
    const prev = historyActions.undo();
    if (prev) {
      applyStateToStore(prev);
    }
    updateHistoryButtons();
  }, [historyActions, updateHistoryButtons]);

  const handleRedo = useCallback(() => {
    const next = historyActions.redo();
    if (next) {
      applyStateToStore(next);
    }
    updateHistoryButtons();
  }, [historyActions, updateHistoryButtons]);

  return {
    pushHistory,
    handleUndo,
    handleRedo,
    updateHistoryButtons,
    historyActions,
  };
}
