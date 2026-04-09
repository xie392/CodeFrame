// Feature Flag 单元测试

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from 'vitest';
import {
  isLeaferEnabled,
  setLeaferEnabled,
} from '../feature-flag';

describe('feature-flag', () => {
  const STORAGE_KEY = 'codeframe_use_leafer';

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    // 清除 URL 参数
    window.history.replaceState(
      {},
      '',
      window.location.pathname
    );
  });

  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    window.history.replaceState(
      {},
      '',
      window.location.pathname
    );
  });

  describe('isLeaferEnabled', () => {
    it('默认应返回 false', () => {
      expect(isLeaferEnabled()).toBe(false);
    });

    it('URL 参数 ?leafer=true 应返回 true', () => {
      window.history.replaceState(
        {},
        '',
        '?leafer=true'
      );
      expect(isLeaferEnabled()).toBe(true);
    });

    it('URL 参数 ?leafer=false 应返回 false', () => {
      window.history.replaceState(
        {},
        '',
        '?leafer=false'
      );
      expect(isLeaferEnabled()).toBe(false);
    });

    it('localStorage 设为 true 应返回 true', () => {
      localStorage.setItem(
        STORAGE_KEY,
        'true'
      );
      expect(isLeaferEnabled()).toBe(true);
    });

    it('localStorage 设为 false 应返回 false', () => {
      localStorage.setItem(
        STORAGE_KEY,
        'false'
      );
      expect(isLeaferEnabled()).toBe(false);
    });

    it('URL 参数优先于 localStorage', () => {
      localStorage.setItem(
        STORAGE_KEY,
        'false'
      );
      window.history.replaceState(
        {},
        '',
        '?leafer=true'
      );
      expect(isLeaferEnabled()).toBe(true);
    });

    it('localStorage 设为任意非 true 字符串应返回 false', () => {
      localStorage.setItem(
        STORAGE_KEY,
        'yes'
      );
      expect(isLeaferEnabled()).toBe(false);
    });
  });

  describe('setLeaferEnabled', () => {
    it('应将 true 持久化到 localStorage', () => {
      setLeaferEnabled(true);
      expect(
        localStorage.getItem(STORAGE_KEY)
      ).toBe('true');
    });

    it('应将 false 持久化到 localStorage', () => {
      setLeaferEnabled(false);
      expect(
        localStorage.getItem(STORAGE_KEY)
      ).toBe('false');
    });

    it('设置后 isLeaferEnabled 应返回对应值', () => {
      setLeaferEnabled(true);
      expect(isLeaferEnabled()).toBe(true);

      setLeaferEnabled(false);
      // URL 无参数时读 localStorage
      expect(isLeaferEnabled()).toBe(false);
    });
  });
});
