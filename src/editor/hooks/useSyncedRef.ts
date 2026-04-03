/**
 * useSyncedRef - 同步 React State 和 Ref 的 Hook
 *
 * 用于在事件处理函数中获取最新状态值，避免闭包问题。
 * 自动同步，无需手动更新 ref.current。
 */

import { useRef } from 'react';

/**
 * 创建一个自动同步的 Ref
 * @param value 需要同步的值
 * @returns 始终指向最新值的 Ref
 *
 * @example
 * ```ts
 * const arrowsRef = useSyncedRef(arrows);
 * // 在事件处理中使用 arrowsRef.current 获取最新值
 * ```
 */
export function useSyncedRef<T>(value: T): React.MutableRefObject<T> {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

export default useSyncedRef;
