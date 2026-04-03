/**
 * 图像处理共享工具模块
 * 提供 base64 解码、图像缩放等功能
 */

/**
 * 将 dataURL 转换为 ImageBitmap
 * 包含安全的 base64 解码错误处理
 */
export async function dataUrlToBitmap(dataUrl: string): Promise<ImageBitmap> {
  const base64 = dataUrl.split(',')[1];
  if (!base64) {
    throw new Error('无效的 data URL');
  }

  let binaryStr: string;
  try {
    binaryStr = atob(base64);
  } catch {
    throw new Error('无效的 base64 数据');
  }

  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }

  return createImageBitmap(new Blob([bytes], { type: 'image/png' }));
}

/**
 * 将 Blob 转换为 dataURL
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('无法读取 Blob 数据'));
      }
    };
    reader.onerror = () => reject(new Error('FileReader 读取失败'));
    reader.readAsDataURL(blob);
  });
}

/**
 * 将图片缩放到指定倍数
 * 使用 try-finally 确保 ImageBitmap 资源正确释放
 */
export async function scaleImage(
  dataUrl: string,
  scale: number,
): Promise<string> {
  if (scale === 1) return dataUrl;

  const imageBitmap = await dataUrlToBitmap(dataUrl);

  try {
    const newWidth = Math.round(imageBitmap.width * scale);
    const newHeight = Math.round(imageBitmap.height * scale);
    const offscreen = new OffscreenCanvas(newWidth, newHeight);
    const ctx = offscreen.getContext('2d');

    if (!ctx) {
      throw new Error('无法获取 OffscreenCanvas 2D 上下文');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(imageBitmap, 0, 0, newWidth, newHeight);

    const blob = await offscreen.convertToBlob({ type: 'image/png' });
    return blobToDataUrl(blob);
  } finally {
    imageBitmap.close();
  }
}

/**
 * 受限页面 URL 前缀
 */
const RESTRICTED_URL_PREFIXES = [
  'chrome://',
  'chrome-extension://',
  'about:',
  'devtools://',
  'edge://',
  'brave://',
] as const;

/**
 * 检查是否为受限 URL
 */
export function isRestrictedUrl(url?: string): boolean {
  if (!url) return true;
  return RESTRICTED_URL_PREFIXES.some((prefix) => url.startsWith(prefix));
}
