// CodeFrame - 桌面截图处理器
// 使用隐藏标签页进行媒体流捕获（Offscreen Document 不支持 getUserMedia + chromeMediaSource）

import { STORAGE_KEYS } from '@shared/constants';
import type { CaptureResult } from '@shared/types';

const CAPTURE_PAGE_PATH = 'src/background/capture-page.html';
const TAB_READY_TIMEOUT_MS = 10000;

function openEditor(): void {
  chrome.tabs.create({ url: chrome.runtime.getURL('src/editor/index.html') });
}

// 等待标签页加载完成
function waitForTabLoad(tabId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error('标签页加载超时'));
    }, TAB_READY_TIMEOUT_MS);

    function listener(updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        clearTimeout(timeout);
        chrome.tabs.onUpdated.removeListener(listener);
        // 额外等待确保脚本执行完成
        setTimeout(resolve, 300);
      }
    }

    chrome.tabs.onUpdated.addListener(listener);

    // 检查标签页是否已经加载完成
    chrome.tabs.get(tabId).then((tab) => {
      if (tab.status === 'complete') {
        clearTimeout(timeout);
        chrome.tabs.onUpdated.removeListener(listener);
        setTimeout(resolve, 300);
      }
    });
  });
}

// 桌面截图主函数
export async function handleDesktopCapture(): Promise<CaptureResult> {
  let captureTabId: number | null = null;

  try {
    if (!chrome.desktopCapture) {
      return { success: false, error: 'desktopCapture 权限未授予' };
    }

    // 1. 显示媒体源选择器（30 秒超时）
    const streamId = await new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('选择超时，请重试'));
      }, 30000);

      chrome.desktopCapture.chooseDesktopMedia(
        ['screen', 'window', 'tab'],
        (id: string) => {
          clearTimeout(timeout);
          resolve(id ?? '');
        },
      );
    });

    // 用户取消选择（空字符串或未定义）
    if (!streamId) {
      return { success: false, error: '用户取消了截图选择' };
    }

    console.log('[DesktopCapture] StreamId obtained:', streamId.substring(0, 8) + '...');

    // 2. 创建隐藏标签页用于截图
    const tab = await chrome.tabs.create({
      url: chrome.runtime.getURL(CAPTURE_PAGE_PATH),
      active: false,
    });
    captureTabId = tab.id!;
    console.log('[DesktopCapture] Capture tab created:', captureTabId);

    // 3. 等待标签页加载完成
    await waitForTabLoad(captureTabId);

    // 4. 向标签页发送截图请求
    console.log('[DesktopCapture] Sending capture request to tab');
    const result = await chrome.tabs.sendMessage(captureTabId, {
      type: 'CAPTURE_DESKTOP_STREAM',
      payload: { streamId },
    });

    // 5. 关闭截图标签页
    try {
      if (captureTabId) {
        await chrome.tabs.remove(captureTabId);
        captureTabId = null;
      }
    } catch {
      // 标签页可能已关闭
    }

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

    // 确保关闭截图标签页
    if (captureTabId) {
      try {
        await chrome.tabs.remove(captureTabId);
      } catch {
        // 忽略
      }
    }

    return { success: false, error: message };
  }
}
