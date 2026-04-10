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
import type { ImageFrameSettings } from '../../types';

interface UseRendererBackendOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  imageDisplaySize: { width: number; height: number } | null;
  frameSettings: ImageFrameSettings;
  imageUrl: string;
}

interface UseRendererBackendReturn {
  backend: IRendererBackend | null;
  isLeafer: boolean;
}

export function useRendererBackend({
  containerRef,
  imageDisplaySize,
  frameSettings,
  imageUrl,
}: UseRendererBackendOptions): UseRendererBackendReturn {
  const isLeafer = isLeaferEnabled();

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

  const frameSettingsRef = useRef(frameSettings);
  useEffect(() => {
    frameSettingsRef.current = frameSettings;
  });

  const imageUrlRef = useRef(imageUrl);
  useEffect(() => {
    imageUrlRef.current = imageUrl;
  });

  // sizeReady 仅在 imageDisplaySize
  // 非null时为 true
  const sizeReady = imageDisplaySize !== null;

  // 初始化 / 销毁 backend
  useEffect(() => {
    if (!isLeafer || !sizeReady) return;

    const container = containerRef.current;
    if (!container) return;

    const currentSize =
      imageDisplaySizeRef.current;
    if (!currentSize) return;

    const currentFrameSettings =
      frameSettingsRef.current;
    const currentImageUrl =
      imageUrlRef.current;

    const instance = new LeaferBackend();
    instance.init({
      container,
      imageDisplaySize: currentSize,
      frameSettings: currentFrameSettings,
      imageUrl: currentImageUrl,
    });
    store.current.backend = instance;

    // 通知 subscriber
    store.current.listeners.forEach(
      (l) => l()
    );

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
  const imageSizeKey = imageDisplaySize
    ? `${imageDisplaySize.width},${imageDisplaySize.height}`
    : null;

  useEffect(() => {
    if (!isLeafer || !backend || !imageDisplaySize)
      return;
    backend.setImageDisplaySize(imageDisplaySize);
  }, [isLeafer, backend, imageSizeKey]);

  // 更新帧设置
  const frameSettingsKey = JSON.stringify(frameSettings);

  useEffect(() => {
    if (!isLeafer || !backend) return;
    const b = backend as {
      setFrameSettings?: (
        s: ImageFrameSettings
      ) => void;
    };
    b.setFrameSettings?.(frameSettings);
  }, [isLeafer, backend, frameSettingsKey]);

  // 更新图片 URL
  useEffect(() => {
    if (!isLeafer || !backend || !imageUrl) return;
    const b = backend as {
      setImageUrl?: (url: string) => void;
    };
    b.setImageUrl?.(imageUrl);
  }, [isLeafer, backend, imageUrl]);

  return { backend, isLeafer };
}
