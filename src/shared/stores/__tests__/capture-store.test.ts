// Capture Store 测试

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useCaptureStore } from '../capture-store';

describe('CaptureStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    act(() => {
      useCaptureStore.setState({
        capturing: false,
        imageData: null,
        error: null,
        timestamp: null,
      });
    });
  });

  describe('Capturing 状态', () => {
    it('应该能够设置 capturing 状态', () => {
      act(() => {
        useCaptureStore.getState().setCapturing(true);
      });

      expect(useCaptureStore.getState().capturing).toBe(true);
    });

    it('应该能够取消 capturing 状态', () => {
      act(() => {
        useCaptureStore.getState().setCapturing(true);
      });

      act(() => {
        useCaptureStore.getState().setCapturing(false);
      });

      expect(useCaptureStore.getState().capturing).toBe(false);
    });
  });

  describe('截图结果', () => {
    it('应该能够设置成功的截图结果', () => {
      act(() => {
        useCaptureStore.getState().setCaptureResult({
          success: true,
          imageData: 'data:image/png;base64,test',
          timestamp: Date.now(),
        });
      });

      const state = useCaptureStore.getState();
      expect(state.capturing).toBe(false);
      expect(state.imageData).toBe('data:image/png;base64,test');
      expect(state.error).toBe(null);
    });

    it('应该能够设置失败的截图结果', () => {
      act(() => {
        useCaptureStore.getState().setCaptureResult({
          success: false,
          error: '截图失败',
          timestamp: Date.now(),
        });
      });

      const state = useCaptureStore.getState();
      expect(state.capturing).toBe(false);
      expect(state.imageData).toBe(null);
      expect(state.error).toBe('截图失败');
    });

    it('应该处理缺少 imageData 的成功结果', () => {
      act(() => {
        useCaptureStore.getState().setCaptureResult({
          success: true,
          timestamp: Date.now(),
        });
      });

      const state = useCaptureStore.getState();
      expect(state.imageData).toBe(null);
    });

    it('应该处理缺少 error 的失败结果', () => {
      act(() => {
        useCaptureStore.getState().setCaptureResult({
          success: false,
          timestamp: Date.now(),
        });
      });

      const state = useCaptureStore.getState();
      expect(state.error).toBe('未知错误');
    });
  });

  describe('清理截图', () => {
    it('应该能够清理截图数据', () => {
      act(() => {
        useCaptureStore.getState().setCaptureResult({
          success: true,
          imageData: 'data:image/png;base64,test',
          timestamp: Date.now(),
        });
      });

      act(() => {
        useCaptureStore.getState().clearCapture();
      });

      const state = useCaptureStore.getState();
      expect(state.capturing).toBe(false);
      expect(state.imageData).toBe(null);
      expect(state.error).toBe(null);
      expect(state.timestamp).toBe(null);
    });
  });

  describe('过期数据清理', () => {
    it('clearExpiredData 应该清理过期数据', () => {
      // 设置一个过期的数据（6分钟前）
      const expiredTimestamp = Date.now() - 6 * 60 * 1000;

      act(() => {
        useCaptureStore.setState({
          imageData: 'data:image/png;base64,test',
          timestamp: expiredTimestamp,
        });
      });

      act(() => {
        useCaptureStore.getState().clearExpiredData();
      });

      const state = useCaptureStore.getState();
      expect(state.imageData).toBe(null);
      expect(state.timestamp).toBe(null);
    });

    it('clearExpiredData 应该保留未过期数据', () => {
      // 设置一个新鲜的数据（1分钟前）
      const freshTimestamp = Date.now() - 1 * 60 * 1000;

      act(() => {
        useCaptureStore.setState({
          imageData: 'data:image/png;base64,test',
          timestamp: freshTimestamp,
        });
      });

      act(() => {
        useCaptureStore.getState().clearExpiredData();
      });

      const state = useCaptureStore.getState();
      expect(state.imageData).toBe('data:image/png;base64,test');
    });
  });
});
