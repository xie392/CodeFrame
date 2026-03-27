import { createSignal, createRoot } from 'solid-js';
import type { ScreenshotSettings } from '~/utils/storage';
import { getStorage, setStorage, DEFAULT_SETTINGS, getTodayScreenshotCount } from '~/utils/storage';

// 设备列表
export const DEVICES = [
  { id: 'macbook-pro', name: 'MacBook Pro', type: 'laptop', isPro: false },
  { id: 'browser', name: 'Browser Window', type: 'browser', isPro: false },
  { id: 'macbook-air', name: 'MacBook Air', type: 'laptop', isPro: true },
  { id: 'imac', name: 'iMac', type: 'desktop', isPro: true },
  { id: 'iphone-15', name: 'iPhone 15', type: 'phone', isPro: true },
  { id: 'iphone-15-pro', name: 'iPhone 15 Pro', type: 'phone', isPro: true },
  { id: 'ipad-pro', name: 'iPad Pro', type: 'tablet', isPro: true },
];

// 社交平台尺寸预设
export const SIZE_PRESETS = [
  { id: 'twitter-post', name: 'Twitter Post', width: 1200, height: 675 },
  { id: 'twitter-header', name: 'Twitter Header', width: 1500, height: 500 },
  { id: 'linkedin-post', name: 'LinkedIn Post', width: 1200, height: 627 },
  { id: 'instagram-square', name: 'Instagram Square', width: 1080, height: 1080 },
  { id: 'instagram-story', name: 'Instagram Story', width: 1080, height: 1920 },
  { id: 'youtube-thumbnail', name: 'YouTube Thumbnail', width: 1280, height: 720 },
  { id: 'og-image', name: 'Open Graph', width: 1200, height: 630 },
];

// 截图来源类型
export type ImageSourceType = 'capture' | 'upload';

/**
 * 截图美化模块状态管理
 */
function createScreenshotStore() {
  // 图片源
  const [imageSource, setImageSource] = createSignal<ImageSourceType>('capture');
  
  // 原始图片
  const [originalImage, setOriginalImage] = createSignal<string | null>(null);
  
  // 设置
  const [settings, setSettings] = createSignal<ScreenshotSettings>(DEFAULT_SETTINGS.screenshot);
  
  // 今日截图次数
  const [todayCount, setTodayCount] = createSignal<number>(0);
  
  // 加载设置
  async function loadSettings() {
    const { settings: storedSettings } = await getStorage(['settings']);
    if (storedSettings?.screenshot) {
      setSettings(storedSettings.screenshot);
    }
    const count = await getTodayScreenshotCount();
    setTodayCount(count);
  }
  
  // 保存设置
  async function saveSettings(updates: Partial<ScreenshotSettings>) {
    const newSettings = { ...settings(), ...updates };
    setSettings(newSettings);
    await setStorage({
      settings: {
        ...(await getStorage(['settings'])).settings,
        screenshot: newSettings,
      },
    });
  }
  
  // 设置图片
  function setImage(imageData: string | null) {
    setOriginalImage(imageData);
  }
  
  // 更新设备
  async function updateDevice(device: string) {
    await saveSettings({ device });
  }
  
  // 更新背景
  async function updateBackground(bg: string) {
    await saveSettings({ background: bg });
  }
  
  // 更新圆角
  async function updateBorderRadius(radius: number) {
    await saveSettings({ borderRadius: radius });
  }
  
  // 切换阴影
  async function toggleShadow() {
    await saveSettings({ shadow: !settings().shadow });
  }
  
  // 更新内边距
  async function updatePadding(padding: number) {
    await saveSettings({ padding });
  }
  
  // 切换图片源
  function switchImageSource(source: ImageSourceType) {
    setImageSource(source);
    // 清除当前图片
    setOriginalImage(null);
  }
  
  // 捕获当前标签页
  async function captureCurrentTab(): Promise<string | null> {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) return null;
      
      const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
        format: 'png',
        quality: 100,
      });
      
      setOriginalImage(dataUrl);
      return dataUrl;
    } catch (error) {
      console.error('捕获标签页失败:', error);
      return null;
    }
  }
  
  // 重置为默认设置
  async function resetToDefault() {
    setSettings(DEFAULT_SETTINGS.screenshot);
    await setStorage({
      settings: {
        ...(await getStorage(['settings'])).settings,
        screenshot: DEFAULT_SETTINGS.screenshot,
      },
    });
  }
  
  // 刷新今日计数
  async function refreshTodayCount() {
    const count = await getTodayScreenshotCount();
    setTodayCount(count);
  }

  return {
    // 状态
    imageSource,
    originalImage,
    settings,
    todayCount,
    
    // 方法
    loadSettings,
    saveSettings,
    setImage,
    updateDevice,
    updateBackground,
    updateBorderRadius,
    toggleShadow,
    updatePadding,
    switchImageSource,
    captureCurrentTab,
    resetToDefault,
    refreshTodayCount,
  };
}

export const screenshotStore = createRoot(createScreenshotStore);
