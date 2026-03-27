export default defineBackground(() => {
  // 扩展安装时的处理
  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      console.log('CodeFrame 已安装');
      initializeDefaultSettings();
    } else if (details.reason === 'update') {
      console.log('CodeFrame 已更新到版本', chrome.runtime.getManifest().version);
    }
  });

  // 监听来自 popup 或 content script 的消息
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'GET_PRO_STATUS') {
      chrome.storage.sync.get(['isPro'], (result) => {
        sendResponse({ isPro: result.isPro ?? false });
      });
      return true;
    }

    if (message.type === 'CAPTURE_TAB') {
      chrome.tabs.captureVisibleTab(
        undefined,
        { format: 'png', quality: 100 },
        (dataUrl) => {
          if (chrome.runtime.lastError) {
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else {
            sendResponse({ success: true, dataUrl });
          }
        }
      );
      return true;
    }

    return false;
  });
});

async function initializeDefaultSettings(): Promise<void> {
  const defaultSettings = {
    isPro: false,
    licenseKey: '',
    lastLicenseCheck: 0,
    settings: {
      code: {
        defaultLanguage: 'javascript',
        showLineNumbers: true,
        defaultTheme: 'one-dark-pro',
        defaultBackground: 'white',
        defaultWindowStyle: 'macos',
        fontSize: 16,
      },
      screenshot: {
        defaultDevice: 'macbook-pro',
        defaultBackground: 'white',
        defaultRadius: 12,
        defaultShadow: 'medium',
        defaultSize: 'twitter-post',
      },
      export: {
        resolution: '1080p',
        scale: 2,
        format: 'png',
        addWatermark: true,
      },
    },
    stats: {
      codeExports: 0,
      screenshotExports: 0,
      screenshotDailyCount: 0,
      lastScreenshotDate: '',
      createdAt: Date.now(),
    },
  };

  await chrome.storage.sync.set(defaultSettings);
}
