/**
 * useEditorInit - 编辑器初始化 Hook
 *
 * 处理编辑器初始化逻辑，包括：
 * - 解析数据来源
 * - 截图数据加载
 * - 粘贴监听
 * - 历史记录初始化
 */

import { useEffect, useRef } from 'react';
import { STORAGE_KEYS } from '@shared/constants';
import { parseSource, readFileAsDataUrl } from '../utils/editor';
import { isValidCaptureResult, isValidImageData } from '../utils/validation';

/**
 * 初始化配置
 */
interface EditorInitConfig {
  source: string | null;
  imageData: string | null;
  initializedRef: React.MutableRefObject<boolean>;
}

/**
 * 初始化回调
 */
interface EditorInitCallbacks {
  setSource: (source: 'capture' | 'upload' | null) => void;
  setImageData: (data: string | null) => void;
  setError: (error: string | null) => void;
  resetHistory: (state: {
    arrows: unknown[];
    rects: unknown[];
    texts: unknown[];
    mosaics: unknown[];
    imageData: string;
    view: { scale: number; offset: { x: number; y: number } };
    selectedArrowIds: string[];
    selectedRectIds: string[];
    selectedTextIds: string[];
    selectedMosaicIds: string[];
  }) => void;
  updateHistoryButtons: () => void;
}

/**
 * 编辑器初始化 Hook
 */
export function useEditorInit(
  config: EditorInitConfig,
  callbacks: EditorInitCallbacks
): void {
  const { source, imageData, initializedRef } = config;

  // 初始化
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const src = parseSource();
    callbacks.setSource(src);

    if (src === 'capture') {
      chrome.storage.local.get(STORAGE_KEYS.CAPTURE_RESULT, (result) => {
        const data = result[STORAGE_KEYS.CAPTURE_RESULT];

        if (!isValidCaptureResult(data)) {
          callbacks.setError('无效的截图数据格式');
          return;
        }

        if (data.success && data.imageData) {
          if (isValidImageData(data.imageData)) {
            callbacks.setImageData(data.imageData);
          } else {
            callbacks.setError('无效的图片数据格式');
          }
        } else if (data.error) {
          callbacks.setError(data.error);
        } else {
          callbacks.setError('未找到截图数据');
        }
      });
    }
  }, [initializedRef, callbacks]);

  // 粘贴监听
  useEffect(() => {
    if (source !== 'upload') return;

    const handlePaste = (e: Event) => {
      const clipboardEvent = e as unknown as ClipboardEvent;
      const items = clipboardEvent.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (!file) return;
          readFileAsDataUrl(file).then((dataUrl) => {
            callbacks.setImageData(dataUrl);
          });
          return;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [source, callbacks]);

  // 图片加载后初始化历史
  const imageLoadedRef = useRef(false);
  useEffect(() => {
    if (imageData && !imageLoadedRef.current) {
      imageLoadedRef.current = true;
      callbacks.resetHistory({
        arrows: [],
        rects: [],
        texts: [],
        mosaics: [],
        imageData,
        view: { scale: 1, offset: { x: 0, y: 0 } },
        selectedArrowIds: [],
        selectedRectIds: [],
        selectedTextIds: [],
        selectedMosaicIds: [],
      });
      callbacks.updateHistoryButtons();
    }
  }, [imageData, callbacks]);
}

export default useEditorInit;
