/**
 * 文字绘制策略
 * 单击放置文字，无拖拽过程
 */

import type { ShapeType } from '../../types';
import type { IDrawingStrategy, DrawingContext, ImageCoord } from './types';

interface TextStyle {
  color: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
}

export class TextDrawingStrategy implements IDrawingStrategy {
  readonly shapeType: ShapeType = 'text';

  /** 文字没有拖拽过程，onStart 即完成 */
  onStart(ctx: DrawingContext, coord: ImageCoord): void {
    const styles = ctx.getStyles().text as TextStyle;

    ctx.onCreated('text', {
      x: coord.x,
      y: coord.y,
      text: 'Text',
      color: styles.color,
      fontSize: styles.fontSize,
      fontWeight: styles.fontWeight,
      fontStyle: styles.fontStyle,
    });
  }

  onMove(): void {
    // 文字无拖拽
  }

  onEnd(): void {
    // 文字在 onStart 时已完成
  }

  isActive(): boolean {
    return false; // 文字没有持续绘制状态
  }

  cancel(): void {
    // 无状态需要清理
  }
}
