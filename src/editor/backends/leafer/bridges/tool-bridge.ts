/**
 * 工具状态桥接
 * Store activeTool → Leafer 交互模式切换
 */

import type { ToolId } from '../../../types';

export class ToolBridge {
  private currentTool: ToolId = 'select';

  /** 更新当前工具 */
  setTool(tool: ToolId): void {
    this.currentTool = tool;
    this.applyToolMode();
  }

  /** 获取当前工具 */
  getTool(): ToolId {
    return this.currentTool;
  }

  /** 根据工具设置 Leafer 交互模式 */
  private applyToolMode(): void {
    // Phase 1 中实现：
    // select → 启用 Editor 选中
    // move → 启用 Viewport 平移
    // arrow/rect/text/mosaic → 禁用 Editor，
    //   启用绘制交互
    // crop → 禁用 Editor，启用裁剪交互
  }
}
