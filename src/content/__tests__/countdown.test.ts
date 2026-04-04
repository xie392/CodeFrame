// countdown 模块测试

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies
vi.mock('@shared/i18n/content', () => ({
  initContentI18n: vi.fn().mockResolvedValue(undefined),
  t: vi.fn((key: string) => {
    const translations: Record<string, string> = {
      screenshotAfter: '秒后截图',
      escToCancel: '按 ESC 取消',
    };
    return translations[key] || key;
  }),
}));

vi.mock('@shared/messages', () => ({
  createMessage: vi.fn((type, data) => ({ type, data })),
}));

describe('countdown', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // 重置模块状态
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
    // 清理 DOM
    document.body.innerHTML = '';
    document.documentElement.innerHTML = '';
  });

  describe('isCountdownActive', () => {
    it('应该在倒计时未启动时返回 false', async () => {
      const { isCountdownActive } = await import('../countdown');
      expect(isCountdownActive()).toBe(false);
    });
  });

  describe('startDelayedCapture', () => {
    it('应该创建倒计时 UI', async () => {
      const { startDelayedCapture, isCountdownActive } = await import('../countdown');

      startDelayedCapture(3);

      expect(isCountdownActive()).toBe(true);
      expect(document.querySelector('#codeframe-countdown-host')).toBeDefined();
    });

    it('应该在已有倒计时时忽略重复请求', async () => {
      const { startDelayedCapture } = await import('../countdown');
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      startDelayedCapture(3);
      startDelayedCapture(5);

      expect(warnSpy).toHaveBeenCalledWith(
        '[CodeFrame] Countdown already active, ignoring duplicate request'
      );

      warnSpy.mockRestore();
    });

    it('应该在倒计时结束后清理 UI', async () => {
      vi.useFakeTimers();

      const { startDelayedCapture, isCountdownActive } = await import('../countdown');

      vi.stubGlobal('chrome', {
        runtime: { sendMessage: vi.fn() },
      });

      startDelayedCapture(1);

      expect(isCountdownActive()).toBe(true);

      // 推进时间到倒计时结束
      vi.advanceTimersByTime(1100);

      expect(isCountdownActive()).toBe(false);

      vi.unstubAllGlobals();
    });

    it('应该忽略非 ESC 键', async () => {
      const { startDelayedCapture, isCountdownActive } = await import('../countdown');

      startDelayedCapture(5);

      expect(isCountdownActive()).toBe(true);

      // 模拟其他键
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
      });

      window.dispatchEvent(enterEvent);

      expect(isCountdownActive()).toBe(true);
    });
  });
});
