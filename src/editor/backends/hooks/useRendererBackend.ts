/**
 * 渲染后端实例管理 Hook
 * 根据 Feature Flag 创建 LeaferBackend 实例
 */

import {
  useEffect,
  useRef,
  useMemo,
  useSyncExternalStore,
} from 'react';
import { LeaferBackend } from '../leafer/leafer-backend';
import type { IRendererBackend } from '../types';
import { isLeaferEnabled } from '../feature-flag';

interface UseRendererBackendOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  imageDisplaySize: { width: number; height: number } | null;
}

interface UseRendererBackendReturn {
  backend: IRendererBackend | null;
  isLeafer: boolean;
}

export function useRendererBackend({
  containerRef,
  imageDisplaySize,
}: UseRendererBackendOptions): UseRendererBackendReturn {
  const isLeafer = isLeaferEnabled();

  // 用 module 级变量存储 backend 实例
  // （每个组件实例独立，因为 Hook 每次调用
  //   都有自己的闭包）
  const store = useRef<{
    backend: IRendererBackend | null;
    listeners: Set<() => void>;
  }>({
    backend: null,
    listeners: new Set(),
  });

  const subscribe = useMemo(
    () => (cb: () => void) => {
      store.current.listeners.add(cb);
      return () => {
        store.current.listeners.delete(cb);
      };
    },
    []
  );

  const getSnapshot = useMemo(
    () => () => store.current.backend,
    []
  );

  // 通过 useSyncExternalStore 获取
  const backend =
    useSyncExternalStore(
      subscribe,
      getSnapshot
    );

  // 初始化 / 销毁
  useEffect(() => {
    if (!isLeafer) return;

    const container = containerRef.current;
    if (!container || !imageDisplaySize) return;

    const instance = new LeaferBackend();
    instance.init({
      container,
      imageDisplaySize,
    });
    store.current.backend = instance;

    // 通知 subscriber
    store.current.listeners.forEach(
      (l) => l()
    );

    // 捕获当前 store 引用用于 cleanup
    const currentStore = store.current;

    return () => {
      currentStore.backend?.destroy();
      currentStore.backend = null;
      currentStore.listeners.forEach(
        (l) => l()
      );
    };
  }, [isLeafer, containerRef, imageDisplaySize]);

  // 更新图片尺寸
  useEffect(() => {
    if (!isLeafer || !backend || !imageDisplaySize)
      return;
    backend.setImageDisplaySize(imageDisplaySize);
  }, [isLeafer, backend, imageDisplaySize]);

  return { backend, isLeafer };
}
