/**
 * 矩形绘制策略
 * 拖拽绘制矩形，临时元素使用半透明预览
 */

import { Rect } from 'leafer-ui';
import type { ShapeType } from '../../types';
import type { IDrawingStrategy, DrawingContext, ImageCoord } from './types';
import { hexToRgba } from '../utils/color';
import { DRAW_MIN_DISTANCE } from '../../../constants';

interface RectStyle {
  color: string;
  strokeWidth: number;
  fillOpacity: number;
  borderStyle: 'solid' | 'dashed';
}

export class RectDrawingStrategy implements IDrawingStrategy {
  readonly shapeType: ShapeType = 'rect';

  private startCoord: ImageCoord | null = null;
  private tempElement: Rect | null = null;

  onStart(ctx: DrawingContext, coord: ImageCoord): void {
    this.startCoord = coord;
    const styles = ctx.getStyles().rect as RectStyle;

    this.tempElement = new Rect({
      x: coord.x,
      y: coord.y,
      width: 0,
      height: 0,
      stroke: styles.color,
      strokeWidth: styles.strokeWidth,
      dashPattern: styles.borderStyle === 'dashed' ? [8, 4] : undefined,
      fill: styles.fillOpacity > 0 ? hexToRgba(styles.color, styles.fillOpacity / 100) : undefined,
      opacity: 0.6,
    });

    ctx.addTempElement(this.tempElement);
  }

  onMove(_ctx: DrawingContext, coord: ImageCoord): void {
    if (!this.startCoord || !this.tempElement) return;

    this.tempElement.set({
      x: Math.min(this.startCoord.x, coord.x),
      y: Math.min(this.startCoord.y, coord.y),
      width: Math.abs(coord.x - this.startCoord.x),
      height: Math.abs(coord.y - this.startCoord.y),
    });
  }

  onEnd(ctx: DrawingContext): void {
    if (!this.startCoord || !this.tempElement) {
      this.cancel();
      return;
    }

    const x = this.tempElement.x ?? 0;
    const y = this.tempElement.y ?? 0;
    const width = this.tempElement.width ?? 0;
    const height = this.tempElement.height ?? 0;

    // 先读取再移除
    this.tempElement.remove();
    this.tempElement = null;

    // 验证最小尺寸
    if (width < DRAW_MIN_DISTANCE || height < DRAW_MIN_DISTANCE) {
      this.startCoord = null;
      return;
    }

    const styles = ctx.getStyles().rect as RectStyle;

    ctx.onCreated('rect', {
      x,
      y,
      width,
      height,
      color: styles.color,
      strokeWidth: styles.strokeWidth,
      fillOpacity: styles.fillOpacity,
      borderStyle: styles.borderStyle,
    });

    this.startCoord = null;
  }

  isActive(): boolean {
    return this.startCoord !== null;
  }

  cancel(): void {
    if (this.tempElement) {
      this.tempElement.remove();
      this.tempElement = null;
    }
    this.startCoord = null;
  }
}
