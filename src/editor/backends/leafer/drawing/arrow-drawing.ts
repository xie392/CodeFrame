/**
 * 箭头绘制策略
 * 拖拽绘制箭头，临时元素使用半透明预览
 */

import { Arrow } from '@leafer-in/arrow';
import type { ShapeType } from '../../types';
import type { IDrawingStrategy, DrawingContext, ImageCoord } from './types';
import { DRAW_MIN_DISTANCE } from '../../../constants';

interface ArrowStyle {
  color: string;
  strokeWidth: number;
  headSize: number;
  style: 'single' | 'double';
}

const HEAD_SIZE_BASE = 12;

export class ArrowDrawingStrategy implements IDrawingStrategy {
  readonly shapeType: ShapeType = 'arrow';

  private startCoord: ImageCoord | null = null;
  private tempElement: Arrow | null = null;

  onStart(ctx: DrawingContext, coord: ImageCoord): void {
    this.startCoord = coord;
    const styles = ctx.getStyles().arrow as ArrowStyle;
    const scale = styles.headSize / HEAD_SIZE_BASE;

    this.tempElement = new Arrow({
      points: [coord.x, coord.y, coord.x, coord.y],
      stroke: styles.color,
      strokeWidth: styles.strokeWidth,
      endArrow: { type: 'angle', scale },
      startArrow: styles.style === 'double' ? { type: 'angle', scale } : undefined,
      hitStroke: 'all',
      opacity: 0.6,
    });

    ctx.addTempElement(this.tempElement);
  }

  onMove(_ctx: DrawingContext, coord: ImageCoord): void {
    if (!this.startCoord || !this.tempElement) return;

    this.tempElement.set({
      points: [this.startCoord.x, this.startCoord.y, coord.x, coord.y],
    });
  }

  onEnd(ctx: DrawingContext): void {
    if (!this.startCoord || !this.tempElement) {
      this.cancel();
      return;
    }

    // 先读取坐标再移除
    const temp = this.tempElement as unknown as {
      x: number;
      y: number;
      points?: number[];
    };
    const ox = temp.x ?? 0;
    const oy = temp.y ?? 0;
    const pts = temp.points ?? [0, 0, 0, 0];

    this.tempElement.remove();
    this.tempElement = null;

    const startX = (pts[0] ?? 0) + ox;
    const startY = (pts[1] ?? 0) + oy;
    const endX = (pts[2] ?? 0) + ox;
    const endY = (pts[3] ?? 0) + oy;

    // 验证最小距离
    const dx = endX - startX;
    const dy = endY - startY;
    if (Math.sqrt(dx * dx + dy * dy) < DRAW_MIN_DISTANCE) {
      this.startCoord = null;
      return;
    }

    const styles = ctx.getStyles().arrow as ArrowStyle;

    ctx.onCreated('arrow', {
      startX,
      startY,
      endX,
      endY,
      color: styles.color,
      strokeWidth: styles.strokeWidth,
      headSize: styles.headSize,
      style: styles.style,
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
