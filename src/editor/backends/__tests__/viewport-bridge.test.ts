// ViewportBridge 单元测试

import {
  describe,
  it,
  expect,
  beforeEach,
} from 'vitest';
import { ViewportBridge } from '../leafer/bridges/viewport-bridge';
import type { ViewportState } from '../types';

describe('ViewportBridge', () => {
  let bridge: ViewportBridge;
  let mockZoomLayer: {
    x: number;
    y: number;
    scale: number;
  };

  beforeEach(() => {
    bridge = new ViewportBridge();
    mockZoomLayer = { x: 0, y: 0, scale: 1 };
  });

  describe('isSyncing', () => {
    it('初始应为 false', () => {
      expect(bridge.isSyncing()).toBe(false);
    });

    it('syncViewportToBackend 后应恢复 false', () => {
      bridge.syncViewportToBackend(
        { scale: 2, offset: { x: 10, y: 20 } },
        mockZoomLayer
      );
      expect(bridge.isSyncing()).toBe(false);
    });
  });

  describe('syncViewportToBackend', () => {
    it('应将 Store 视口状态同步到 zoomLayer', () => {
      const state: ViewportState = {
        scale: 2,
        offset: { x: 10, y: 20 },
      };
      bridge.syncViewportToBackend(
        state,
        mockZoomLayer
      );

      expect(mockZoomLayer.x).toBe(10);
      expect(mockZoomLayer.y).toBe(20);
      expect(mockZoomLayer.scale).toBe(2);
    });
  });

  describe('onViewportChangeCallback', () => {
    it('应注册并触发回调', () => {
      const received: ViewportState[] = [];
      bridge.onViewportChangeCallback((state) => {
        received.push(state);
      });

      const state: ViewportState = {
        scale: 1.5,
        offset: { x: 5, y: 10 },
      };
      bridge.handleLeaferViewportChange(state);

      expect(received).toHaveLength(1);
      expect(received[0]).toEqual(state);
    });

    it('syncing 期间不应触发回调', () => {
      const received: unknown[] = [];
      bridge.onViewportChangeCallback(() => {
        received.push('called');
      });

      // sync 期间
      bridge.syncViewportToBackend(
        { scale: 2, offset: { x: 10, y: 20 } },
        mockZoomLayer
      );

      // syncing 完成后手动触发
      bridge.handleLeaferViewportChange({
        scale: 2,
        offset: { x: 10, y: 20 },
      });

      expect(received).toHaveLength(1);
    });
  });
});
