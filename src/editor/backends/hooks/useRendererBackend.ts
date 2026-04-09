/**
 * 渲染后端实例管理 Hook
 * 根据 Feature Flag 创建 LeaferBackend 实例
 *
 * 关键设计：imageDisplaySize 不作为
 * backend 创建 effect 的依赖，
 * 避免 size 变化时销毁重建 backend
 * （用 setImageDisplaySize 热更新），
 * 从根源消除 Store↔Backend 循环触发
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

  // 用 ref 跟踪 imageDisplaySize，
  // 初始化时从中读取尺寸，
  // 但不作为 effect 依赖避免 backend 重建
  const imageDisplaySizeRef = useRef(
    imageDisplaySize
  );

  useEffect(() => {
    imageDisplaySizeRef.current =
      imageDisplaySize;
  });

  // sizeReady 仅在 imageDisplaySize
  // 非null时为 true，
  // 不随尺寸值变化而改变，
  // 避免 backend 重建
  const sizeReady = imageDisplaySize !== null;

  // 初始化 / 销毁 backend
  // 仅依赖 isLeafer、containerRef
  // 和 sizeReady，
  // 不依赖 imageDisplaySize 值变化
  useEffect(() => {
    if (!isLeafer || !sizeReady) return;

    const container = containerRef.current;
    if (!container) return;

    const currentSize =
      imageDisplaySizeRef.current;
    if (!currentSize) return;

    const instance = new LeaferBackend();
    instance.init({
      container,
      imageDisplaySize: currentSize,
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
  }, [isLeafer, containerRef, sizeReady]);

  // 更新图片尺寸（不重建 backend）
  // 用稳定 key 防止相同尺寸不同引用
  // 导致无效 effect 重触发
  const imageSizeKey = imageDisplaySize
    ? `${imageDisplaySize.width},${imageDisplaySize.height}`
    : null;

  useEffect(() => {
    if (!isLeafer || !backend || !imageDisplaySize)
      return;
    backend.setImageDisplaySize(imageDisplaySize);
  }, [isLeafer, backend, imageSizeKey]);

  return { backend, isLeafer };
}
