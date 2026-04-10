/**
 * Leafer 导出 Hook
 * 纯 Leafer 渲染：直接从 frameGroup 导出，
 * 不再需要 snapdom 双层合成
 */

import {
  useState,
  useCallback,
  useMemo,
} from 'react';
import { EXPORT_FORMATS } from '@shared/constants';
import { useSettingsStore } from '@shared/stores/settings-store';
import type { ExportFormat } from '@shared/types';
import type { IRendererBackend } from '../../types';
import type { ImageFrameSettings } from '../../../types';

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
  exportContainerRef: _exportContainerRef,
  imageDisplaySize,
  frameSettings,
}: UseLeaferExportOptions): UseExportReturn {
  void _exportContainerRef;
  void imageDisplaySize;
  void frameSettings;

  const [isExporting, setIsExporting] =
    useState(false);
  const [copied, setCopied] = useState(false);
  const [exportError, setExportError] =
    useState<string | null>(null);

  const { settings } = useSettingsStore();

  /** 从 Leafer frameGroup 直接导出 */
  const exportFromLeafer = useCallback(
    async (
      format: string,
      pixelRatio: number,
    ): Promise<Blob | null> => {
      if (!backend) return null;

      const b = backend as {
        getAppResult?: () => {
          frameGroup: {
            export: (
              format: string,
              options?: Record<
                string,
                unknown
              >,
            ) => Promise<{ data: string }>;
          };
        } | null;
      };
      const appResult = b.getAppResult?.();
      if (!appResult) return null;

      try {
        const result =
          await appResult.frameGroup.export(
            format,
            {
              pixelRatio,
              blob: true,
            },
          );
        const data: unknown = result.data;
        if (typeof data === 'string') {
          // data URL → Blob
          const resp =
            await fetch(data);
          return await resp.blob();
        }
        if (data instanceof Blob) {
          return data;
        }
        return null;
      } catch (e) {
        console.error(
          'Leafer export failed:',
          e,
        );
        return null;
      }
    },
    [backend],
  );

  /** 导出图片 */
  const handleExportImage =
    useCallback(async () => {
      setIsExporting(true);
      setExportError(null);

      try {
        const format =
          settings.defaultFormat as ExportFormat;
        const scale =
          settings.quality === '1x'
            ? 1
            : settings.quality === '3x'
              ? 3
              : 2;
        const timestamp = Date.now();

        let leaferFormat = 'png';
        let ext = 'png';

        if (format === EXPORT_FORMATS.JPG) {
          leaferFormat = 'jpg';
          ext = 'jpg';
        } else if (
          format === EXPORT_FORMATS.WEBP
        ) {
          leaferFormat = 'webp';
          ext = 'webp';
        }

        const blob =
          await exportFromLeafer(
            leaferFormat,
            scale,
          );
        if (!blob) return;

        const url =
          URL.createObjectURL(blob);
        const a =
          document.createElement('a');
        a.href = url;
        a.download = `codeframe-${timestamp}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
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
      exportFromLeafer,
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

      setIsExporting(true);
      setExportError(null);

      try {
        const blob =
          await exportFromLeafer('png', 2);
        if (!blob) return;

        const pngBlob = new Blob([blob], {
          type: 'image/png',
        });

        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': pngBlob,
          }),
        ]);

        setCopied(true);
        setTimeout(
          () => setCopied(false),
          2000,
        );
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
    }, [exportFromLeafer]);

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
