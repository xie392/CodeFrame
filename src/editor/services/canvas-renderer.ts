/**
 * Canvas 渲染服务
 * 封装所有 Canvas 绑定的绘图函数
 */

import type {
  ArrowShape,
  RectShape,
  TextShape,
  MosaicShape,
  CropArea,
} from '../types';
import { HANDLE_RADIUS } from '../constants';

/**
 * Canvas 渲染器类
 */
export class CanvasRenderer {
  constructor(private ctx: CanvasRenderingContext2D) {}

  /**
   * 清除画布
   */
  clear(width: number, height: number): void {
    this.ctx.clearRect(0, 0, width, height);
  }

  /**
   * 绘制箭头
   */
  drawArrow(arrow: ArrowShape, isSelected: boolean = false): void {
    const { startX, startY, endX, endY, color, strokeWidth, headSize, style } =
      arrow;

    // 计算方向向量
    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length < 1) return;

    const unitX = dx / length;
    const unitY = dy / length;

    // 箭头头部角度（30度）
    const angle = Math.PI / 6;

    this.ctx.save();
    // 先绘制选中状态高亮（在箭头下方）
    if (isSelected) {
      this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
      this.ctx.lineWidth = strokeWidth + 4;
      this.ctx.lineCap = 'round';
      this.ctx.beginPath();
      this.ctx.moveTo(startX, startY);
      this.ctx.lineTo(endX, endY);
      this.ctx.stroke();
    }

    // 设置箭头样式
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = strokeWidth;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    // 主线：直接画到终点，V 形翼覆盖在主线上方，零空隙
    const arrowLength = headSize;

    if (style === 'double') {
      // 双箭头：主线连接两端箭头尖端
      this.ctx.beginPath();
      this.ctx.moveTo(startX, startY);
      this.ctx.lineTo(endX, endY);
      this.ctx.stroke();

      // 起点 V 形箭头
      this.ctx.beginPath();
      this.ctx.moveTo(
        startX + Math.cos(angle) * arrowLength * unitX + Math.sin(angle) * arrowLength * unitY,
        startY + Math.cos(angle) * arrowLength * unitY - Math.sin(angle) * arrowLength * unitX
      );
      this.ctx.lineTo(startX, startY);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(
        startX + Math.cos(angle) * arrowLength * unitX - Math.sin(angle) * arrowLength * unitY,
        startY + Math.cos(angle) * arrowLength * unitY + Math.sin(angle) * arrowLength * unitX
      );
      this.ctx.lineTo(startX, startY);
      this.ctx.stroke();
    } else {
      // 单箭头：主线到终点
      this.ctx.beginPath();
      this.ctx.moveTo(startX, startY);
      this.ctx.lineTo(endX, endY);
      this.ctx.stroke();
    }

    // 终点 V 形箭头头部—— 两条开放斜线，不填充
    this.ctx.beginPath();
    this.ctx.moveTo(
      endX - Math.cos(angle) * arrowLength * unitX + Math.sin(angle) * arrowLength * unitY,
      endY - Math.cos(angle) * arrowLength * unitY - Math.sin(angle) * arrowLength * unitX
    );
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(
      endX - Math.cos(angle) * arrowLength * unitX - Math.sin(angle) * arrowLength * unitY,
      endY - Math.cos(angle) * arrowLength * unitY + Math.sin(angle) * arrowLength * unitX
    );
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();

    this.ctx.restore();

    // 绘制选中状态的控制点
    if (isSelected) {
      this.drawHandle(startX, startY);
      this.drawHandle(endX, endY);
      // 中点控制点（仅当箭头足够长时显示）
      if (length >= HANDLE_RADIUS * 4) {
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        this.drawHandle(midX, midY);
      }
    }
  }

  /**
   * 绘制控制点
   */
  drawHandle(x: number, y: number, radius: number = HANDLE_RADIUS): void {
    this.ctx.save();
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.strokeStyle = 'rgba(59, 130, 246, 1)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.restore();
  }

  /**
   * 绘制矩形
   */
  drawRect(rect: RectShape, isSelected: boolean = false): void {
    const { x, y, width, height, color, strokeWidth, fillOpacity, borderStyle } =
      rect;

    this.ctx.save();

    // 绘制选中状态高亮
    if (isSelected) {
      this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
      this.ctx.lineWidth = strokeWidth + 4;
      this.ctx.strokeRect(x, y, width, height);
    }

    // 设置样式
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = strokeWidth;
    if (borderStyle === 'dashed') {
      this.ctx.setLineDash([8, 4]);
    }

    // 绘制填充（如果有透明度）
    if (fillOpacity > 0) {
      this.ctx.fillStyle = color;
      this.ctx.globalAlpha = fillOpacity / 100;
      this.ctx.fillRect(x, y, width, height);
      this.ctx.globalAlpha = 1;
    }

    // 绘制边框
    this.ctx.strokeRect(x, y, width, height);

    this.ctx.restore();

    // 绘制选中状态的控制点
    if (isSelected) {
      this.drawRectHandles(x, y, width, height);
    }
  }

  /**
   * 绘制矩形的控制点
   */
  drawRectHandles(x: number, y: number, w: number, h: number): void {
    // 四角
    this.drawHandle(x, y);
    this.drawHandle(x + w, y);
    this.drawHandle(x, y + h);
    this.drawHandle(x + w, y + h);
    // 四边中点（如果矩形足够大）
    if (w >= HANDLE_RADIUS * 4) {
      this.drawHandle(x + w / 2, y);
      this.drawHandle(x + w / 2, y + h);
    }
    if (h >= HANDLE_RADIUS * 4) {
      this.drawHandle(x, y + h / 2);
      this.drawHandle(x + w, y + h / 2);
    }
  }

  /**
   * 绘制文字
   */
  drawText(text: TextShape, isSelected: boolean = false): void {
    const { x, y, text: content, color, fontSize, fontWeight, fontStyle } = text;

    this.ctx.save();

    // 设置字体
    this.ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "JetBrains Mono", "IBM Plex Mono", monospace`;
    this.ctx.fillStyle = color;
    this.ctx.textBaseline = 'top';

    // 计算文字尺寸
    const metrics = this.ctx.measureText(content);
    const textWidth = metrics.width;
    const textHeight = fontSize;

    // 绘制选中状态高亮
    if (isSelected) {
      this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x - 4, y - 4, textWidth + 8, textHeight + 8);
    }

    // 绘制文字
    this.ctx.fillText(content, x, y);

    this.ctx.restore();

    // 绘制选中状态的控制点
    if (isSelected) {
      this.drawRectHandles(x - 4, y - 4, textWidth + 8, textHeight + 8);
    }
  }

  /**
   * 绘制马赛克
   */
  drawMosaic(
    mosaic: MosaicShape,
    imageCanvas: HTMLCanvasElement | null,
    isSelected: boolean = false
  ): void {
    const { x, y, width, height, blockSize, opacity } = mosaic;

    if (!imageCanvas || width <= 0 || height <= 0) return;

    this.ctx.save();

    // 绘制选中状态高亮
    if (isSelected) {
      this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
      this.ctx.lineWidth = 4;
      this.ctx.strokeRect(x, y, width, height);
    }

    // 设置透明度
    this.ctx.globalAlpha = opacity / 100;

    // 获取图片数据
    const imageData = imageCanvas
      .getContext('2d')
      ?.getImageData(
        Math.floor(x),
        Math.floor(y),
        Math.floor(width),
        Math.floor(height)
      );

    if (!imageData) {
      this.ctx.restore();
      return;
    }

    // 绘制马赛克效果
    const data = imageData.data;
    const cols = Math.ceil(width / blockSize);
    const rows = Math.ceil(height / blockSize);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const px = col * blockSize;
        const py = row * blockSize;
        const blockW = Math.min(blockSize, width - px);
        const blockH = Math.min(blockSize, height - py);

        // 计算块的平均颜色
        let r = 0,
          g = 0,
          b = 0,
          count = 0;
        for (let dy = 0; dy < blockH; dy++) {
          for (let dx = 0; dx < blockW; dx++) {
            const idx = ((py + dy) * Math.floor(width) + (px + dx)) * 4;
            if (idx < data.length) {
              r += data[idx];
              g += data[idx + 1];
              b += data[idx + 2];
              count++;
            }
          }
        }

        if (count > 0) {
          r = Math.floor(r / count);
          g = Math.floor(g / count);
          b = Math.floor(b / count);

          this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          this.ctx.fillRect(x + px, y + py, blockW, blockH);
        }
      }
    }

    this.ctx.restore();

    // 绘制选中状态的控制点
    if (isSelected) {
      this.drawRectHandles(x, y, width, height);
    }
  }

  /**
   * 绘制裁剪框
   */
  drawCropBox(
    crop: CropArea,
    imageWidth: number,
    imageHeight: number
  ): void {
    const { x, y, width, height } = crop;

    this.ctx.save();

    // 绘制半透明遮罩
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, imageWidth, imageHeight);

    // 清除裁剪区域的遮罩
    this.ctx.clearRect(x, y, width, height);

    // 绘制裁剪框边框
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([8, 4]);
    this.ctx.strokeRect(x, y, width, height);

    // 绘制网格线（三分线）
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([]);

    // 垂直三分线
    for (let i = 1; i < 3; i++) {
      const lineX = x + (width * i) / 3;
      this.ctx.beginPath();
      this.ctx.moveTo(lineX, y);
      this.ctx.lineTo(lineX, y + height);
      this.ctx.stroke();
    }

    // 水平三分线
    for (let i = 1; i < 3; i++) {
      const lineY = y + (height * i) / 3;
      this.ctx.beginPath();
      this.ctx.moveTo(x, lineY);
      this.ctx.lineTo(x + width, lineY);
      this.ctx.stroke();
    }

    this.ctx.restore();

    // 绘制控制点
    this.drawRectHandles(x, y, width, height);
  }

  /**
   * 绘制框选矩形
   */
  drawMarquee(
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): void {
    const x = Math.min(startX, endX);
    const y = Math.min(startY, endY);
    const w = Math.abs(endX - startX);
    const h = Math.abs(endY - startY);

    this.ctx.save();

    // 绘制半透明填充
    this.ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    this.ctx.fillRect(x, y, w, h);

    // 绘制边框
    this.ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, w, h);

    this.ctx.restore();
  }
}

/**
 * 创建 Canvas 渲染器实例
 */
export function createCanvasRenderer(ctx: CanvasRenderingContext2D): CanvasRenderer {
  return new CanvasRenderer(ctx);
}
