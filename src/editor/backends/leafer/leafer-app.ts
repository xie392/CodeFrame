/**
 * Leafer App 生命周期管理
 * 纯 Leafer 渲染：帧背景+图片+标注+水印
 */

import {
  App,
  Box,
  Rect,
  Text,
  Image as LeaferImage,
} from 'leafer-ui';
import '@leafer-in/editor';
import '@leafer-in/resize';
import '@leafer-in/viewport';
import '@leafer-in/arrow';
import type { ImageFrameSettings } from '../../types';
import {
  calculateAspectRatioSize,
} from '../../utils/editor';

// ---- 类型 ----

export interface LeaferAppResult {
  app: App;
  /** 帧容器组（帧背景+图片+标注+水印） */
  frameGroup: Box;
  /** 帧背景 Rect */
  frameBgRect: Rect;
  /** 图片裁剪容器（圆角+阴影） */
  imageClipBox: Box;
  /** 图片 Leafer Image 元素 */
  imageElement: LeaferImage;
  /** 标注容器 */
  annotationBox: Box;
  /** 水印元素（Text 或 LeaferImage） */
  watermarkElement: Text | LeaferImage | null;
}

/** 帧布局计算结果 */
interface FrameLayout {
  frameW: number;
  frameH: number;
  imageX: number;
  imageY: number;
}

// ---- 棋盘格背景 ----

const CHECKER_SIZE = 8;
const CHECKER_COLOR_A = '#ffffff';
const CHECKER_COLOR_B = '#cccccc';

function createCheckerboardUrl(): string {
  const size = CHECKER_SIZE * 2;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  ctx.fillStyle = CHECKER_COLOR_A;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = CHECKER_COLOR_B;
  ctx.fillRect(0, 0, CHECKER_SIZE, CHECKER_SIZE);
  ctx.fillRect(
    CHECKER_SIZE,
    CHECKER_SIZE,
    CHECKER_SIZE,
    CHECKER_SIZE
  );
  return c.toDataURL();
}

let checkerboardUrlCache: string | null = null;

function getCheckerboardUrl(): string {
  if (!checkerboardUrlCache) {
    checkerboardUrlCache = createCheckerboardUrl();
  }
  return checkerboardUrlCache;
}

// ---- 帧布局计算 ----

function calculateFrameLayout(
  imageWidth: number,
  imageHeight: number,
  settings: ImageFrameSettings
): FrameLayout {
  const pad = settings.padding;
  const padL = pad.linked ? pad.top : pad.left;
  const padT = pad.top;
  const padR = pad.linked ? pad.top : pad.right;
  const padB = pad.linked ? pad.top : pad.bottom;

  const isAuto =
    settings.aspectRatio === 'auto' ||
    settings.aspectRatio === 'original';

  if (isAuto) {
    return {
      frameW: imageWidth + padL + padR,
      frameH: imageHeight + padT + padB,
      imageX: padL,
      imageY: padT,
    };
  }

  const containerSize = calculateAspectRatioSize(
    settings.aspectRatio,
    imageWidth,
    imageHeight,
    settings.customAspectRatio
  );

  const imageX =
    padL +
    (containerSize.width -
      padL -
      padR -
      imageWidth) /
      2;
  const imageY =
    padT +
    (containerSize.height -
      padT -
      padB -
      imageHeight) /
      2;

  return {
    frameW: containerSize.width,
    frameH: containerSize.height,
    imageX,
    imageY,
  };
}

// ---- 帧样式转换 ----

function toCornerRadius(
  radius: ImageFrameSettings['borderRadius']
): number | number[] {
  const { topLeft, topRight, bottomRight, bottomLeft } =
    radius;
  if (
    topLeft === topRight &&
    topRight === bottomRight &&
    bottomRight === bottomLeft
  ) {
    return topLeft;
  }
  return [
    topLeft,
    topRight,
    bottomRight,
    bottomLeft,
  ];
}

function toFrameFill(
  background: ImageFrameSettings['background'],
  frameW: number,
  frameH: number
): unknown {
  if (
    background.type === 'solid' &&
    background.color === 'transparent'
  ) {
    return undefined;
  }

  if (background.type === 'solid') {
    return background.color;
  }

  const [c0, c1] = background.gradientColors;
  const angle = background.gradientAngle;

  if (background.type === 'linear') {
    const rad = (angle * Math.PI) / 180;
    const cx = frameW / 2;
    const cy = frameH / 2;
    const len =
      Math.max(frameW, frameH) / 2;
    return {
      type: 'linear' as const,
      from: {
        x: cx - Math.cos(rad) * len,
        y: cy - Math.sin(rad) * len,
      },
      to: {
        x: cx + Math.cos(rad) * len,
        y: cy + Math.sin(rad) * len,
      },
      stops: [
        { offset: 0, color: c0 },
        { offset: 1, color: c1 },
      ],
    };
  }

  // radial
  return {
    type: 'radial' as const,
    from: {
      x: frameW / 2,
      y: frameH / 2,
      radius: 0,
    },
    to: {
      x: frameW / 2,
      y: frameH / 2,
      radius: Math.max(frameW, frameH) / 2,
    },
    stops: [
      { offset: 0, color: c0 },
      { offset: 1, color: c1 },
    ],
  };
}

function toShadow(
  shadow: ImageFrameSettings['shadow']
):
  | {
      x: number;
      y: number;
      blur: number;
      color: string;
    }
  | undefined {
  if (!shadow.enabled) return undefined;
  return {
    x: shadow.offsetX,
    y: shadow.offsetY,
    blur: shadow.blur,
    color: shadow.color + '40',
  };
}

function toImageShadow(
  shadow: ImageFrameSettings['imageShadow']
):
  | {
      x: number;
      y: number;
      blur: number;
      color: string;
    }
  | undefined {
  if (!shadow.enabled) return undefined;
  return {
    x: shadow.offsetX,
    y: shadow.offsetY,
    blur: shadow.blur,
    color: shadow.color + '40',
  };
}

/** 水印颜色自动适配 */
function getWatermarkColor(
  background: ImageFrameSettings['background']
): string {
  let r = 0;
  let g = 0;
  let b = 0;

  if (background.type === 'solid') {
    if (background.color === 'transparent') {
      return 'rgba(0,0,0,0.7)';
    }
    const hex = background.color.replace('#', '');
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else {
    const [c0, c1] = background.gradientColors;
    const h0 = c0.replace('#', '');
    const h1 = c1.replace('#', '');
    r =
      (parseInt(h0.substring(0, 2), 16) +
        parseInt(h1.substring(0, 2), 16)) /
      2;
    g =
      (parseInt(h0.substring(2, 4), 16) +
        parseInt(h1.substring(2, 4), 16)) /
      2;
    b =
      (parseInt(h0.substring(4, 6), 16) +
        parseInt(h1.substring(4, 6), 16)) /
      2;
  }

  const luminance =
    0.299 * r + 0.587 * g + 0.114 * b;
  return luminance < 128
    ? 'rgba(255,255,255,0.9)'
    : 'rgba(0,0,0,0.7)';
}

function getWatermarkPos(
  position: string,
  frameW: number,
  frameH: number,
  pad: ImageFrameSettings['padding'],
  wmW: number,
  wmH: number
): { x: number; y: number } {
  const margin = 8;
  const padL = pad.linked ? pad.top : pad.left;
  const padR = pad.linked ? pad.top : pad.right;
  const padT = pad.top;
  const padB = pad.linked ? pad.top : pad.bottom;

  switch (position) {
    case 'top-left':
      return {
        x: padL + margin,
        y: padT + margin,
      };
    case 'top-right':
      return {
        x: frameW - padR - margin - wmW,
        y: padT + margin,
      };
    case 'bottom-left':
      return {
        x: padL + margin,
        y: frameH - padB - margin - wmH,
      };
    default: // bottom-right
      return {
        x: frameW - padR - margin - wmW,
        y: frameH - padB - margin - wmH,
      };
  }
}

// ---- 创建/销毁/更新 ----

/** 创建 Leafer App 实例（含帧结构） */
export function createLeaferApp(
  container: HTMLElement,
  imageWidth: number,
  imageHeight: number,
  settings: ImageFrameSettings,
  imageUrl: string
): LeaferAppResult {
  const app = new App({
    view: container,
    editor: {},
  });

  const layout = calculateFrameLayout(
    imageWidth,
    imageHeight,
    settings
  );

  // ---- 帧容器组 ----
  const frameGroup = new Box({
    width: layout.frameW,
    height: layout.frameH,
    overflow: 'hide',
    cornerRadius: toCornerRadius(
      settings.borderRadius
    ),
    shadow: toShadow(settings.shadow),
  });

  // ---- 帧背景 ----
  const frameBgRect = new Rect({
    width: layout.frameW,
    height: layout.frameH,
    fill: toFrameFill(
      settings.background,
      layout.frameW,
      layout.frameH
    ),
    cornerRadius: toCornerRadius(
      settings.borderRadius
    ),
  });

  // 透明背景棋盘格
  if (
    settings.background.type === 'solid' &&
    settings.background.color === 'transparent'
  ) {
    frameBgRect.fill = getCheckerboardUrl();
  }

  // ---- 图片裁剪容器 ----
  const imageClipBox = new Box({
    x: layout.imageX,
    y: layout.imageY,
    width: imageWidth,
    height: imageHeight,
    overflow: 'hide',
    cornerRadius: toCornerRadius(
      settings.imageRadius
    ),
    shadow: toImageShadow(settings.imageShadow),
  });

  // ---- 图片元素 ----
  const imageElement = new LeaferImage({
    width: imageWidth,
    height: imageHeight,
    url: imageUrl,
  });

  imageClipBox.add(imageElement);

  // ---- 标注容器 ----
  const annotationBox = new Box({
    x: layout.imageX,
    y: layout.imageY,
    width: imageWidth,
    height: imageHeight,
    overflow: 'hide',
    hitFill: 'all',
  });

  // ---- 水印 ----
  let watermarkElement: Text | LeaferImage | null =
    null;
  if (settings.watermark.enabled) {
    watermarkElement = createWatermark(
      settings,
      layout.frameW,
      layout.frameH
    );
  }

  // ---- 组装层级 ----
  frameGroup.add(frameBgRect);
  frameGroup.add(imageClipBox);
  frameGroup.add(annotationBox);
  if (watermarkElement) {
    frameGroup.add(watermarkElement);
  }

  app.tree.add(frameGroup);

  return {
    app,
    frameGroup,
    frameBgRect,
    imageClipBox,
    imageElement,
    annotationBox,
    watermarkElement,
  };
}

function createWatermark(
  settings: ImageFrameSettings,
  frameW: number,
  frameH: number
): Text | LeaferImage {
  const wm = settings.watermark;
  const opacity = wm.opacity / 100;
  const color = getWatermarkColor(
    settings.background
  );

  if (wm.imageUrl) {
    const pos = getWatermarkPos(
      wm.position,
      frameW,
      frameH,
      settings.padding,
      wm.imageSize,
      wm.imageSize
    );
    return new LeaferImage({
      x: pos.x,
      y: pos.y,
      width: wm.imageSize,
      height: wm.imageSize,
      url: wm.imageUrl,
      opacity,
    });
  }

  // 文字水印
  const text = wm.text || 'Watermark';
  const fontSize = wm.fontSize;
  const estimatedW = text.length * fontSize * 0.6;
  const estimatedH = fontSize * 1.4;
  const pos = getWatermarkPos(
    wm.position,
    frameW,
    frameH,
    settings.padding,
    estimatedW,
    estimatedH
  );

  return new Text({
    x: pos.x,
    y: pos.y,
    text,
    fontSize,
    fontFamily:
      'JetBrains Mono, IBM Plex Mono, monospace',
    fill: color,
    opacity,
  });
}

/** 销毁 Leafer App 实例 */
export function destroyLeaferApp(app: App): void {
  app.destroy();
}

/** 处理容器 resize */
export function resizeLeaferApp(
  app: App,
  width: number,
  height: number
): void {
  app.resize({ width, height });
}

// ---- 帧元素更新函数 ----

/** 更新帧布局（边距/宽高比变化时） */
export function updateFrameLayout(
  result: LeaferAppResult,
  imageWidth: number,
  imageHeight: number,
  settings: ImageFrameSettings
): void {
  const layout = calculateFrameLayout(
    imageWidth,
    imageHeight,
    settings
  );

  result.frameGroup.width = layout.frameW;
  result.frameGroup.height = layout.frameH;
  result.frameGroup.cornerRadius =
    toCornerRadius(settings.borderRadius);
  result.frameGroup.shadow = toShadow(
    settings.shadow
  );

  result.frameBgRect.width = layout.frameW;
  result.frameBgRect.height = layout.frameH;
  result.frameBgRect.fill = toFrameFill(
    settings.background,
    layout.frameW,
    layout.frameH
  ) as typeof result.frameBgRect.fill;
  result.frameBgRect.cornerRadius =
    toCornerRadius(settings.borderRadius);

  // 透明背景棋盘格
  if (
    settings.background.type === 'solid' &&
    settings.background.color === 'transparent'
  ) {
    result.frameBgRect.fill = getCheckerboardUrl();
  }

  result.imageClipBox.x = layout.imageX;
  result.imageClipBox.y = layout.imageY;
  result.imageClipBox.width = imageWidth;
  result.imageClipBox.height = imageHeight;
  result.imageClipBox.cornerRadius =
    toCornerRadius(settings.imageRadius);
  result.imageClipBox.shadow = toImageShadow(
    settings.imageShadow
  );

  result.annotationBox.x = layout.imageX;
  result.annotationBox.y = layout.imageY;
  result.annotationBox.width = imageWidth;
  result.annotationBox.height = imageHeight;

  updateWatermark(
    result,
    settings,
    layout.frameW,
    layout.frameH
  );
}

/** 更新水印 */
export function updateWatermark(
  result: LeaferAppResult,
  settings: ImageFrameSettings,
  frameW: number,
  frameH: number
): void {
  // 移除旧水印
  if (result.watermarkElement) {
    result.watermarkElement.remove();
    result.watermarkElement = null;
  }

  if (!settings.watermark.enabled) return;

  result.watermarkElement = createWatermark(
    settings,
    frameW,
    frameH
  );
  result.frameGroup.add(result.watermarkElement);
}

/** 更新图片 URL */
export function updateImageUrl(
  imageElement: LeaferImage,
  url: string
): void {
  imageElement.url = url;
}

/** 计算视口居中偏移（帧在容器中居中显示） */
export function calculateCenterOffset(
  containerW: number,
  containerH: number,
  frameW: number,
  frameH: number
): { x: number; y: number } {
  return {
    x: (containerW - frameW) / 2,
    y: (containerH - frameH) / 2,
  };
}
