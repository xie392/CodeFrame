/**
 * 工具状态桥接
 * Store activeTool → Leafer 交互模式切换
 */

import type { ToolId } from '../../../types';

export class ToolBridge {
  private currentTool: ToolId = 'select';
  private backend: ToolBridgeBackend | null =
    null;

  /** 绑定后端实例 */
  setBackend(backend: ToolBridgeBackend): void {
    this.backend = backend;
  }

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
    if (!this.backend) return;

    const editor = this.backend.getEditor();
    if (!editor) return;

    const ed = editor as {
      editable: boolean;
      cancel: () => void;
    };

    const drawingTools: ToolId[] = [
      'arrow',
      'rect',
      'text',
      'mosaic',
    ];

    if (this.currentTool === 'select') {
      // 选中模式：启用 Editor
      ed.editable = true;
    } else if (this.currentTool === 'move') {
      // 移动模式：禁用 Editor，
      // Viewport 插件自动处理平移
      ed.editable = false;
      ed.cancel();
    } else if (
      drawingTools.includes(this.currentTool)
    ) {
      // 绘制模式：禁用 Editor
      ed.editable = false;
      ed.cancel();
    } else if (this.currentTool === 'crop') {
      // 裁剪模式：禁用 Editor
      ed.editable = false;
      ed.cancel();
    }
  }
}

/** 后端接口（仅暴露 ToolBridge 需要的方法）*/
export interface ToolBridgeBackend {
  getEditor(): unknown | null;
}
