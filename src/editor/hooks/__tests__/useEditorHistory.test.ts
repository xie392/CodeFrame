// useEditorHistory Hook 测试

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useEditorHistory,
  createEmptyEditorState,
} from '../useEditorHistory';

describe('useEditorHistory', () => {
  describe('createEmptyEditorState', () => {
    it('应该返回空状态', () => {
      const state = createEmptyEditorState();

      expect(state.arrows).toEqual([]);
      expect(state.rects).toEqual([]);
      expect(state.texts).toEqual([]);
      expect(state.mosaics).toEqual([]);
      expect(state.imageData).toBeNull();
      expect(state.view).toEqual({ scale: 1, offset: { x: 0, y: 0 } });
      expect(state.selectedArrowIds).toEqual([]);
      expect(state.selectedRectIds).toEqual([]);
      expect(state.selectedTextIds).toEqual([]);
      expect(state.selectedMosaicIds).toEqual([]);
    });
  });

  describe('历史记录操作', () => {
    const { result } = renderHook(() => useEditorHistory());

    it('初始状态应该不可撤销和重做', () => {
      expect(result.current.canUndo()).toBe(false);
      expect(result.current.canRedo()).toBe(false);
    });

    it('pushState 应该添加状态到历史', () => {
      const state1 = createEmptyEditorState();
      state1.imageData = 'data:image/png;base64,test1';

      act(() => {
        result.current.pushState(state1);
      });

      expect(result.current.canUndo()).toBe(true);
      expect(result.current.canRedo()).toBe(false);
    });

    it('undo 应该返回上一个状态', () => {
      const initialState = createEmptyEditorState();
      const state1 = { ...initialState, imageData: 'data:image/png;base64,test1' };
      const state2 = { ...initialState, imageData: 'data:image/png;base64,test2' };

      act(() => {
        result.current.pushState(state1);
        result.current.pushState(state2);
      });

      let previousState: typeof initialState | null = null;
      act(() => {
        previousState = result.current.undo();
      });

      expect(previousState).not.toBeNull();
      expect(previousState?.imageData).toBe('data:image/png;base64,test1');
      expect(result.current.canRedo()).toBe(true);
    });

    it('redo 应该返回下一个状态', () => {
      const initialState = createEmptyEditorState();
      const state1 = { ...initialState, imageData: 'data:image/png;base64,test1' };
      const state2 = { ...initialState, imageData: 'data:image/png;base64,test2' };

      act(() => {
        result.current.pushState(state1);
        result.current.pushState(state2);
        result.current.undo();
      });

      let nextState: typeof initialState | null = null;
      act(() => {
        nextState = result.current.redo();
      });

      expect(nextState).not.toBeNull();
      expect(nextState?.imageData).toBe('data:image/png;base64,test2');
      expect(result.current.canRedo()).toBe(false);
    });

    it('在没有历史时 undo 应该返回 null', () => {
      const { result } = renderHook(() => useEditorHistory());

      let state: ReturnType<typeof createEmptyEditorState> | null = null;
      act(() => {
        state = result.current.undo();
      });

      expect(state).toBeNull();
    });

    it('在没有 future 时 redo 应该返回 null', () => {
      const { result } = renderHook(() => useEditorHistory());

      let state: ReturnType<typeof createEmptyEditorState> | null = null;
      act(() => {
        state = result.current.redo();
      });

      expect(state).toBeNull();
    });

    it('clearHistory 应该清空历史', () => {
      const { result } = renderHook(() => useEditorHistory());
      const state1 = { ...createEmptyEditorState(), imageData: 'test1' };

      act(() => {
        result.current.pushState(state1);
      });

      expect(result.current.canUndo()).toBe(true);

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.canUndo()).toBe(false);
      expect(result.current.canRedo()).toBe(false);
    });

    it('resetToState 应该重置到新状态', () => {
      const { result } = renderHook(() => useEditorHistory());
      const state1 = { ...createEmptyEditorState(), imageData: 'test1' };
      const state2 = { ...createEmptyEditorState(), imageData: 'test2' };

      act(() => {
        result.current.pushState(state1);
        result.current.resetToState(state2);
      });

      expect(result.current.canUndo()).toBe(false);
      expect(result.current.canRedo()).toBe(false);
    });

    it('新操作应该清空 future 栈', () => {
      const { result } = renderHook(() => useEditorHistory());
      const initialState = createEmptyEditorState();
      const state1 = { ...initialState, imageData: 'test1' };
      const state2 = { ...initialState, imageData: 'test2' };
      const state3 = { ...initialState, imageData: 'test3' };

      act(() => {
        result.current.pushState(state1);
        result.current.pushState(state2);
        result.current.undo();
      });

      expect(result.current.canRedo()).toBe(true);

      act(() => {
        result.current.pushState(state3);
      });

      expect(result.current.canRedo()).toBe(false);
    });

    it('应该限制历史记录长度', () => {
      const { result } = renderHook(() => useEditorHistory());
      const initialState = createEmptyEditorState();

      // 推送超过最大长度的状态
      for (let i = 0; i < 55; i++) {
        act(() => {
          result.current.pushState({ ...initialState, imageData: `test${i}` });
        });
      }

      // 应该只能撤销 50 次
      let undoCount = 0;
      while (result.current.canUndo()) {
        act(() => {
          result.current.undo();
        });
        undoCount++;
      }

      expect(undoCount).toBe(50);
    });
  });
});
