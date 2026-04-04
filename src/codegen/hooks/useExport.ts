/**
 * useExport Hook
 * 管理导出和复制到剪贴板功能
 */

import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { snapdom } from '@zumer/snapdom';
import { useSettingsStore } from '@shared/stores/settings-store';
import { EXPORT_FORMATS } from '@shared/constants';
import type { ExportFormat } from '@shared/types';
import { COPIED_FEEDBACK_DURATION_MS } from '../constants';

interface UseExportOptions {
  exportRef: React.RefObject<HTMLDivElement | null>;
  isEditingRef: React.MutableRefObject<boolean>;
  exitEditRef: React.MutableRefObject<() => void>;
}

export function useExport({ exportRef, isEditingRef, exitEditRef }: UseExportOptions) {
  const { t } = useTranslation('codegen');
  const { settings } = useSettingsStore();

  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  // 用于取消异步操作
  const cancelledRef = useRef(false);

  /**
   * 导出图片
   */
  const handleExportImage = useCallback(async () => {
    const el = exportRef.current;
    if (!el) return;

    cancelledRef.current = false;
    setIsExporting(true);

    try {
      // 退出编辑模式以隐藏光标
      if (isEditingRef.current) {
        exitEditRef.current();
      }

      // 等待 DOM 更新
      await delay(50);
      if (cancelledRef.current) return;

      const format = settings.defaultFormat as ExportFormat;
      const scale = settings.quality === '1x' ? 1 : settings.quality === '3x' ? 3 : 2;
      const timestamp = Date.now();

      let extension: string;

      switch (format) {
        case EXPORT_FORMATS.JPG: {
          const blob = await snapdom.toBlob(el, {
            scale,
            type: 'jpeg',
            backgroundColor: '#ffffff',
            quality: 0.92,
            exclude: ['[data-no-export]'],
          });
          if (cancelledRef.current) return;

          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `codeframe-${timestamp}.jpg`;
          a.click();
          URL.revokeObjectURL(url);
          return;
        }
        case EXPORT_FORMATS.WEBP: {
          const img = await snapdom.toWebp(el, {
            scale,
            exclude: ['[data-no-export]'],
          });
          if (cancelledRef.current) return;
          extension = 'webp';
          downloadImage(img.src, `codeframe-${timestamp}.${extension}`);
          break;
        }
        case EXPORT_FORMATS.PNG:
        default: {
          const img = await snapdom.toPng(el, {
            scale,
            exclude: ['[data-no-export]'],
          });
          if (cancelledRef.current) return;
          extension = 'png';
          downloadImage(img.src, `codeframe-${timestamp}.${extension}`);
          break;
        }
      }
    } catch (err) {
      if (!cancelledRef.current) {
        // 生产环境应使用错误追踪服务
        if (process.env.NODE_ENV === 'development') {
          console.error('导出失败:', err);
        }
      }
    } finally {
      if (!cancelledRef.current) {
        setIsExporting(false);
      }
    }
  }, [settings.defaultFormat, settings.quality, exportRef, isEditingRef, exitEditRef]);

  /**
   * 复制到剪贴板
   */
  const handleCopyToClipboard = useCallback(async () => {
    const el = exportRef.current;
    if (!el) return;

    if (!navigator.clipboard?.write) {
      alert(t('error.clipboardNotSupported'));
      return;
    }

    cancelledRef.current = false;

    try {
      if (isEditingRef.current) {
        exitEditRef.current();
      }

      await delay(50);
      if (cancelledRef.current) return;

      const scale = settings.quality === '1x' ? 1 : settings.quality === '3x' ? 3 : 2;

      const blob = await snapdom.toBlob(el, {
        scale,
        type: 'png',
        exclude: ['[data-no-export]'],
      });
      if (cancelledRef.current) return;

      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);

      setTimeout(() => {
        if (!cancelledRef.current) {
          setCopied(false);
        }
      }, COPIED_FEEDBACK_DURATION_MS);
    } catch (err) {
      if (!cancelledRef.current) {
        if (process.env.NODE_ENV === 'development') {
          console.error('复制失败:', err);
        }
      }
    }
  }, [settings.quality, t, exportRef, isEditingRef, exitEditRef]);

  /**
   * 取消操作（组件卸载时调用）
   */
  const cancel = useCallback(() => {
    cancelledRef.current = true;
    setIsExporting(false);
    setCopied(false);
  }, []);

  return {
    isExporting,
    copied,
    handleExportImage,
    handleCopyToClipboard,
    cancel,
  };
}

/**
 * 延迟工具函数
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 下载图片工具函数
 */
function downloadImage(src: string, filename: string): void {
  const a = document.createElement('a');
  a.href = src;
  a.download = filename;
  a.click();
}
