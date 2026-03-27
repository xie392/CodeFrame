import { createSignal, createRoot, onMount } from 'solid-js';
import type { Settings, LicenseData, Stats, Preset } from '~/utils/storage';
import { getStorage, setStorage, DEFAULT_SETTINGS, DEFAULT_STATS } from '~/utils/storage';

// 免费版每日截图限制
const FREE_DAILY_LIMIT = 3;

// License 验证缓存时间（24小时）
const LICENSE_CACHE_DURATION = 24 * 60 * 60 * 1000;

/**
 * 设置与全局状态管理
 */
function createSettingsStore() {
  // Pro 状态
  const [isPro, setIsPro] = createSignal<boolean>(false);
  const [licenseKey, setLicenseKey] = createSignal<string>('');
  const [licenseData, setLicenseData] = createSignal<LicenseData | null>(null);
  const [isValidating, setIsValidating] = createSignal<boolean>(false);
  
  // 设置
  const [settings, setSettings] = createSignal<Settings>(DEFAULT_SETTINGS);
  
  // 预设
  const [presets, setPresets] = createSignal<Preset[]>([]);
  
  // 统计
  const [stats, setStats] = createSignal<Stats>(DEFAULT_STATS);
  
  // 加载所有数据
  async function loadAll() {
    const data = await getStorage([
      'isPro',
      'licenseKey',
      'licenseData',
      'lastLicenseCheck',
      'settings',
      'presets',
      'stats',
    ]);
    
    setIsPro(data.isPro ?? false);
    setLicenseKey(data.licenseKey ?? '');
    setLicenseData(data.licenseData ?? null);
    setSettings(data.settings ?? DEFAULT_SETTINGS);
    setPresets(data.presets ?? []);
    setStats(data.stats ?? DEFAULT_STATS);
  }
  
  // 检查 Pro 权限
  function checkProAccess(): boolean {
    return isPro();
  }
  
  // 检查截图限制
  function checkScreenshotLimit(): { allowed: boolean; remaining: number } {
    if (isPro()) {
      return { allowed: true, remaining: Infinity };
    }
    
    const today = new Date().toDateString();
    const currentStats = stats();
    
    if (currentStats.lastScreenshotDate !== today) {
      return { allowed: true, remaining: FREE_DAILY_LIMIT };
    }
    
    const remaining = FREE_DAILY_LIMIT - currentStats.screenshotDailyCount;
    return { allowed: remaining > 0, remaining: Math.max(0, remaining) };
  }
  
  // 验证 License
  async function validateLicense(key: string): Promise<{ success: boolean; error?: string }> {
    setIsValidating(true);
    
    try {
      // 调用 Lemon Squeezy API 验证
      const response = await fetch(
        `https://api.lemonsqueezy.com/v1/licenses/validate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ license_key: key }),
        }
      );
      
      const data = await response.json();
      
      if (data.valid && data.license_key?.status === 'active') {
        const licenseInfo: LicenseData = {
          id: data.license_key.id,
          status: data.license_key.status,
          createdAt: data.license_key.created_at,
          expiresAt: data.license_key.expires_at,
          activationLimit: data.license_key.activation_limit,
          activationUsage: data.license_key.activation_usage,
        };
        
        // 更新状态
        setIsPro(true);
        setLicenseKey(key);
        setLicenseData(licenseInfo);
        
        // 保存到存储
        await setStorage({
          isPro: true,
          licenseKey: key,
          licenseData: licenseInfo,
          lastLicenseCheck: Date.now(),
        });
        
        return { success: true };
      } else {
        return { success: false, error: 'License 无效或已过期' };
      }
    } catch (error) {
      return { success: false, error: '验证失败，请检查网络连接' };
    } finally {
      setIsValidating(false);
    }
  }
  
  // 停用 License
  async function deactivateLicense(): Promise<void> {
    setIsPro(false);
    setLicenseKey('');
    setLicenseData(null);
    
    await setStorage({
      isPro: false,
      licenseKey: '',
      licenseData: null,
      lastLicenseCheck: 0,
    });
  }
  
  // 检查缓存的 License 状态
  async function checkCachedLicense(): Promise<void> {
    const { lastLicenseCheck, licenseKey: savedKey } = await getStorage([
      'lastLicenseCheck',
      'licenseKey',
    ]);
    
    // 如果有缓存的 Pro 状态且未过期
    if (
      savedKey &&
      lastLicenseCheck &&
      Date.now() - lastLicenseCheck < LICENSE_CACHE_DURATION
    ) {
      // 使用缓存状态
      return;
    }
    
    // 如果有 license key 但缓存过期，重新验证
    if (savedKey) {
      await validateLicense(savedKey);
    }
  }
  
  // 更新导出设置
  async function updateExportSettings(updates: Partial<Settings['export']>) {
    const newSettings = {
      ...settings(),
      export: { ...settings().export, ...updates },
    };
    setSettings(newSettings);
    await setStorage({ settings: newSettings });
  }
  
  // 添加预设
  async function addPreset(preset: Omit<Preset, 'id' | 'createdAt'>): Promise<void> {
    if (!isPro()) return;
    
    const newPreset: Preset = {
      ...preset,
      id: `preset-${Date.now()}`,
      createdAt: Date.now(),
    };
    
    const newPresets = [...presets(), newPreset];
    setPresets(newPresets);
    await setStorage({ presets: newPresets });
  }
  
  // 删除预设
  async function deletePreset(id: string): Promise<void> {
    const newPresets = presets().filter((p) => p.id !== id);
    setPresets(newPresets);
    await setStorage({ presets: newPresets });
  }
  
  // 更新统计
  async function updateStats(updates: Partial<Stats>) {
    const newStats = { ...stats(), ...updates };
    setStats(newStats);
    await setStorage({ stats: newStats });
  }

  return {
    // 状态
    isPro,
    licenseKey,
    licenseData,
    isValidating,
    settings,
    presets,
    stats,
    
    // 方法
    loadAll,
    checkProAccess,
    checkScreenshotLimit,
    validateLicense,
    deactivateLicense,
    checkCachedLicense,
    updateExportSettings,
    addPreset,
    deletePreset,
    updateStats,
  };
}

export const settingsStore = createRoot(createSettingsStore);
