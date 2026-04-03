// CodeFrame - 桌面截图处理器
// 直接在目标标签页通过 executeScript 注入截图函数，无需隐藏标签页和消息传递

import { STORAGE_KEYS } from '@shared/constants';
import type { CaptureResult } from '@shared/types';

let isCapturing = false;

function openEditor(): void {
  chrome.tabs.create({
    url: chrome.runtime.getURL('src/editor/index.html?source=capture'),
  });
}

/**
 * Chrome 桌面媒体约束接口
 * 用于 desktopCapture API 的 getUserMedia 调用
 *
 * 注意：这是 Chrome 扩展特有的非标准 API
 * Chrome 扩展支持 `mandatory.chromeMediaSource` 属性
 * 参考：https://developer.chrome.com/docs/extensions/reference/api/desktopCapture
 */
interface ChromeDesktopConstraints {
  video: {
    mandatory: {
      chromeMediaSource: 'desktop';
      chromeMediaSourceId: string;
    };
  };
}

// 注入到目标标签页的截图函数（自包含，不能引用外部变量）
function captureDesktopStream(streamId: string): Promise<{
  success: boolean;
  imageData?: string;
  error?: string;
}> {
  return (async () => {
    // Chrome 扩展桌面捕获约束，需要类型断言因为 TypeScript 不识别 Chrome 特有属性
    const constraints: ChromeDesktopConstraints = {
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: String(streamId),
        },
      },
    };
    const stream = await navigator.mediaDevices.getUserMedia(
      constraints as MediaStreamConstraints
    );

    const video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('视频加载失败'));
    });

    await new Promise<void>((resolve) => {
      video.play()
        .then(() => setTimeout(resolve, 500))
        .catch(() => setTimeout(resolve, 1000));
    });

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      stream.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
      video.remove();
      throw new Error('无法获取 Canvas 上下文');
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    stream.getTracks().forEach((t) => t.stop());
    video.srcObject = null;

    const dataUrl = canvas.toDataURL('image/png');
    video.remove();
    canvas.remove();

    return { success: true, imageData: dataUrl };
  })().catch((err) => ({
    success: false,
    error: err instanceof Error ? err.message : '捕获流失败',
  }));
}

// 桌面截图主函数
export async function handleDesktopCapture(
  targetTab?: chrome.tabs.Tab,
): Promise<CaptureResult> {
  if (isCapturing) {
    return { success: false, error: '截图正在进行中' };
  }
  isCapturing = true;

  try {
    if (!chrome.desktopCapture) {
      return { success: false, error: 'desktopCapture 权限未授予' };
    }

    const tabId = targetTab?.id;
    if (!tabId) {
      return { success: false, error: '无法获取目标标签页' };
    }

    // 1. 显示媒体源选择器（30 秒超时）
    const streamId = await new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('选择超时，请重试'));
      }, 30000);

      const sources: string[] = ['screen', 'window', 'tab'];
      const callback = (id: string) => {
        clearTimeout(timeout);
        resolve(id ?? '');
      };

      if (targetTab) {
        chrome.desktopCapture.chooseDesktopMedia(sources, targetTab, callback);
      } else {
        chrome.desktopCapture.chooseDesktopMedia(sources, callback);
      }
    });

    // 用户取消选择（空字符串或未定义）
    if (!streamId) {
      return { success: false, error: '用户取消了截图选择' };
    }

    console.log('[DesktopCapture] StreamId obtained:', streamId.substring(0, 8) + '...');

    // 2. 直接在目标标签页注入并执行截图逻辑
    console.log('[DesktopCapture] Injecting capture script into tab:', tabId);
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: captureDesktopStream,
      args: [streamId],
    });

    const result = results?.[0]?.result;
    console.log('[DesktopCapture] Capture result:', result?.success ? 'success' : 'failed');

    if (result?.success && result.imageData) {
      await chrome.storage.local.set({
        [STORAGE_KEYS.CAPTURE_RESULT]: {
          success: true,
          imageData: result.imageData,
          timestamp: Date.now(),
          mode: 'desktop',
        },
      });
      openEditor();
      return { success: true, imageData: result.imageData };
    }

    return { success: false, error: result?.error || '桌面截图失败' };
  } catch (error) {
    const message = error instanceof Error ? error.message : '桌面截图失败';
    console.error('[DesktopCapture] Error:', message);
    return { success: false, error: message };
  } finally {
    isCapturing = false;
  }
}
