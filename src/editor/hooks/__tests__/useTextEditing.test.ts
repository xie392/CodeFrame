// useTextEditing Hook 测试

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTextEditing } from '../useTextEditing';
import type { TextShape } from '../../types';

describe('useTextEditing', () => {
  const mockText: TextShape = {
    id: 'text-1',
    x: 100,
    y: 100,
    text: 'Hello World',
    color: '#EF4444',
    fontSize: 24,
    fontWeight: 'normal',
    fontStyle: 'normal',
  };

  const mockState = {
    editingTextId: null,
    editingTextValue: '',
  };

  const mockCallbacks = {
    setEditingTextId: vi.fn(),
    setEditingTextValue: vi.fn(),
    setTexts: vi.fn((updater) => {
      // 模拟更新
      const prev = [mockText];
      return updater(prev);
    }),
    setSelectedTextIds: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('应该返回 textInputRef 和编辑函数', () => {
    const { result } = renderHook(() =>
      useTextEditing(mockState, mockCallbacks)
    );

    expect(result.current.textInputRef).toBeDefined();
    expect(typeof result.current.startEditing).toBe('function');
    expect(typeof result.current.stopEditing).toBe('function');
    expect(typeof result.current.handleTextChange).toBe('function');
    expect(typeof result.current.handleKeyDown).toBe('function');
    expect(typeof result.current.handleBlur).toBe('function');
  });

  it('startEditing 应该设置编辑状态', () => {
    const { result } = renderHook(() =>
      useTextEditing(mockState, mockCallbacks)
    );

    act(() => {
      result.current.startEditing(mockText);
    });

    expect(mockCallbacks.setEditingTextId).toHaveBeenCalledWith('text-1');
    expect(mockCallbacks.setEditingTextValue).toHaveBeenCalledWith('Hello World');
    expect(mockCallbacks.setSelectedTextIds).toHaveBeenCalledWith(['text-1']);
  });

  it('startEditing 应该延迟聚焦输入框', () => {
    const { result } = renderHook(() =>
      useTextEditing(mockState, mockCallbacks)
    );

    // Mock focus 和 select 方法
    const mockFocus = vi.fn();
    const mockSelect = vi.fn();
    // 使用 Object.defineProperty 来 mock ref.current
    Object.defineProperty(result.current.textInputRef, 'current', {
      value: {
        focus: mockFocus,
        select: mockSelect,
      } as unknown as HTMLInputElement,
      writable: true,
    });

    act(() => {
      result.current.startEditing(mockText);
    });

    // 快进定时器
    act(() => {
      vi.runAllTimers();
    });

    expect(mockFocus).toHaveBeenCalled();
    expect(mockSelect).toHaveBeenCalled();
  });

  it('stopEditing 应该在 save=true 时保存文本', () => {
    const state = {
      editingTextId: 'text-1',
      editingTextValue: 'Updated Text',
    };

    const { result } = renderHook(() =>
      useTextEditing(state, mockCallbacks)
    );

    act(() => {
      result.current.stopEditing(true);
    });

    expect(mockCallbacks.setTexts).toHaveBeenCalled();
    expect(mockCallbacks.setEditingTextId).toHaveBeenCalledWith(null);
    expect(mockCallbacks.setEditingTextValue).toHaveBeenCalledWith('');
  });

  it('stopEditing 应该在 save=false 时不保存文本', () => {
    const state = {
      editingTextId: 'text-1',
      editingTextValue: 'Updated Text',
    };

    const { result } = renderHook(() =>
      useTextEditing(state, mockCallbacks)
    );

    act(() => {
      result.current.stopEditing(false);
    });

    expect(mockCallbacks.setTexts).not.toHaveBeenCalled();
    expect(mockCallbacks.setEditingTextId).toHaveBeenCalledWith(null);
    expect(mockCallbacks.setEditingTextValue).toHaveBeenCalledWith('');
  });

  it('stopEditing 应该在空文本时不保存', () => {
    const state = {
      editingTextId: 'text-1',
      editingTextValue: '   ', // 空白文本
    };

    const { result } = renderHook(() =>
      useTextEditing(state, mockCallbacks)
    );

    act(() => {
      result.current.stopEditing(true);
    });

    expect(mockCallbacks.setTexts).not.toHaveBeenCalled();
  });

  it('stopEditing 应该在没有 editingTextId 时不保存', () => {
    const state = {
      editingTextId: null,
      editingTextValue: 'Some Text',
    };

    const { result } = renderHook(() =>
      useTextEditing(state, mockCallbacks)
    );

    act(() => {
      result.current.stopEditing(true);
    });

    expect(mockCallbacks.setTexts).not.toHaveBeenCalled();
  });

  it('handleTextChange 应该更新文本值', () => {
    const { result } = renderHook(() =>
      useTextEditing(mockState, mockCallbacks)
    );

    act(() => {
      result.current.handleTextChange('New Text');
    });

    expect(mockCallbacks.setEditingTextValue).toHaveBeenCalledWith('New Text');
  });

  it('handleKeyDown Enter 应该保存并停止编辑', () => {
    const state = {
      editingTextId: 'text-1',
      editingTextValue: 'Updated',
    };

    const { result } = renderHook(() =>
      useTextEditing(state, mockCallbacks)
    );

    const mockEvent = {
      key: 'Enter',
      preventDefault: vi.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockCallbacks.setEditingTextId).toHaveBeenCalledWith(null);
  });

  it('handleKeyDown Escape 应该取消编辑', () => {
    const state = {
      editingTextId: 'text-1',
      editingTextValue: 'Updated',
    };

    const { result } = renderHook(() =>
      useTextEditing(state, mockCallbacks)
    );

    const mockEvent = {
      key: 'Escape',
      preventDefault: vi.fn(),
    } as unknown as React.KeyboardEvent;

    act(() => {
      result.current.handleKeyDown(mockEvent);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockCallbacks.setTexts).not.toHaveBeenCalled();
    expect(mockCallbacks.setEditingTextId).toHaveBeenCalledWith(null);
  });

  it('handleBlur 应该保存并停止编辑', () => {
    const state = {
      editingTextId: 'text-1',
      editingTextValue: 'Updated',
    };

    const { result } = renderHook(() =>
      useTextEditing(state, mockCallbacks)
    );

    act(() => {
      result.current.handleBlur();
    });

    expect(mockCallbacks.setEditingTextId).toHaveBeenCalledWith(null);
  });
});

// afterEach 定义
afterEach(() => {
  vi.useRealTimers();
});
