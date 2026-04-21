/**
 * 马赛克自定义滤镜
 * 通过 Filter.register 注册，
 * apply() 中获取 currentCanvas.view（HTMLCanvasElement），
 * 使用 getImageData 做像素块平均色计算
 */

import { Filter } from 'leafer-ui';
import '@leafer-in/filter';

Filter.register('mosaic', {
  apply(
    filter: Record<string, unknown>,
    _ui: unknown,
    _bounds: unknown,
    currentCanvas: {
      view: unknown;
      pixelRatio?: number;
    },
    _originCanvas: unknown,
    _shape: unknown,
  ): void {
    const canvas = currentCanvas.view as
      | HTMLCanvasElement
      | undefined;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const logicalBlockSize =
      (filter.blockSize as number) ?? 10;
    const pixelRatio =
      currentCanvas.pixelRatio ?? 1;
    const blockSize = Math.max(
      1,
      Math.round(logicalBlockSize * pixelRatio),
    );

    const w = canvas.width;
    const h = canvas.height;
    if (w <= 0 || h <= 0) return;

    const imageData = ctx.getImageData(
      0,
      0,
      w,
      h,
    );
    const data = imageData.data;

    const cols = Math.ceil(w / blockSize);
    const rows = Math.ceil(h / blockSize);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const px = col * blockSize;
        const py = row * blockSize;
        const bw = Math.min(
          blockSize,
          w - px,
        );
        const bh = Math.min(
          blockSize,
          h - py,
        );

        let r = 0;
        let g = 0;
        let b = 0;
        let a = 0;
        let count = 0;

        for (let dy = 0; dy < bh; dy++) {
          for (let dx = 0; dx < bw; dx++) {
            const idx =
              ((py + dy) * w + (px + dx)) * 4;
            if (
              idx >= 0 &&
              idx + 3 < data.length
            ) {
              r += data[idx];
              g += data[idx + 1];
              b += data[idx + 2];
              a += data[idx + 3];
              count++;
            }
          }
        }

        if (count > 0) {
          r = Math.floor(r / count);
          g = Math.floor(g / count);
          b = Math.floor(b / count);
          a = Math.floor(a / count);
          ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
          ctx.fillRect(px, py, bw, bh);
        }
      }
    }
  },

  getSpread(): number {
    return 0;
  },
});
