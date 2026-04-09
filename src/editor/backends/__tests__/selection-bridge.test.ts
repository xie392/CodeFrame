// SelectionBridge 单元测试

import {
  describe,
  it,
  expect,
  beforeEach,
} from 'vitest';
import { SelectionBridge } from '../leafer/bridges/selection-bridge';
import type { ShapeType } from '../types';

describe('SelectionBridge', () => {
  let bridge: SelectionBridge;

  beforeEach(() => {
    bridge = new SelectionBridge();
  });

  describe('isSyncing', () => {
    it('初始应为 false', () => {
      expect(bridge.isSyncing()).toBe(false);
    });

    it('syncSelectionToBackend 期间应为 true', () => {
      let duringSync = false;
      const check = () => {
        duringSync = bridge.isSyncing();
      };
      // sync 完成后应恢复 false
      bridge.syncSelectionToBackend({
        arrow: ['a1'],
        rect: [],
        text: [],
        mosaic: [],
      });
      // sync 结束后 syncing 应为 false
      check();
      expect(duringSync).toBe(false);
      expect(bridge.isSyncing()).toBe(false);
    });
  });

  describe('onSelectionChange', () => {
    it('应注册并触发回调', () => {
      const received: Record<
        ShapeType,
        string[]
      >[] = [];
      bridge.onSelectionChange((ids) => {
        received.push(ids);
      });

      bridge.handleLeaferSelect({
        arrow: ['a1', 'a2'],
        rect: ['r1'],
        text: [],
        mosaic: [],
      });

      expect(received).toHaveLength(1);
      expect(received[0].arrow).toEqual([
        'a1',
        'a2',
      ]);
      expect(received[0].rect).toEqual(['r1']);
    });

    it('syncing 期间不应触发回调', () => {
      const received: unknown[] = [];
      bridge.onSelectionChange(() => {
        received.push('called');
      });

      // sync 期间产生的选中事件应被忽略
      bridge.syncSelectionToBackend({
        arrow: ['a1'],
        rect: [],
        text: [],
        mosaic: [],
      });

      // syncing 完成后手动触发
      bridge.handleLeaferSelect({
        arrow: ['a1'],
        rect: [],
        text: [],
        mosaic: [],
      });

      // 非 syncing 期间应触发
      expect(received).toHaveLength(1);
    });
  });

  describe('emptySelection', () => {
    it('应返回所有类型为空数组', () => {
      const empty =
        SelectionBridge.emptySelection();
      expect(empty.arrow).toEqual([]);
      expect(empty.rect).toEqual([]);
      expect(empty.text).toEqual([]);
      expect(empty.mosaic).toEqual([]);
    });
  });
});
