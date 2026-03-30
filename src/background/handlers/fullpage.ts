// CodeFrame - 整页截图处理器
// 完全在 Background Service Worker 中执行
// 修复：正确处理重叠区域，避免内容重复

import { STORAGE_KEYS, FULLPAGE_CAPTURE } from '@shared/constants';
import type { CaptureResult } from '@shared/types';

const RESTRICTED_URL_PREFIXES = [
  'chrome://',
  'chrome-extension://',
  'about:',
  'devtools://',
  'edge://',
  'brave://',
] as const;

function isRestrictedUrl(url?: string): boolean {
  if (!url) return true;
  return RESTRICTED_URL_PREFIXES.some((prefix) => url.startsWith(prefix));
}

function openEditor(): void {
  chrome.tabs.create({ url: chrome.runtime.getURL('src/editor/index.html') });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface PageInfo {
  scrollWidth: number;
  scrollHeight: number;
  clientWidth: number;
  clientHeight: number;
  dpr: number;
}

async function getPageInfo(tabId: number): Promise<PageInfo> {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => ({
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      clientWidth: document.documentElement.clientWidth,
      clientHeight: document.documentElement.clientHeight,
      dpr: window.devicePixelRatio || 1,
    }),
  });
  const info = results[0]?.result as PageInfo | undefined;
  if (!info) throw new Error('无法获取页面尺寸');
  return info;
}

async function scrollTo(tabId: number, y: number): Promise<void> {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: (scrollY: number) => window.scrollTo({ top: scrollY, behavior: 'instant' }),
    args: [y],
  });
}

export async function handleFullPageCapture(): Promise<CaptureResult> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id || !tab.windowId || isRestrictedUrl(tab.url)) {
    const result: CaptureResult = { success: false, error: '受限页面不支持截图' };
    await chrome.storage.local.set({
      [STORAGE_KEYS.CAPTURE_RESULT]: { ...result, timestamp: Date.now() },
    });
    return result;
  }

  try {
    const { scrollWidth, scrollHeight, clientHeight, dpr } = await getPageInfo(tab.id);

    if (scrollHeight <= clientHeight) {
      const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
      const result: CaptureResult = { success: true, imageData: dataUrl };
      await chrome.storage.local.set({
        [STORAGE_KEYS.CAPTURE_RESULT]: { ...result, timestamp: Date.now() },
      });
      openEditor();
      return result;
    }

    const captureHeight = Math.min(scrollHeight, FULLPAGE_CAPTURE.MAX_HEIGHT);
    const overlap = FULLPAGE_CAPTURE.OVERLAP_HEIGHT;
    const stepHeight = clientHeight - overlap;
    const segments = Math.ceil((captureHeight - clientHeight) / stepHeight) + 1;

    const segmentImages: string[] = [];
    for (let i = 0; i < segments; i++) {
      const scrollY = Math.min(i * stepHeight, captureHeight - clientHeight);
      await scrollTo(tab.id, scrollY);
      await delay(FULLPAGE_CAPTURE.SCROLL_DELAY);

      const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
      segmentImages.push(dataUrl);
    }

    await scrollTo(tab.id, 0);

    const fullPageDataUrl = await stitchSegments(segmentImages, {
      pageWidth: scrollWidth,
      captureHeight,
      clientHeight,
      dpr,
      overlap,
    });

    const result: CaptureResult = { success: true, imageData: fullPageDataUrl };
    await chrome.storage.local.set({
      [STORAGE_KEYS.CAPTURE_RESULT]: { ...result, timestamp: Date.now() },
    });
    openEditor();
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : '整页截图失败';
    const result: CaptureResult = { success: false, error: message };
    await chrome.storage.local.set({
      [STORAGE_KEYS.CAPTURE_RESULT]: { ...result, timestamp: Date.now() },
    });
    return result;
  }
}

async function stitchSegments(
  segments: string[],
  info: {
    pageWidth: number;
    captureHeight: number;
    clientHeight: number;
    dpr: number;
    overlap: number;
  },
): Promise<string> {
  const { pageWidth, captureHeight, clientHeight, dpr, overlap } = info;

  const canvasWidth = Math.round(pageWidth * dpr);
  const canvasHeight = Math.round(captureHeight * dpr);

  const maxSize = 32767;
  const finalWidth = Math.min(canvasWidth, maxSize);
  const finalHeight = Math.min(canvasHeight, maxSize);

  const offscreen = new OffscreenCanvas(finalWidth, finalHeight);
  const ctx = offscreen.getContext('2d');
  if (!ctx) throw new Error('无法创建 Canvas 上下文');

  const viewportPx = Math.round(clientHeight * dpr);
  const overlapPx = Math.round(overlap * dpr);

  for (let i = 0; i < segments.length; i++) {
    const bitmap = await dataUrlToBitmap(segments[i]);

    let sourceY = 0;
    let destY = 0;
    let drawHeight = bitmap.height;

    if (i === 0) {
      destY = 0;
      if (segments.length > 1) {
        drawHeight = viewportPx - overlapPx;
      }
    } else {
      sourceY = overlapPx;
      destY = i * (viewportPx - overlapPx);
      drawHeight = Math.min(viewportPx - overlapPx, bitmap.height - overlapPx);
    }

    const remainingHeight = finalHeight - destY;
    if (drawHeight > remainingHeight) {
      drawHeight = remainingHeight;
    }

    ctx.drawImage(
      bitmap,
      0, sourceY, bitmap.width, drawHeight,
      0, destY, finalWidth, drawHeight,
    );
    bitmap.close();
  }

  const blob = await offscreen.convertToBlob({ type: 'image/png' });
  return blobToDataUrl(blob);
}

async function dataUrlToBitmap(dataUrl: string): Promise<ImageBitmap> {
  const base64 = dataUrl.split(',')[1];
  if (!base64) throw new Error('无效的 data URL');
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return createImageBitmap(new Blob([bytes], { type: 'image/png' }));
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
