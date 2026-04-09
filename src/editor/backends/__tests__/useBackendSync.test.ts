// useBackendSync 单元测试

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from 'vitest';
import { act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { useBackendSync } from '../hooks/useBackendSync';
import { useEditorStore } from '../../store/editor-store';
import type {
  IRendererBackend,
  BackendCallbacks,
} from '../types';

// 创建 mock backend
function createMockBackend(): {
  backend: IRendererBackend;
} {
  const backend: IRendererBackend = {
    init: vi.fn(),
    destroy: vi.fn(),
    resize: vi.fn(),
    setImageDisplaySize: vi.fn(),
    setViewport: vi.fn(),
    getViewport: vi.fn(() => ({
      scale: 1,
      offset: { x: 0, y: 0 },
    })),
    addShape: vi.fn(),
    updateShape: vi.fn(),
    removeShape: vi.fn(),
    setSelection: vi.fn(),
    clearSelection: vi.fn(),
    setCropArea: vi.fn(),
    setCallbacks: vi.fn(),
    getCoordTransformer: vi.fn(),
  };

  return { backend };
}

describe('useBackendSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('backend 为 null 时不应调用任何方法', () => {
    const { result } = renderHook(() =>
      useBackendSync(null)
    );
    expect(result.current).toBeUndefined();
  });

  it('应注册 Backend 回调', () => {
    const { backend } = createMockBackend();
    renderHook(() => useBackendSync(backend));
    expect(backend.setCallbacks).toHaveBeenCalled();
  });

  it('unmount 时应清空回调', () => {
    const { backend } = createMockBackend();
    const { unmount } = renderHook(() =>
      useBackendSync(backend)
    );

    expect(backend.setCallbacks).toHaveBeenCalledTimes(1);
    unmount();
    expect(backend.setCallbacks).toHaveBeenCalledTimes(2);
  });

  it('Backend 选中回调应更新 Store', () => {
    const { backend } = createMockBackend();

    // 拦截 setCallbacks 以获取实际回调
    let capturedCallbacks: BackendCallbacks =
      {} as BackendCallbacks;
    vi.mocked(backend.setCallbacks).mockImplementation(
      (cb) => {
        capturedCallbacks = cb;
      }
    );

    renderHook(() => useBackendSync(backend));

    // 模拟 Leafer 选中事件
    act(() => {
      capturedCallbacks.onSelectionChange({
        arrow: ['a1'],
        rect: ['r1', 'r2'],
        text: [],
        mosaic: [],
      });
    });

    // 验证 Store 已更新
    const state = useEditorStore.getState();
    expect(state.selectedArrowIds).toEqual([
      'a1',
    ]);
    expect(state.selectedRectIds).toEqual([
      'r1',
      'r2',
    ]);
    expect(state.selectedTextIds).toEqual([]);
    expect(state.selectedMosaicIds).toEqual([]);
  });

  it('Backend 视口回调应更新 Store', () => {
    const { backend } = createMockBackend();
    let capturedCallbacks: BackendCallbacks =
      {} as BackendCallbacks;
    vi.mocked(backend.setCallbacks).mockImplementation(
      (cb) => {
        capturedCallbacks = cb;
      }
    );

    renderHook(() => useBackendSync(backend));

    act(() => {
      capturedCallbacks.onViewportChange({
        scale: 2,
        offset: { x: 10, y: 20 },
      });
    });

    const state = useEditorStore.getState();
    expect(state.scale).toBe(2);
    expect(state.offset).toEqual({
      x: 10,
      y: 20,
    });
  });
});
