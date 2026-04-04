import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_KEYS } from '@shared/constants';

// 敏感数据过期时间（5分钟）
const CAPTURE_DATA_TTL_MS = 5 * 60 * 1000;

interface StoredCaptureData {
  success: boolean;
  imageData?: string;
  error?: string;
  timestamp: number;
}

interface CaptureState {
  capturing: boolean;
  imageData: string | null;
  error: string | null;
  timestamp: number | null;
  setCapturing: (value: boolean) => void;
  setCaptureResult: (data: StoredCaptureData) => void;
  clearCapture: () => void;
  clearExpiredData: () => void;
}

const initialState = {
  capturing: false,
  imageData: null,
  error: null,
  timestamp: null,
};

// 检查数据是否过期
function isDataExpired(timestamp: number | null): boolean {
  if (!timestamp) return true;
  return Date.now() - timestamp > CAPTURE_DATA_TTL_MS;
}

export const useCaptureStore = create<CaptureState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setCapturing: (value: boolean) => set({ capturing: value }),
      setCaptureResult: (data: StoredCaptureData) =>
        set({
          capturing: false,
          imageData: data.success ? (data.imageData ?? null) : null,
          error: !data.success ? (data.error ?? '未知错误') : null,
          timestamp: data.timestamp,
        }),
      clearCapture: () => set(initialState),
      clearExpiredData: () => {
        const state = get();
        if (isDataExpired(state.timestamp)) {
          set(initialState);
        }
      },
    }),
    {
      name: STORAGE_KEYS.CAPTURE_RESULT,
      storage: createJSONStorage(() => ({
        getItem: async (name: string) => {
          const result = await chrome.storage.local.get(name);
          const raw = result[name];
          return raw ? JSON.stringify(raw) : null;
        },
        setItem: async (name: string, value: string) => {
          try {
            await chrome.storage.local.set({ [name]: JSON.parse(value) });
          } catch (error) {
            console.error('[CodeFrame] Failed to persist capture state:', error);
          }
        },
        removeItem: async (name: string) => {
          await chrome.storage.local.remove(name);
        },
      })),
      partialize: (state) => ({
        imageData: state.imageData,
        error: state.error,
        timestamp: state.timestamp,
      }),
    }
  )
);

// 启动时清理过期数据
if (typeof window !== 'undefined') {
  chrome.storage.local.get(STORAGE_KEYS.CAPTURE_RESULT).then((result) => {
    const stored = result[STORAGE_KEYS.CAPTURE_RESULT] as StoredCaptureData | undefined;
    if (stored?.timestamp && isDataExpired(stored.timestamp)) {
      chrome.storage.local.remove(STORAGE_KEYS.CAPTURE_RESULT);
    }
  }).catch(console.error);
}
