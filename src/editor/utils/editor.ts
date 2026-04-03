/**
 * Editor 工具函数
 */

/**
 * 解析来源参数
 */
export function parseSource(): 'capture' | 'upload' | null {
  const params = new URLSearchParams(window.location.search);
  const source = params.get('source');
  if (source === 'capture' || source === 'upload') return source;
  return 'upload'; // 默认空画布模式
}

/**
 * 读取文件为 Data URL
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 解析比例字符串，返回宽高比
 */
export function parseAspectRatio(
  ratio: string,
  customRatio?: { width: number; height: number }
): number | null {
  if (ratio === 'auto' || ratio === 'original') return null;

  // 自定义比例
  if (ratio === 'custom' && customRatio) {
    if (customRatio.width > 0 && customRatio.height > 0) {
      return customRatio.width / customRatio.height;
    }
    return null;
  }

  // 设备比例（带 device: 前缀）
  let ratioValue = ratio;
  if (ratio.startsWith('device:')) {
    ratioValue = ratio.substring(7); // 移除 'device:' 前缀
  }

  // 支持 "W:H" 格式，如 "16:9", "4:3", "1.91:1"
  const parts = ratioValue.split(':');
  if (parts.length === 2) {
    const w = parseFloat(parts[0]);
    const h = parseFloat(parts[1]);
    if (w > 0 && h > 0) {
      return w / h;
    }
  }
  return null;
}

/**
 * 根据比例计算容器尺寸
 */
export function calculateAspectRatioSize(
  aspectRatio: string,
  imageWidth: number,
  imageHeight: number,
  customRatio?: { width: number; height: number }
): { width: number; height: number } {
  const ratio = parseAspectRatio(aspectRatio, customRatio);
  if (!ratio) {
    // auto 或 original，使用图片原始尺寸
    return { width: imageWidth, height: imageHeight };
  }

  // 根据比例计算容器尺寸
  // 策略：以图片较大边为基准，按比例计算容器尺寸
  const imageRatio = imageWidth / imageHeight;

  if (imageRatio > ratio) {
    // 图片更宽，以宽度为基准
    return {
      width: imageWidth,
      height: imageWidth / ratio,
    };
  } else {
    // 图片更高，以高度为基准
    return {
      width: imageHeight * ratio,
      height: imageHeight,
    };
  }
}

/**
 * 生成唯一 ID
 */
let arrowIdCounter = 0;
let rectIdCounter = 0;
let textIdCounter = 0;
let mosaicIdCounter = 0;

export function generateArrowId(): string {
  return `arrow_${Date.now()}_${++arrowIdCounter}`;
}

export function generateRectId(): string {
  return `rect_${Date.now()}_${++rectIdCounter}`;
}

export function generateTextId(): string {
  return `text_${Date.now()}_${++textIdCounter}`;
}

export function generateMosaicId(): string {
  return `mosaic_${Date.now()}_${++mosaicIdCounter}`;
}

/**
 * 根据背景设置生成 CSS 背景样式
 */
export function getBackgroundStyle(bg: {
  type: 'solid' | 'linear' | 'radial';
  color: string;
  gradientColors: [string, string];
  gradientAngle: number;
}): React.CSSProperties {
  if (bg.type === 'solid') {
    if (bg.color === 'transparent') {
      // 透明背景：显示棋盘格图案
      return {
        background:
          'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
        backgroundSize: '16px 16px',
        backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
        backgroundColor: '#fff',
      };
    }
    return { backgroundColor: bg.color };
  }
  if (bg.type === 'linear') {
    return {
      background: `linear-gradient(${bg.gradientAngle}deg, ${bg.gradientColors[0]}, ${bg.gradientColors[1]})`,
    };
  }
  if (bg.type === 'radial') {
    return {
      background: `radial-gradient(circle, ${bg.gradientColors[0]}, ${bg.gradientColors[1]})`,
    };
  }
  return {};
}

/**
 * 根据背景颜色计算水印颜色（自动适配）
 */
export function getWatermarkColor(bg: {
  type: 'solid' | 'linear' | 'radial';
  color: string;
  gradientColors: [string, string];
}): string {
  let r = 0,
    g = 0,
    b = 0;

  if (bg.type === 'solid' && bg.color !== 'transparent') {
    // 解析纯色
    const hex = bg.color.replace('#', '');
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else if (bg.type === 'linear' || bg.type === 'radial') {
    // 取渐变色的平均值
    const c1 = bg.gradientColors[0].replace('#', '');
    const c2 = bg.gradientColors[1].replace('#', '');
    const r1 = parseInt(c1.substring(0, 2), 16);
    const g1 = parseInt(c1.substring(2, 4), 16);
    const b1 = parseInt(c1.substring(4, 6), 16);
    const r2 = parseInt(c2.substring(0, 2), 16);
    const g2 = parseInt(c2.substring(2, 4), 16);
    const b2 = parseInt(c2.substring(4, 6), 16);
    r = (r1 + r2) / 2;
    g = (g1 + g2) / 2;
    b = (b1 + b2) / 2;
  }

  // 计算亮度
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

  // 深色背景用白色，浅色背景用黑色
  return luminance < 128
    ? 'rgba(255, 255, 255, 0.9)'
    : 'rgba(0, 0, 0, 0.7)';
}
