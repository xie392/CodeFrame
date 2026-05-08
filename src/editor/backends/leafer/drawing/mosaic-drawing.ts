/**
 * 马赛克绘制策略
 * 拖拽绘制马赛克区域，临时元素使用半透明灰色 Rect 预览
 */

import { Rect } from 'leafer-ui';
import type { ShapeType } from '../../types';
import type { IDrawingStrategy, DrawingContext, ImageCoord } from './types';
import { DRAW_MIN_DISTANCE } from '../../../constants';

interface MosaicStyle {
  blockSize: number;
  opacity: number;
}

export class MosaicDrawingStrategy implements IDrawingStrategy {
  readonly shapeType: ShapeType = 'mosaic';

  private startCoord: ImageCoord | null = null;
  private tempElement: Rect | null = null;

  onStart(ctx: DrawingContext, coord: ImageCoord): void {
    this.startCoord = coord;

    // 马赛克预览用半透明灰色 Rect
    this.tempElement = new Rect({
      x: coord.x,
      y: coord.y,
      width: 0,
      height: 0,
      fill: 'rgba(128,128,128,0.4)',
      stroke: 'rgba(128,128,128,0.8)',
      strokeWidth: 1,
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

    this.tempElement.remove();
    this.tempElement = null;

    // 验证最小尺寸
    if (width < DRAW_MIN_DISTANCE || height < DRAW_MIN_DISTANCE) {
      this.startCoord = null;
      return;
    }

    const styles = ctx.getStyles().mosaic as MosaicStyle;

    ctx.onCreated('mosaic', {
      x,
      y,
      width,
      height,
      blockSize: styles.blockSize,
      opacity: styles.opacity,
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
