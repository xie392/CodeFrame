import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_KEYS } from '@shared/constants';

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
  setCapturing: (value: boolean) => void;
  setCaptureResult: (data: StoredCaptureData) => void;
  clearCapture: () => void;
}

const initialState = {
  capturing: false,
  imageData: null,
  error: null,
};

export const useCaptureStore = create<CaptureState>()(
  persist(
    (set) => ({
      ...initialState,
      setCapturing: (value: boolean) => set({ capturing: value }),
      setCaptureResult: (data: StoredCaptureData) =>
        set({
          capturing: false,
          imageData: data.success ? (data.imageData ?? null) : null,
          error: !data.success ? (data.error ?? '未知错误') : null,
        }),
      clearCapture: () => set(initialState),
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
      }),
    }
  )
);
