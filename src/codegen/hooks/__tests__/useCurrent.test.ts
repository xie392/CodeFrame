// useCurrent Hook 测试

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCurrent } from '../useCurrent';

describe('useCurrent', () => {
  it('应该返回包含当前值的 ref', () => {
    const { result } = renderHook(() => useCurrent('test-value'));

    expect(result.current).toBeDefined();
    expect(result.current.current).toBe('test-value');
  });

  it('应该返回包含数字值的 ref', () => {
    const { result } = renderHook(() => useCurrent(42));

    expect(result.current.current).toBe(42);
  });

  it('应该返回包含对象值的 ref', () => {
    const obj = { x: 100, y: 200 };
    const { result } = renderHook(() => useCurrent(obj));

    expect(result.current.current).toBe(obj);
    expect(result.current.current.x).toBe(100);
    expect(result.current.current.y).toBe(200);
  });

  it('应该在值变化时更新 ref.current', () => {
    const { result, rerender } = renderHook(({ value }) => useCurrent(value), {
      initialProps: { value: 'initial' },
    });

    expect(result.current.current).toBe('initial');

    rerender({ value: 'updated' });

    expect(result.current.current).toBe('updated');
  });

  it('应该返回稳定的 ref 对象', () => {
    const { result, rerender } = renderHook(({ value }) => useCurrent(value), {
      initialProps: { value: 'initial' },
    });

    const refBefore = result.current;
    rerender({ value: 'updated' });
    const refAfter = result.current;

    expect(refBefore).toBe(refAfter);
  });

  it('应该处理 null 值', () => {
    const { result } = renderHook(() => useCurrent(null));

    expect(result.current.current).toBeNull();
  });

  it('应该处理 undefined 值', () => {
    const { result } = renderHook(() => useCurrent(undefined));

    expect(result.current.current).toBeUndefined();
  });
});
