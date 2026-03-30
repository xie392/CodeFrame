// CodeFrame - Content Script
// 注入到网页中执行截图等功能

import { startRegionCapture } from './overlay';
import { startDelayedCapture } from './countdown';

export function onExecute(): void {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'START_CAPTURE') {
      startRegionCapture();
    }
    if (message.type === 'START_DELAYED_CAPTURE') {
      const { delay } = message.payload as { delay: number };
      startDelayedCapture(delay);
      sendResponse({ success: true });
      return false;
    }
    return false;
  });
}

onExecute();
