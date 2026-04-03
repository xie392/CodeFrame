// CodeFrame - 延时截图倒计时组件（右上角小型）

import { createMessage } from '@shared/messages';
import { initContentI18n, t } from '@shared/i18n/content';

// 初始化 i18n（模块加载时）
initContentI18n().catch(console.error);

let countdownHost: HTMLElement | null = null;
let countdownInterval: ReturnType<typeof setInterval> | null = null;
let cleanupFn: (() => void) | null = null;

function getCountdownStyles(): string {
  return `
    :host {
      all: initial;
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .cf-countdown-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background: rgba(0, 0, 0, 0.85);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      cursor: default;
      user-select: none;
    }

    .cf-countdown-badge--warn {
      background: rgba(245, 158, 11, 0.95);
    }

    .cf-countdown-number {
      font-size: 18px;
      font-weight: 600;
      color: #fff;
      min-width: 20px;
      text-align: center;
    }

    .cf-countdown-label {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
    }

    .cf-countdown-hint {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.5);
      margin-left: 4px;
    }
  `;
}

function createCountdownBadge(delay: number): ShadowRoot {
  destroyCountdownBadge();

  const host = document.createElement('div');
  host.id = 'codeframe-countdown-host';
  document.documentElement.appendChild(host);

  const root = host.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = getCountdownStyles();
  root.appendChild(style);

  const badge = document.createElement('div');
  badge.className = 'cf-countdown-badge';

  const number = document.createElement('span');
  number.className = 'cf-countdown-number';
  number.textContent = String(delay);
  badge.appendChild(number);

  const label = document.createElement('span');
  label.className = 'cf-countdown-label';
  label.textContent = t('screenshotAfter');
  badge.appendChild(label);

  const hint = document.createElement('span');
  hint.className = 'cf-countdown-hint';
  hint.textContent = t('escToCancel');
  badge.appendChild(hint);

  root.appendChild(badge);

  countdownHost = host;

  return root;
}

function destroyCountdownBadge(): void {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  if (cleanupFn) {
    cleanupFn();
    cleanupFn = null;
  }
  if (countdownHost) {
    countdownHost.remove();
    countdownHost = null;
  }
}

export function startDelayedCapture(delay: number): void {
  // 重复点击保护
  if (isCountdownActive()) {
    console.warn('[CodeFrame] Countdown already active, ignoring duplicate request');
    return;
  }

  const root = createCountdownBadge(delay);

  const badge = root.querySelector('.cf-countdown-badge') as HTMLDivElement;
  const number = root.querySelector('.cf-countdown-number') as HTMLSpanElement;

  let remaining = delay;

  const updateUI = (): void => {
    number.textContent = String(remaining);
    // 最后 1 秒警告样式
    if (remaining <= 1) {
      badge.classList.add('cf-countdown-badge--warn');
    }
  };

  const onComplete = (): void => {
    destroyCountdownBadge();
    // 稍微延迟确保 UI 完全隐藏后再截图
    setTimeout(() => {
      chrome.runtime.sendMessage(createMessage('CAPTURE_DELAYED_READY', {}));
    }, 50);
  };

  const onCancel = (): void => {
    destroyCountdownBadge();
    chrome.runtime.sendMessage(createMessage('CANCEL_DELAYED_CAPTURE', {}));
  };

  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      cleanup();
      onCancel();
    }
  };

  const cleanup = (): void => {
    window.removeEventListener('keydown', onKeyDown, true);
  };

  // 保存清理函数引用
  cleanupFn = cleanup;

  // 初始显示
  updateUI();

  // 倒计时
  countdownInterval = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      cleanup();
      onComplete();
    } else {
      updateUI();
    }
  }, 1000);

  // 监听 Escape 取消（使用 capture 确保优先处理）
  window.addEventListener('keydown', onKeyDown, true);
}

export function isCountdownActive(): boolean {
  return countdownHost !== null;
}
