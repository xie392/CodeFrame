/**
 * Chrome Storage 封装工具
 * 提供类型安全的存储操作
 */

export interface StorageData {
  // Pro 状态
  isPro: boolean;
  licenseKey: string;
  licenseData: LicenseData | null;
  lastLicenseCheck: number;

  // 用户配置
  settings: Settings;
  
  // 预设（Pro 功能）
  presets: Preset[];

  // 统计
  stats: Stats;
}

export interface LicenseData {
  id: string;
  status: 'active' | 'expired' | 'disabled';
  createdAt: string;
  expiresAt: string | null;
  activationLimit: number;
  activationUsage: number;
}

export interface Settings {
  code: CodeSettings;
  screenshot: ScreenshotSettings;
  export: ExportSettings;
}

export interface CodeSettings {
  theme: string;
  language: string;
  showLineNumbers: boolean;
  fontSize: number;
  fontFamily: string;
  windowStyle: 'macos' | 'windows' | 'none';
  background: string;
  padding: number;
}

export interface ScreenshotSettings {
  device: string;
  background: string;
  borderRadius: number;
  shadow: boolean;
  padding: number;
}

export interface ExportSettings {
  format: 'png' | 'webp' | 'svg';
  quality: number;
  scale: number;
  showWatermark: boolean;
}

export interface Preset {
  id: string;
  name: string;
  type: 'code' | 'screenshot';
  settings: CodeSettings | ScreenshotSettings;
  createdAt: number;
}

export interface Stats {
  codeExports: number;
  screenshotExports: number;
  screenshotDailyCount: number;
  lastScreenshotDate: string;
  createdAt: number;
}

// 默认值
const DEFAULT_SETTINGS: Settings = {
  code: {
    theme: 'github-dark',
    language: 'auto',
    showLineNumbers: true,
    fontSize: 14,
    fontFamily: 'JetBrains Mono',
    windowStyle: 'macos',
    background: 'gradient-1',
    padding: 24,
  },
  screenshot: {
    device: 'macbook-pro',
    background: 'gradient-1',
    borderRadius: 16,
    shadow: true,
    padding: 48,
  },
  export: {
    format: 'png',
    quality: 100,
    scale: 2,
    showWatermark: true,
  },
};

const DEFAULT_STATS: Stats = {
  codeExports: 0,
  screenshotExports: 0,
  screenshotDailyCount: 0,
  lastScreenshotDate: '',
  createdAt: Date.now(),
};

const DEFAULT_STORAGE: StorageData = {
  isPro: false,
  licenseKey: '',
  licenseData: null,
  lastLicenseCheck: 0,
  settings: DEFAULT_SETTINGS,
  presets: [],
  stats: DEFAULT_STATS,
};

/**
 * 获取存储数据
 */
export async function getStorage<K extends keyof StorageData>(
  keys: K[]
): Promise<Pick<StorageData, K>> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(keys, (result) => {
      resolve(result as Pick<StorageData, K>);
    });
  });
}

/**
 * 设置存储数据
 */
export async function setStorage<K extends keyof StorageData>(
  data: Pick<StorageData, K>
): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(data, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

/**
 * 获取完整存储数据（带默认值）
 */
export async function getFullStorage(): Promise<StorageData> {
  const result = await getStorage(Object.keys(DEFAULT_STORAGE) as (keyof StorageData)[]);
  return { ...DEFAULT_STORAGE, ...result };
}

/**
 * 重置设置为默认值
 */
export async function resetSettings(): Promise<void> {
  await setStorage({ settings: DEFAULT_SETTINGS });
}

/**
 * 更新部分设置
 */
export async function updateSettings<K extends keyof Settings>(
  category: K,
  updates: Partial<Settings[K]>
): Promise<void> {
  const { settings } = await getStorage(['settings']);
  const currentSettings = settings ?? DEFAULT_SETTINGS;
  await setStorage({
    settings: {
      ...currentSettings,
      [category]: { ...currentSettings[category], ...updates },
    },
  });
}

/**
 * 增加导出计数
 */
export async function incrementExportCount(type: 'code' | 'screenshot'): Promise<void> {
  const { stats } = await getStorage(['stats']);
  const currentStats = stats ?? DEFAULT_STATS;
  const today = new Date().toDateString();
  
  const newStats: Stats = {
    ...currentStats,
    codeExports: currentStats.codeExports + (type === 'code' ? 1 : 0),
    screenshotExports: currentStats.screenshotExports + (type === 'screenshot' ? 1 : 0),
    screenshotDailyCount: currentStats.lastScreenshotDate === today 
      ? currentStats.screenshotDailyCount + 1 
      : 1,
    lastScreenshotDate: type === 'screenshot' ? today : currentStats.lastScreenshotDate,
  };
  
  await setStorage({ stats: newStats });
}

/**
 * 检查今日截图次数
 */
export async function getTodayScreenshotCount(): Promise<number> {
  const { stats } = await getStorage(['stats']);
  const today = new Date().toDateString();
  
  if (stats?.lastScreenshotDate === today) {
    return stats.screenshotDailyCount;
  }
  return 0;
}

export { DEFAULT_SETTINGS, DEFAULT_STATS, DEFAULT_STORAGE };
