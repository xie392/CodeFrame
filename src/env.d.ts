/// <reference types="vite/client" />

declare module '*.css' {
  const content: string;
  export default content;
}

declare module '*.json' {
  const content: Record<string, unknown>;
  export default content;
}

// 扩展 chrome.storage 类型
interface StorageData {
  isPro: boolean;
  licenseKey: string;
  licenseData: LicenseData | null;
  lastLicenseCheck: number;
  settings: {
    code: CodeSettings;
    screenshot: ScreenshotSettings;
    export: ExportSettings;
  };
  presets: Preset[];
  stats: {
    codeExports: number;
    screenshotExports: number;
    screenshotDailyCount: number;
    lastScreenshotDate: string;
    createdAt: number;
  };
}

interface CodeSettings {
  defaultLanguage: string;
  showLineNumbers: boolean;
  defaultTheme: string;
  defaultBackground: string;
  defaultWindowStyle: string;
  fontSize: number;
}

interface ScreenshotSettings {
  defaultDevice: string;
  defaultBackground: string;
  defaultRadius: number;
  defaultShadow: string;
  defaultSize: string;
}

interface ExportSettings {
  resolution: string;
  scale: number;
  format: 'png' | 'webp' | 'svg';
  addWatermark: boolean;
}

interface LicenseData {
  id: string;
  status: 'active' | 'inactive' | 'expired';
  createdAt: string;
  expiresAt: string | null;
  activationLimit: number;
  activationUsage: number;
}

interface Preset {
  id: string;
  name: string;
  type: 'code' | 'screenshot';
  config: Record<string, unknown>;
  createdAt: number;
}

interface Theme {
  id: string;
  name: string;
  type: 'light' | 'dark';
  isPro: boolean;
  colors: {
    background: string;
    text: string;
    keyword: string;
    string: string;
    comment: string;
    function: string;
    number: string;
  };
}

interface Background {
  id: string;
  name: string;
  type: 'solid' | 'gradient' | 'image';
  isPro: boolean;
  value: string;
}

interface Device {
  id: string;
  name: string;
  type: 'laptop' | 'phone' | 'tablet' | 'browser';
  isPro: boolean;
  frameUrl: string;
  aspectRatio: number;
}

interface SizePreset {
  id: string;
  name: string;
  width: number;
  height: number;
}

export type {
  StorageData,
  CodeSettings,
  ScreenshotSettings,
  ExportSettings,
  LicenseData,
  Preset,
  Theme,
  Background,
  Device,
  SizePreset,
};
