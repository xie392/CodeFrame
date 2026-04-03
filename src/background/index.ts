// CodeFrame - Background Service Worker
// Chrome Extension Manifest V3

import { handleCaptureRequest, handleRegionCapture } from './handlers/capture';
import { handleFullPageCapture } from './handlers/fullpage';
import { handleDesktopCapture } from './handlers/desktop-capture';
import { isRestrictedUrl } from './handlers/utils/image';
import { logger } from '@shared/utils/logger';
import type { CaptureRequestPayload, StartDelayedCapturePayload } from '@shared/messages';
import type { CaptureResult, RegionRect } from '@shared/types';

logger.log('Service Worker started');

// ---------------------------------------------------------------------------
// 消息验证安全层
// ---------------------------------------------------------------------------

interface ValidatedMessage {
  type: string;
  payload?: unknown;
  timestamp?: number;
}

/**
 * 验证消息来源和结构
 * 确保消息来自同一扩展且格式正确
 */
function validateMessage(
  message: unknown,
  sender: chrome.runtime.MessageSender,
): ValidatedMessage | null {
  // 验证来源：确保消息来自同一扩展
  if (!sender.id || sender.id !== chrome.runtime.id) {
    logger.warn('Rejected message from unknown sender:', sender.id);
    return null;
  }

  // 验证消息结构
  if (!message || typeof message !== 'object') {
    logger.warn('Rejected invalid message structure');
    return null;
  }

  const msg = message as Record<string, unknown>;

  // 验证 type 字段
  if (typeof msg.type !== 'string' || msg.type.length === 0) {
    logger.warn('Rejected message with invalid type');
    return null;
  }

  return {
    type: msg.type,
    payload: msg.payload,
    timestamp: typeof msg.timestamp === 'number' ? msg.timestamp : undefined,
  };
}

// ---------------------------------------------------------------------------
// 扩展生命周期监听
// ---------------------------------------------------------------------------

// 监听扩展安装
chrome.runtime.onInstalled.addListener((details) => {
  logger.log('Extension installed:', details.reason);

  // 创建右键菜单
  chrome.contextMenus.create({
    id: 'codeframe-screenshot',
    title: '使用 CodeFrame 截图',
    contexts: ['page', 'selection', 'image'],
  });
});

// 监听右键菜单点击
chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === 'codeframe-screenshot') {
    handleCaptureRequest().catch((err) => {
      logger.error('Context menu capture failed:', err);
    });
  }
});

// ---------------------------------------------------------------------------
// 辅助函数
// ---------------------------------------------------------------------------

// 校验 RegionRect payload
function validateRegionRect(
  payload: Record<string, unknown>,
): RegionRect | null {
  const { x, y, width, height, dpr } = payload;
  if (
    typeof x !== 'number' ||
    typeof y !== 'number' ||
    typeof width !== 'number' ||
    typeof height !== 'number' ||
    typeof dpr !== 'number' ||
    dpr <= 0
  ) {
    return null;
  }
  return { x, y, width, height, dpr };
}

// 向 Content Script 发送 START_CAPTURE 消息
async function startRegionCapture(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  await chrome.tabs.sendMessage(tab.id, {
    type: 'START_CAPTURE',
    payload: {},
    timestamp: Date.now(),
  });
}

// 向 Content Script 发送 START_DELAYED_CAPTURE 消息
async function startDelayedCapture(delay: number): Promise<CaptureResult> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    return { success: false, error: '无法获取当前标签页' };
  }
  if (isRestrictedUrl(tab.url)) {
    return { success: false, error: '受限页面不支持截图' };
  }
  await chrome.tabs.sendMessage(tab.id, {
    type: 'START_DELAYED_CAPTURE',
    payload: { delay } as StartDelayedCapturePayload,
    timestamp: Date.now(),
  });
  return { success: true };
}

// ---------------------------------------------------------------------------
// 消息处理
// ---------------------------------------------------------------------------

// 监听消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 验证消息来源和结构
  const validatedMsg = validateMessage(message, sender);
  if (!validatedMsg) {
    sendResponse({ success: false, error: '消息验证失败' } as CaptureResult);
    return false;
  }

  logger.log('Message received:', validatedMsg.type);

  switch (validatedMsg.type) {
    case 'CAPTURE_REQUEST': {
      const { mode, delay } = (validatedMsg.payload as CaptureRequestPayload) ?? {};
      if (mode === 'visible') {
        handleCaptureRequest()
          .then(sendResponse)
          .catch((err: unknown) => {
            const errorMsg = err instanceof Error ? err.message : '截图请求失败';
            sendResponse({ success: false, error: errorMsg } as CaptureResult);
          });
        return true;
      }
      if (mode === 'region') {
        startRegionCapture()
          .then(() => sendResponse({ success: true } as CaptureResult))
          .catch((err: unknown) => {
            const errorMsg = err instanceof Error ? err.message : '启动区域截图失败';
            sendResponse({ success: false, error: errorMsg } as CaptureResult);
          });
        return true;
      }
      if (mode === 'fullpage') {
        handleFullPageCapture()
          .then(sendResponse)
          .catch((err: unknown) => {
            const errorMsg = err instanceof Error ? err.message : '整页截图失败';
            sendResponse({ success: false, error: errorMsg } as CaptureResult);
          });
        return true;
      }
      if (mode === 'delayed') {
        const delaySeconds = delay ?? 3;
        startDelayedCapture(delaySeconds)
          .then(sendResponse)
          .catch((err: unknown) => {
            const errorMsg = err instanceof Error ? err.message : '启动延时截图失败';
            sendResponse({ success: false, error: errorMsg } as CaptureResult);
          });
        return true;
      }
      if (mode === 'desktop') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const activeTab = tabs[0];
          handleDesktopCapture(activeTab)
            .then(sendResponse)
            .catch((err: unknown) => {
              const errorMsg = err instanceof Error ? err.message : '桌面截图失败';
              sendResponse({ success: false, error: errorMsg } as CaptureResult);
            });
        });
        return true;
      }
      sendResponse({ success: false, error: `不支持的截图模式: ${mode}` } as CaptureResult);
      return false;
    }
    case 'CAPTURE_REGION': {
      const region = validateRegionRect(
        validatedMsg.payload as Record<string, unknown>,
      );
      if (!region) {
        sendResponse({
          success: false,
          error: '无效的选区坐标',
        } as CaptureResult);
        return false;
      }
      handleRegionCapture(region)
        .then(sendResponse)
        .catch((err: unknown) => {
          const errorMsg = err instanceof Error ? err.message : '区域截图失败';
          sendResponse({ success: false, error: errorMsg } as CaptureResult);
        });
      return true;
    }

    case 'CANCEL_CAPTURE':
      sendResponse({ success: true });
      return false;

    case 'CAPTURE_DELAYED_READY':
      // 倒计时结束，执行截图（不需要响应）
      handleCaptureRequest()
        .then((result) => {
          logger.log('Delayed capture completed:', result.success);
        })
        .catch((err: unknown) => {
          logger.error('Delayed capture failed:', err);
        });
      return false;

    case 'CANCEL_DELAYED_CAPTURE':
      // 用户取消延时截图
      logger.log('Delayed capture cancelled by user');
      sendResponse({ success: true });
      return false;

    default:
      logger.log('Unknown message type:', validatedMsg.type);
      break;
  }

  return false;
});

// 监听快捷键命令
chrome.commands.onCommand.addListener((command) => {
  if (command === 'capture-visible') {
    handleCaptureRequest().catch((err) => {
      logger.error('Command capture failed:', err);
    });
  }
  if (command === 'capture-region') {
    startRegionCapture().catch((err) => {
      logger.error('Command region capture failed:', err);
    });
  }
  if (command === 'capture-fullpage') {
    handleFullPageCapture().catch((err: unknown) => {
      logger.error('Command fullpage capture failed:', err);
    });
  }
  if (command === 'capture-desktop') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      handleDesktopCapture(tabs[0]).catch((err: unknown) => {
        logger.error('Command desktop capture failed:', err);
      });
    });
  }
});

export {};
