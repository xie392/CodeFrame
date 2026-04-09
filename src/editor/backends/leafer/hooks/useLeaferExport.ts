/**
 * Leafer 导出 Hook
 * 使用 @leafer-in/export 导出标注层，
 * 与帧容器（snapdom）合成最终图片
 */

import {
  useState,
  useCallback,
  useMemo,
} from 'react';
import { snapdom } from '@zumer/snapdom';
import { EXPORT_FORMATS } from '@shared/constants';
import { useSettingsStore } from '@shared/stores/settings-store';
import type { ExportFormat } from '@shared/types';
import type { IRendererBackend } from '../../types';
import type { ImageFrameSettings } from '../../../types';
import { calculateAspectRatioSize } from '../../../utils/editor';

interface UseLeaferExportOptions {
  backend: IRendererBackend | null;
  exportContainerRef: React.RefObject<
    HTMLDivElement | null
  >;
  imageDisplaySize: {
    width: number;
    height: number;
  } | null;
  frameSettings: ImageFrameSettings;
}

interface UseExportReturn {
  isExporting: boolean;
  copied: boolean;
  exportError: string | null;
  setIsExporting: (v: boolean) => void;
  setCopied: (v: boolean) => void;
  handleExportImage: () => Promise<void>;
  handleCopyToClipboard: () => Promise<void>;
}

export function useLeaferExport({
  backend,
  exportContainerRef,
  imageDisplaySize,
  frameSettings,
}: UseLeaferExportOptions): UseExportReturn {
  const [isExporting, setIsExporting] =
    useState(false);
  const [copied, setCopied] = useState(false);
  const [exportError, setExportError] =
    useState<string | null>(null);

  const { settings } = useSettingsStore();

  /** 从 Leafer 导出标注层，
   * 叠加到帧容器上 */
  const prepareExport = useCallback(() => {
    const container =
      exportContainerRef.current;
    if (!container || !backend) return null;

    // 获取 Leafer App 结果
    const b = backend as {
      getAppResult?: () => {
        annotationBox: {
          export: (
            format: string,
            options?: Record<string, unknown>,
          ) => Promise<{ data: string }>;
        };
      } | null;
    };
    const appResult = b.getAppResult?.();
    if (!appResult) return null;

    // 导出标注层将异步完成
    // 但 prepareExport 是同步的，
    // 所以我们返回一个 Promise
    const displaySize = imageDisplaySize;
    if (!displaySize) return null;

    // 计算容器尺寸
    const padLeft = frameSettings.padding
      .linked
      ? frameSettings.padding.top
      : frameSettings.padding.left;
    const padTop = frameSettings.padding
      .linked
      ? frameSettings.padding.top
      : frameSettings.padding.top;
    const padRight = frameSettings.padding
      .linked
      ? frameSettings.padding.top
      : frameSettings.padding.right;
    const padBottom = frameSettings.padding
      .linked
      ? frameSettings.padding.top
      : frameSettings.padding.bottom;

    const containerSize =
      calculateAspectRatioSize(
        frameSettings.aspectRatio,
        displaySize.width,
        displaySize.height,
        frameSettings.customAspectRatio,
      );

    const isAuto =
      frameSettings.aspectRatio === 'auto';
    const padW = padLeft + padRight;
    const padH = padTop + padBottom;
    const canvasWidth = isAuto
      ? containerSize.width + padW
      : containerSize.width;
    const canvasHeight = isAuto
      ? containerSize.height + padH
      : containerSize.height;

    // 异步导出标注层并叠加
    const exportPromise = (async () => {
      try {
        const result =
          await appResult.annotationBox.export(
            'png',
            { pixelRatio: 1 },
          );
        const annotationDataUrl =
          result.data as string;
        if (!annotationDataUrl) return null;

        const annotationImg =
          document.createElement('img');
        annotationImg.src = annotationDataUrl;
        annotationImg.style.position =
          'absolute';
        annotationImg.style.top = '0';
        annotationImg.style.left = '0';
        annotationImg.style.width = `${canvasWidth}px`;
        annotationImg.style.height = `${canvasHeight}px`;
        annotationImg.style.pointerEvents =
          'none';
        annotationImg.style.zIndex = '10';
        container.appendChild(annotationImg);

        return {
          container,
          annotationImg,
        };
      } catch (e) {
        console.error(
          'Leafer export failed:',
          e,
        );
        return null;
      }
    })();

    return { exportPromise, container };
  }, [
    backend,
    exportContainerRef,
    imageDisplaySize,
    frameSettings,
  ]);

  /** 清理导出临时元素 */
  const cleanupExport = useCallback(
    (
      annotationImg: HTMLImageElement | null,
    ) => {
      if (
        annotationImg &&
        annotationImg.parentNode
      ) {
        annotationImg.parentNode.removeChild(
          annotationImg,
        );
      }
    },
    [],
  );

  /** 等待 DOM 渲染完成 */
  const waitForRender = useCallback(() => {
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
  }, []);

  /** 导出图片 */
  const handleExportImage =
    useCallback(async () => {
      const prepared = prepareExport();
      if (!prepared) return;

      setIsExporting(true);
      setExportError(null);

      try {
        const result =
          await prepared.exportPromise;
        if (!result) return;

        await waitForRender();

        const format =
          settings.defaultFormat as ExportFormat;
        const scale =
          settings.quality === '1x'
            ? 1
            : settings.quality === '3x'
              ? 3
              : 2;
        const timestamp = Date.now();

        switch (format) {
          case EXPORT_FORMATS.JPG: {
            const blob =
              await snapdom.toBlob(
                result.container,
                {
                  scale,
                  type: 'jpeg',
                  backgroundColor:
                    '#ffffff',
                  quality: 0.92,
                },
              );
            const url =
              URL.createObjectURL(blob);
            const a =
              document.createElement('a');
            a.href = url;
            a.download = `codeframe-${timestamp}.jpg`;
            a.click();
            URL.revokeObjectURL(url);
            cleanupExport(
              result.annotationImg,
            );
            return;
          }
          case EXPORT_FORMATS.WEBP: {
            const img =
              await snapdom.toWebp(
                result.container,
                { scale },
              );
            const a =
              document.createElement('a');
            a.href = img.src;
            a.download = `codeframe-${timestamp}.webp`;
            a.click();
            cleanupExport(
              result.annotationImg,
            );
            return;
          }
          case EXPORT_FORMATS.PNG:
          default: {
            const img =
              await snapdom.toPng(
                result.container,
                { scale },
              );
            const a =
              document.createElement('a');
            a.href = img.src;
            a.download = `codeframe-${timestamp}.png`;
            a.click();
            cleanupExport(
              result.annotationImg,
            );
            return;
          }
        }
      } catch (err) {
        console.error('导出失败:', err);
        setExportError('导出失败，请重试');
        setTimeout(
          () => setExportError(null),
          3000,
        );
      } finally {
        setIsExporting(false);
      }
    }, [
      prepareExport,
      waitForRender,
      cleanupExport,
      settings.defaultFormat,
      settings.quality,
    ]);

  /** 复制到剪贴板 */
  const handleCopyToClipboard =
    useCallback(async () => {
      if (!navigator.clipboard?.write) {
        setExportError(
          '当前浏览器不支持复制图片到剪贴板',
        );
        setTimeout(
          () => setExportError(null),
          3000,
        );
        return;
      }

      const prepared = prepareExport();
      if (!prepared) return;

      setIsExporting(true);
      setExportError(null);

      try {
        const result =
          await prepared.exportPromise;
        if (!result) return;

        await waitForRender();

        const blob = await snapdom.toBlob(
          result.container,
          {
            scale: 2,
            type: 'png',
          },
        );

        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob,
          }),
        ]);

        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        cleanupExport(result.annotationImg);
      } catch (err) {
        console.error('复制失败:', err);
        setExportError('复制失败，请重试');
        setTimeout(
          () => setExportError(null),
          3000,
        );
      } finally {
        setIsExporting(false);
      }
    }, [
      prepareExport,
      waitForRender,
      cleanupExport,
    ]);

  return useMemo(
    () => ({
      isExporting,
      copied,
      exportError,
      setIsExporting,
      setCopied,
      handleExportImage,
      handleCopyToClipboard,
    }),
    [
      isExporting,
      copied,
      exportError,
      setIsExporting,
      setCopied,
      handleExportImage,
      handleCopyToClipboard,
    ],
  );
}
