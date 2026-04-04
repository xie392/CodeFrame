// Editor Hooks 测试

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSyncedRef } from '../useSyncedRef';

describe('useSyncedRef', () => {
  it('应该返回一个 ref 对象', () => {
    const { result } = renderHook(() => useSyncedRef('test'));
    expect(result.current).toBeDefined();
    expect(result.current.current).toBe('test');
  });

  it('应该同步更新 ref 值', () => {
    const { result, rerender } = renderHook(({ value }) => useSyncedRef(value), {
      initialProps: { value: 'initial' },
    });

    expect(result.current.current).toBe('initial');

    rerender({ value: 'updated' });
    expect(result.current.current).toBe('updated');
  });

  it('应该保持相同的 ref 对象引用', () => {
    const { result, rerender } = renderHook(({ value }) => useSyncedRef(value), {
      initialProps: { value: 'initial' },
    });

    const firstRef = result.current;
    rerender({ value: 'updated' });

    expect(result.current).toBe(firstRef);
  });

  it('应该支持对象值', () => {
    const obj = { name: 'test', count: 1 };
    const { result } = renderHook(() => useSyncedRef(obj));
    expect(result.current.current).toBe(obj);
  });

  it('应该支持数组值', () => {
    const arr = [1, 2, 3];
    const { result } = renderHook(() => useSyncedRef(arr));
    expect(result.current.current).toBe(arr);
  });

  it('应该支持 null 和 undefined', () => {
    const { result, rerender } = renderHook(({ value }) => useSyncedRef(value), {
      initialProps: { value: null as string | null | undefined },
    });

    expect(result.current.current).toBe(null);

    rerender({ value: undefined });
    expect(result.current.current).toBe(undefined);
  });
});
