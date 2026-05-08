// useKeyboardShortcuts Hook 测试

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  const mockCallbacks = {
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    onSelectAll: vi.fn(),
    onClearSelection: vi.fn(),
    onDelete: vi.fn(),
    onApplyCrop: vi.fn(),
    onCancelCrop: vi.fn(),
    onCancelMarquee: vi.fn(),
    pushHistory: vi.fn(),
  };

  const mockConfig = {
    activeTool: 'select',
    cropArea: null,
    selection: {
      arrowIds: [],
      rectIds: [],
      textIds: [],
      mosaicIds: [],
    },
    isMarqueeSelecting: { current: false },
    isCropMode: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // 辅助函数：触发键盘事件
  const dispatchKeyEvent = (key: string, options: Partial<KeyboardEvent> = {}) => {
    const event = new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      ...options,
    });
    window.dispatchEvent(event);
    return event;
  };

  it('应该在 Ctrl+Z 时调用 onUndo', () => {
    renderHook(() => useKeyboardShortcuts(mockConfig, mockCallbacks));

    dispatchKeyEvent('z', { ctrlKey: true });

    expect(mockCallbacks.onUndo).toHaveBeenCalledTimes(1);
  });

  it('应该在 Cmd+Z 时调用 onUndo (Mac)', () => {
    renderHook(() => useKeyboardShortcuts(mockConfig, mockCallbacks));

    dispatchKeyEvent('z', { metaKey: true });

    expect(mockCallbacks.onUndo).toHaveBeenCalledTimes(1);
  });

  it('应该在 Ctrl+Shift+Z 时调用 onRedo', () => {
    renderHook(() => useKeyboardShortcuts(mockConfig, mockCallbacks));

    dispatchKeyEvent('z', { ctrlKey: true, shiftKey: true });

    expect(mockCallbacks.onRedo).toHaveBeenCalledTimes(1);
  });

  it('应该在 Ctrl+Y 时调用 onRedo', () => {
    renderHook(() => useKeyboardShortcuts(mockConfig, mockCallbacks));

    dispatchKeyEvent('y', { ctrlKey: true });

    expect(mockCallbacks.onRedo).toHaveBeenCalledTimes(1);
  });

  it('应该在 Ctrl+A 时调用 onSelectAll', () => {
    renderHook(() => useKeyboardShortcuts(mockConfig, mockCallbacks));

    dispatchKeyEvent('a', { ctrlKey: true });

    expect(mockCallbacks.onSelectAll).toHaveBeenCalledTimes(1);
  });

  it('应该在 Escape 时调用 onClearSelection', () => {
    renderHook(() => useKeyboardShortcuts(mockConfig, mockCallbacks));

    dispatchKeyEvent('Escape');

    expect(mockCallbacks.onClearSelection).toHaveBeenCalledTimes(1);
  });

  it('应该在裁剪模式下 Escape 时调用 onCancelCrop', () => {
    const cropConfig = { ...mockConfig, isCropMode: true };
    renderHook(() => useKeyboardShortcuts(cropConfig, mockCallbacks));

    dispatchKeyEvent('Escape');

    expect(mockCallbacks.onCancelCrop).toHaveBeenCalledTimes(1);
    expect(mockCallbacks.onClearSelection).not.toHaveBeenCalled();
  });

  it('应该在框选时 Escape 调用 onCancelMarquee', () => {
    const marqueeConfig = {
      ...mockConfig,
      isMarqueeSelecting: { current: true },
    };
    renderHook(() => useKeyboardShortcuts(marqueeConfig, mockCallbacks));

    dispatchKeyEvent('Escape');

    expect(mockCallbacks.onCancelMarquee).toHaveBeenCalledTimes(1);
  });

  it('应该在裁剪模式下 Enter 且有裁剪区域时调用 onApplyCrop', () => {
    const cropConfig = {
      ...mockConfig,
      isCropMode: true,
      cropArea: { x: 0, y: 0, width: 100, height: 100 },
    };
    renderHook(() => useKeyboardShortcuts(cropConfig, mockCallbacks));

    dispatchKeyEvent('Enter');

    expect(mockCallbacks.onApplyCrop).toHaveBeenCalledTimes(1);
  });

  it('应该在裁剪模式下 Enter 但无裁剪区域时不调用 onApplyCrop', () => {
    const cropConfig = { ...mockConfig, isCropMode: true, cropArea: null };
    renderHook(() => useKeyboardShortcuts(cropConfig, mockCallbacks));

    dispatchKeyEvent('Enter');

    expect(mockCallbacks.onApplyCrop).not.toHaveBeenCalled();
  });

  it('应该在 Delete 时删除选中的图形', () => {
    const selectionConfig = {
      ...mockConfig,
      selection: {
        arrowIds: ['arrow-1'],
        rectIds: [],
        textIds: [],
        mosaicIds: [],
      },
    };
    renderHook(() => useKeyboardShortcuts(selectionConfig, mockCallbacks));

    dispatchKeyEvent('Delete');

    expect(mockCallbacks.pushHistory).toHaveBeenCalledTimes(1);
    expect(mockCallbacks.onDelete).toHaveBeenCalledTimes(1);
  });

  it('应该在 Backspace 时删除选中的图形', () => {
    const selectionConfig = {
      ...mockConfig,
      selection: {
        arrowIds: [],
        rectIds: ['rect-1'],
        textIds: [],
        mosaicIds: [],
      },
    };
    renderHook(() => useKeyboardShortcuts(selectionConfig, mockCallbacks));

    dispatchKeyEvent('Backspace');

    expect(mockCallbacks.pushHistory).toHaveBeenCalledTimes(1);
    expect(mockCallbacks.onDelete).toHaveBeenCalledTimes(1);
  });

  it('应该在没有选中图形时不删除', () => {
    renderHook(() => useKeyboardShortcuts(mockConfig, mockCallbacks));

    dispatchKeyEvent('Delete');

    expect(mockCallbacks.onDelete).not.toHaveBeenCalled();
  });

  it('应该忽略输入框中的快捷键', () => {
    renderHook(() => useKeyboardShortcuts(mockConfig, mockCallbacks));

    // 模拟输入框中的事件
    const input = document.createElement('input');
    const event = new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true,
      bubbles: true,
    });
    Object.defineProperty(event, 'target', { value: input, writable: false });

    window.dispatchEvent(event);

    expect(mockCallbacks.onUndo).not.toHaveBeenCalled();
  });

  it('应该忽略文本区域中的快捷键', () => {
    renderHook(() => useKeyboardShortcuts(mockConfig, mockCallbacks));

    // 模拟文本区域中的事件
    const textarea = document.createElement('textarea');
    const event = new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true,
      bubbles: true,
    });
    Object.defineProperty(event, 'target', { value: textarea, writable: false });

    window.dispatchEvent(event);

    expect(mockCallbacks.onUndo).not.toHaveBeenCalled();
  });

  it('应该阻止默认事件', () => {
    renderHook(() => useKeyboardShortcuts(mockConfig, mockCallbacks));

    const event = dispatchKeyEvent('z', { ctrlKey: true });

    expect(event.defaultPrevented).toBe(true);
  });
});
