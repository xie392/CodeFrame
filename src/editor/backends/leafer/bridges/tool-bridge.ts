/**
 * 工具状态桥接
 * Store activeTool → Leafer 交互模式切换
 *
 * 核心规则：
 * - select 工具 → editable=true，Leafer Editor 原生处理选择/框选/拖拽
 * - 绘制工具 → editable=true（默认），绘制进行中临时 editable=false
 *   绘制开始（pointerDown 空白区域）→ editable=false
 *   绘制结束（pointerUp）→ editable=true
 */

import type { ToolId } from '../../../types';

export class ToolBridge {
  private currentTool: ToolId = 'select';
  private backend: ToolBridgeBackend | null = null;

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

  /** 当前是否为绘制工具 */
  isDrawingTool(): boolean {
    const drawingTools: ToolId[] = [
      'arrow',
      'rect',
      'text',
      'mosaic',
    ];
    return drawingTools.includes(this.currentTool);
  }

  /** 绘制开始：临时禁用 Editor */
  beginDrawing(): void {
    this.setEditable(false);
  }

  /** 绘制结束：恢复 Editor */
  endDrawing(): void {
    this.setEditable(true);
  }

  /** 根据工具设置 Leafer 交互模式 */
  private applyToolMode(): void {
    // 绘制工具：默认 editable=true，允许点击选中已有图形
    // 绘制进行中由 beginDrawing()/endDrawing() 临时切换 editable
    // select 工具：启用 Editor，允许选择/框选/拖拽
    this.setEditable(true);
    if (this.isDrawingTool()) {
      // 清除绘制工具切换时的残留选中状态
      this.backend?.clearSelection?.();
    }
  }

  /** 公开 setEditable，供外部在命中检测后临时启用 Editor */
  enableEditor(): void {
    this.setEditable(true);
  }

  private setEditable(value: boolean): void {
    if (!this.backend) return;
    const editor = this.backend.getEditor();
    if (!editor) return;

    // 【关键】通过 app.mode 彻底禁用 EditSelect
    // EditSelect.running 最后检查: app.mode === 'normal'
    // 设为 'preview' 可在事件到达 EditSelect 之前就拦截
    const app = this.backend.getApp?.();
    if (app) {
      (app as { mode: string }).mode = value ? 'normal' : 'preview';
    }

    const ed = editor as {
      editable: boolean;
      hittable?: boolean;
      visible?: boolean;
      cancel?: () => void;
      mergeConfig?: { selector?: boolean };
    };
    ed.editable = value;
    ed.hittable = value;
    // 通过配置禁用 selector（EditSelect.running 检查此项）
    if (ed.mergeConfig) {
      ed.mergeConfig.selector = value;
    }
    // 禁用时清除残留选框
    if (!value && ed.cancel) {
      ed.cancel();
    }
  }
}

/** 后端接口（仅暴露 ToolBridge 需要的方法） */
export interface ToolBridgeBackend {
  getEditor(): unknown | null;
  getApp?(): unknown | null;
  clearSelection?(): void;
}
