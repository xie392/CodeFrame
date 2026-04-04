/**
 * useCurrentRef Hook
 * 用于在事件处理器中访问最新状态值，替代 useEffect 同步 Ref 的反模式
 */

import { useRef } from 'react';

/**
 * 返回一个 ref，其 current 值始终为最新的传入值
 * 在渲染期间同步更新，避免额外的 useEffect 执行
 *
 * 注意：这是一个有意在渲染期间修改 ref 的模式，
 * 用于在事件处理器中访问最新的 props/state 值。
 * 参考：https://react.dev/reference/react/useRef#referencing-a-value-with-a-ref
 *
 * @example
 * ```tsx
 * const scaleRef = useCurrentRef(scale);
 * // 在事件处理器中使用 scaleRef.current 获取最新值
 * ```
 */
export function useCurrentRef<T>(value: T): { current: T } {
  const valueRef = useRef(value);
  // eslint-disable-next-line react-hooks/refs
  valueRef.current = value;
  return valueRef;
}
