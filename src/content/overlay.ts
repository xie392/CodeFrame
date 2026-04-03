// CodeFrame - 区域选择覆盖层（Shadow DOM 隔离）

import { REGION_CAPTURE } from '@shared/constants';
import { createMessage } from '@shared/messages';
import { initContentI18n, t } from '@shared/i18n/content';

// 初始化 i18n（模块加载时）
initContentI18n().catch(console.error);

interface Selection {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

let overlayHost: HTMLElement | null = null;

function getSelectionRect(sel: Selection): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  return {
    x: Math.min(sel.startX, sel.endX),
    y: Math.min(sel.startY, sel.endY),
    width: Math.abs(sel.endX - sel.startX),
    height: Math.abs(sel.endY - sel.startY),
  };
}

function getOverlayStyles(): string {
  return `
    :host {
      all: initial;
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    .cf-overlay {
      position: fixed;
      inset: 0;
      cursor: crosshair;
    }

    .cf-selection {
      position: fixed;
      border: ${REGION_CAPTURE.BORDER_WIDTH}px solid ${REGION_CAPTURE.BORDER_COLOR};
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, ${REGION_CAPTURE.OVERLAY_OPACITY});
      pointer-events: none;
      display: none;
    }

    .cf-corner {
      position: absolute;
      width: ${REGION_CAPTURE.CORNER_SIZE * 2}px;
      height: ${REGION_CAPTURE.CORNER_SIZE * 2}px;
      background: ${REGION_CAPTURE.BORDER_COLOR};
    }

    .cf-corner--tl { top: -${REGION_CAPTURE.CORNER_SIZE}px; left: -${REGION_CAPTURE.CORNER_SIZE}px; }
    .cf-corner--tr { top: -${REGION_CAPTURE.CORNER_SIZE}px; right: -${REGION_CAPTURE.CORNER_SIZE}px; }
    .cf-corner--bl { bottom: -${REGION_CAPTURE.CORNER_SIZE}px; left: -${REGION_CAPTURE.CORNER_SIZE}px; }
    .cf-corner--br { bottom: -${REGION_CAPTURE.CORNER_SIZE}px; right: -${REGION_CAPTURE.CORNER_SIZE}px; }

    .cf-label {
      position: fixed;
      bottom: -28px;
      left: 50%;
      transform: translateX(-50%);
      background: ${REGION_CAPTURE.LABEL_BG_COLOR};
      color: ${REGION_CAPTURE.LABEL_TEXT_COLOR};
      font-size: ${REGION_CAPTURE.LABEL_FONT_SIZE}px;
      padding: 2px 8px;
      white-space: nowrap;
      pointer-events: none;
      display: none;
    }

    .cf-hint {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: rgba(255, 255, 255, 0.6);
      font-size: 14px;
      pointer-events: none;
      transition: opacity 0.2s;
    }

    .cf-actions {
      position: fixed;
      display: flex;
      gap: 8px;
      pointer-events: auto;
      display: none;
    }

    .cf-btn {
      padding: 6px 16px;
      border: none;
      border-radius: 0;
      font-size: 12px;
      cursor: pointer;
      color: ${REGION_CAPTURE.LABEL_TEXT_COLOR};
    }

    .cf-btn--confirm {
      background: ${REGION_CAPTURE.BORDER_COLOR};
    }

    .cf-btn--confirm:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .cf-btn--cancel {
      background: ${REGION_CAPTURE.LABEL_BG_COLOR};
      border: 1px solid rgba(255, 255, 255, 0.15);
    }

    .cf-btn:hover:not(:disabled) {
      filter: brightness(1.15);
    }

    .cf-error-tip {
      position: fixed;
      top: -28px;
      left: 50%;
      transform: translateX(-50%);
      background: #EF4444;
      color: #fff;
      font-size: 12px;
      padding: 2px 8px;
      white-space: nowrap;
      pointer-events: none;
      display: none;
    }
  `;
}

function createOverlay(): ShadowRoot {
  destroyOverlay();

  const host = document.createElement('div');
  host.id = 'codeframe-overlay-host';
  document.documentElement.appendChild(host);

  const root = host.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = getOverlayStyles();
  root.appendChild(style);

  const container = document.createElement('div');
  container.className = 'cf-overlay';
  root.appendChild(container);

  // 选区（box-shadow 实现镂空遮罩）
  const selection = document.createElement('div');
  selection.className = 'cf-selection';
  selection.innerHTML = `
    <div class="cf-corner cf-corner--tl"></div>
    <div class="cf-corner cf-corner--tr"></div>
    <div class="cf-corner cf-corner--bl"></div>
    <div class="cf-corner cf-corner--br"></div>
    <div class="cf-label"></div>
    <div class="cf-error-tip"></div>
    <div class="cf-actions">
      <button class="cf-btn cf-btn--confirm">${t('confirmScreenshot')}</button>
      <button class="cf-btn cf-btn--cancel">${t('cancel')}</button>
    </div>
  `;
  container.appendChild(selection);

  // 提示
  const hint = document.createElement('div');
  hint.className = 'cf-hint';
  hint.textContent = t('dragToSelect');
  container.appendChild(hint);

  overlayHost = host;

  return root;
}

function destroyOverlay(): void {
  if (overlayHost) {
    overlayHost.remove();
    overlayHost = null;
  }
}

function updateSelectionUI(
  root: ShadowRoot,
  rect: { x: number; y: number; width: number; height: number },
  isTooSmall: boolean,
): void {
  const el = root.querySelector('.cf-selection') as HTMLElement;
  const label = root.querySelector('.cf-label') as HTMLElement;
  const errorTip = root.querySelector('.cf-error-tip') as HTMLElement;
  const actions = root.querySelector('.cf-actions') as HTMLElement;
  const confirmBtn = root.querySelector('.cf-btn--confirm') as HTMLButtonElement;
  const hint = root.querySelector('.cf-hint') as HTMLElement;

  el.style.left = `${rect.x}px`;
  el.style.top = `${rect.y}px`;
  el.style.width = `${rect.width}px`;
  el.style.height = `${rect.height}px`;
  el.style.display = 'block';

  hint.style.opacity = '0';

  // 尺寸标注
  const showLabel =
    rect.width > REGION_CAPTURE.LABEL_MIN_WIDTH ||
    rect.height > REGION_CAPTURE.LABEL_MIN_HEIGHT;
  label.style.display = showLabel ? 'block' : 'none';
  label.textContent = `${Math.round(rect.width)} x ${Math.round(rect.height)}`;

  // 太小提示
  errorTip.style.display = isTooSmall ? 'block' : 'none';
  errorTip.textContent = t('selectionTooSmall');

  // 操作按钮：上方空间不足时显示在选区内部
  if (rect.width > 0 && rect.height > 0) {
    actions.style.display = 'flex';
    const actionsEl = actions as HTMLElement;
    const buttonAreaHeight = 40;
    const topPos = rect.y - buttonAreaHeight > 4
      ? rect.y - buttonAreaHeight
      : rect.y + 4;
    actionsEl.style.top = `${topPos}px`;
    actionsEl.style.left = `${rect.x + rect.width}px`;
    actionsEl.style.transform = 'translateX(-100%)';
  }

  confirmBtn.disabled = isTooSmall;
}

function resetSelectionUI(root: ShadowRoot): void {
  const el = root.querySelector('.cf-selection') as HTMLElement;
  const actions = root.querySelector('.cf-actions') as HTMLElement;
  const hint = root.querySelector('.cf-hint') as HTMLElement;

  el.style.display = 'none';
  actions.style.display = 'none';
  hint.style.opacity = '1';
}

export function startRegionCapture(): void {
  const root = createOverlay();
  const overlay = root.querySelector('.cf-overlay') as HTMLElement;
  const confirmBtn = root.querySelector('.cf-btn--confirm');
  const cancelBtn = root.querySelector('.cf-btn--cancel');

  let isDragging = false;
  let selection: Selection = { startX: 0, startY: 0, endX: 0, endY: 0 };
  let hasDragged = false;

  const onMouseDown = (e: MouseEvent): void => {
    if ((e.target as HTMLElement).closest('.cf-btn')) return;

    isDragging = true;
    hasDragged = false;
    selection = { startX: e.clientX, startY: e.clientY, endX: e.clientX, endY: e.clientY };
    e.preventDefault();
  };

  const onMouseMove = (e: MouseEvent): void => {
    if (!isDragging) return;
    hasDragged = true;
    selection.endX = e.clientX;
    selection.endY = e.clientY;

    const rect = getSelectionRect(selection);
    const isTooSmall =
      rect.width < REGION_CAPTURE.MIN_SELECTION_SIZE ||
      rect.height < REGION_CAPTURE.MIN_SELECTION_SIZE;

    updateSelectionUI(root, rect, isTooSmall);
  };

  const onMouseUp = (): void => {
    if (!isDragging) return;
    isDragging = false;

    const rect = getSelectionRect(selection);
    const isTooSmall =
      rect.width < REGION_CAPTURE.MIN_SELECTION_SIZE ||
      rect.height < REGION_CAPTURE.MIN_SELECTION_SIZE;

    if (isTooSmall && hasDragged) {
      setTimeout(() => resetSelectionUI(root), 800);
    }
  };

  const onConfirm = (): void => {
    const rect = getSelectionRect(selection);
    const isTooSmall =
      rect.width < REGION_CAPTURE.MIN_SELECTION_SIZE ||
      rect.height < REGION_CAPTURE.MIN_SELECTION_SIZE;
    if (isTooSmall) return;

    cleanup();
    chrome.runtime.sendMessage(
      createMessage('CAPTURE_REGION', {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        dpr: window.devicePixelRatio,
      }),
    );
  };

  const onCancel = (): void => {
    cleanup();
    chrome.runtime.sendMessage(createMessage('CANCEL_CAPTURE', {}));
  };

  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  const cleanup = (): void => {
    overlay.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('keydown', onKeyDown);
    confirmBtn?.removeEventListener('click', onConfirm);
    cancelBtn?.removeEventListener('click', onCancel);
    destroyOverlay();
  };

  confirmBtn?.addEventListener('click', onConfirm);
  cancelBtn?.addEventListener('click', onCancel);

  overlay.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
  document.addEventListener('keydown', onKeyDown);
}
