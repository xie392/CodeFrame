/**
 * 绘制控制器
 * 统一调度各绘制策略，管理事件路由
 * 从 LeaferBackend 中提取，消除 if-else 分支
 */

import { PointerEvent } from 'leafer-ui';
import type { ShapeType } from '../../types';
import type { LeaferAppResult } from '../leafer-app';
import type { IDrawingStrategy, DrawingContext, ImageCoord } from './types';
import { RectDrawingStrategy } from './rect-drawing';
import { ArrowDrawingStrategy } from './arrow-drawing';
import { TextDrawingStrategy } from './text-drawing';
import { MosaicDrawingStrategy } from './mosaic-drawing';
import { SelectDrawingStrategy } from './select-drawing';
import { useEditorStore } from '../../../store/editor-store';
import type { HitResult } from '../../../utils/hit-test';

export class DrawingController {
  private appResult: LeaferAppResult | null = null;
  private strategies: Map<string, IDrawingStrategy> = new Map();
  private currentStrategy: IDrawingStrategy | null = null;
  private selectStrategy: SelectDrawingStrategy;
  private cleanupFns: (() => void)[] = [];

  /** 当前工具 */
  private currentTool = 'select';

  /** 获取图片坐标的回调 */
  private getImageCoordFn: ((e: unknown) => ImageCoord) | null = null;

  /** 绘制完成回调 */
  private onShapeCreated: ((type: ShapeType, data: Record<string, unknown>) => void) | null = null;

  /** 选中变化回调 */
  private onSelectionChange: ((ids: Record<ShapeType, string[]>) => void) | null = null;

  /** 清除选中回调 */
  private onClearSelection: (() => void) | null = null;

  /** 查找框选区域内的元素 */
  private findElementsInBoundsFn: ((bounds: { x: number; y: number; width: number; height: number }) => Record<ShapeType, string[]> | null) | null = null;

  /** 获取编辑器状态 */
  private isEditorDraggingFn: (() => boolean) | null = null;
  private isEditorEditingFn: (() => boolean) | null = null;
  private isSyncingFn: (() => boolean) | null = null;

  /** 绘制开始/结束回调（由 LeaferBackend 提供，控制 Editor 可用性） */
  private onDrawingBegin: (() => void) | null = null;
  private onDrawingEnd: (() => void) | null = null;

  /** 命中检测回调（由 LeaferBackend 提供，检测点击位置是否命中已有图形） */
  private hitTestFn: ((x: number, y: number) => HitResult | null) | null = null;

  /** 裁剪工具事件回调（由 LeaferBackend 提供） */
  private onCropPointerDown: ((e: unknown) => void) | null = null;
  private onCropPointerMove: ((e: unknown) => void) | null = null;
  private onCropPointerUp: (() => void) | null = null;

  /** 是否处于绘制会话中（pointerDown → pointerUp） */
  private isDrawingSession = false;

  constructor() {
    this.strategies.set('rect', new RectDrawingStrategy());
    this.strategies.set('arrow', new ArrowDrawingStrategy());
    this.strategies.set('text', new TextDrawingStrategy());
    this.strategies.set('mosaic', new MosaicDrawingStrategy());

    this.selectStrategy = new SelectDrawingStrategy();
  }

  /** 初始化，绑定 Leafer App 和事件 */
  init(appResult: LeaferAppResult): void {
    this.appResult = appResult;
    this.setupDrawingListeners();
    this.setupSelectCallbacks();
  }

  /** 配置依赖注入 */
  configure(deps: {
    getImageCoord: (e: unknown) => ImageCoord;
    onShapeCreated: (type: ShapeType, data: Record<string, unknown>) => void;
    onSelectionChange: (ids: Record<ShapeType, string[]>) => void;
    onClearSelection: () => void;
    findElementsInBounds: (bounds: { x: number; y: number; width: number; height: number }) => Record<ShapeType, string[]> | null;
    isEditorDragging: () => boolean;
    isEditorEditing: () => boolean;
    isSyncing: () => boolean;
    onDrawingBegin?: () => void;
    onDrawingEnd?: () => void;
    hitTest?: (x: number, y: number) => HitResult | null;
    onCropPointerDown?: (e: unknown) => void;
    onCropPointerMove?: (e: unknown) => void;
    onCropPointerUp?: () => void;
  }): void {
    this.getImageCoordFn = deps.getImageCoord;
    this.onShapeCreated = deps.onShapeCreated;
    this.onSelectionChange = deps.onSelectionChange;
    this.onClearSelection = deps.onClearSelection;
    this.findElementsInBoundsFn = deps.findElementsInBounds;
    this.isEditorDraggingFn = deps.isEditorDragging;
    this.isEditorEditingFn = deps.isEditorEditing;
    this.isSyncingFn = deps.isSyncing;
    this.onDrawingBegin = deps.onDrawingBegin ?? null;
    this.onDrawingEnd = deps.onDrawingEnd ?? null;
    this.hitTestFn = deps.hitTest ?? null;
    this.onCropPointerDown = deps.onCropPointerDown ?? null;
    this.onCropPointerMove = deps.onCropPointerMove ?? null;
    this.onCropPointerUp = deps.onCropPointerUp ?? null;
    this.setupSelectCallbacks();
  }

  /** 销毁，清理所有事件和状态 */
  destroy(): void {
    this.cancelAll();
    for (const fn of this.cleanupFns) fn();
    this.cleanupFns = [];
    this.appResult = null;
  }

  /** 切换工具 —— 取消当前绘制，激活新策略 */
  setTool(tool: string): void {
    this.cancelAll();
    this.isDrawingSession = false;
    this.currentTool = tool;

    if (tool === 'select') {
      this.currentStrategy = this.selectStrategy;
    } else if (this.strategies.has(tool)) {
      this.currentStrategy = this.strategies.get(tool)!;
    } else {
      this.currentStrategy = null;
    }
  }

  // ---- 内部实现 ----

  private setupSelectCallbacks(): void {
    this.selectStrategy.setCallbacks({
      onClearSelection: () => {
        if (this.isSyncingFn?.()) return;
        this.onClearSelection?.();
      },
      onMarqueeSelect: (ids) => {
        if (this.isSyncingFn?.()) return;
        this.onSelectionChange?.(ids);
      },
      findElementsInBounds: (bounds) => {
        return this.findElementsInBoundsFn?.(bounds) ?? null;
      },
      isEditorDragging: () => this.isEditorDraggingFn?.() ?? false,
      isEditorEditing: () => this.isEditorEditingFn?.() ?? false,
      hitTest: (x: number, y: number) => this.hitTestFn?.(x, y) ?? null,
    });
  }

  private setupDrawingListeners(): void {
    if (!this.appResult) return;

    const { annotationBox, app } = this.appResult;
    const box = annotationBox as unknown as {
      on: (event: unknown, handler: (e: unknown) => void) => void;
      off: (event: unknown, handler: (e: unknown) => void) => void;
    };
    const tree = app.tree as unknown as {
      on: (event: unknown, handler: (e: unknown) => void) => void;
      off: (event: unknown, handler: (e: unknown) => void) => void;
    };

    const onDown = (e: unknown) => this.handlePointerDown(e);
    const onMove = (e: unknown) => this.handlePointerMove(e);
    const onUp = () => this.handlePointerUp();

    box.on(PointerEvent.DOWN, onDown);
    tree.on(PointerEvent.MOVE, onMove);
    tree.on(PointerEvent.UP, onUp);

    this.cleanupFns.push(() => {
      box.off(PointerEvent.DOWN, onDown);
      tree.off(PointerEvent.MOVE, onMove);
      tree.off(PointerEvent.UP, onUp);
    });
  }

  private handlePointerDown(e: unknown): void {
    // 裁剪工具直接委托给后端
    if (this.currentTool === 'crop') {
      this.onCropPointerDown?.(e);
      return;
    }

    // 选择工具：完全交由 Leafer Editor 原生处理
    // （点击选中、框选、拖拽、取消选中）
    // Editor 的 EditorEvent.SELECT 会同步选中状态到 Store
    if (this.currentTool === 'select') return;

    if (!this.currentStrategy || !this.getImageCoordFn) return;

    const coord = this.getImageCoordFn(e);

    // 绘制工具：先进行命中检测
    // 1. 命中已有图形 → 跳过绘制，让 Editor 处理选中
    // 2. 未命中 → 禁用 Editor，开始绘制
    if (this.isEditorEditingFn?.()) {
      this.isDrawingSession = false;
      return;
    }

    const hit = this.hitTestFn?.(coord.x, coord.y);
    if (hit) {
      // 命中已有图形，让 Editor 原生处理选中，不开始绘制
      this.isDrawingSession = false;
      return;
    }

    // 未命中，开始绘制
    this.onDrawingBegin?.();
    this.isDrawingSession = true;

    const ctx = this.createContext();
    this.currentStrategy.onStart(ctx, coord);
  }

  private handlePointerMove(e: unknown): void {
    // 裁剪工具直接委托给后端
    if (this.currentTool === 'crop') {
      this.onCropPointerMove?.(e);
      return;
    }

    // 选择工具：交由 Leafer Editor 原生处理
    if (this.currentTool === 'select') return;

    if (!this.currentStrategy || !this.getImageCoordFn) return;
    const coord = this.getImageCoordFn(e);
    const ctx = this.createContext();
    this.currentStrategy.onMove(ctx, coord);
  }

  private handlePointerUp(): void {
    // 裁剪工具直接委托给后端
    if (this.currentTool === 'crop') {
      this.onCropPointerUp?.();
      return;
    }

    // 选择工具：交由 Leafer Editor 原生处理
    if (this.currentTool === 'select') return;

    if (!this.currentStrategy) return;
    const ctx = this.createContext();
    this.currentStrategy.onEnd(ctx);

    // 绘制工具：绘制结束后恢复 Editor
    if (this.isDrawingSession) {
      this.isDrawingSession = false;
      this.onDrawingEnd?.();
    }
  }

  private createContext(): DrawingContext {
    return {
      getImageCoord: this.getImageCoordFn ?? (() => ({ x: 0, y: 0 })),
      addTempElement: (element: unknown) => {
        this.appResult?.annotationBox.add(element as { remove: () => void });
      },
      getStyles: () => useEditorStore.getState().lastUsedStyles as unknown as Record<string, unknown>,
      onCreated: (type, data) => {
        this.onShapeCreated?.(type, data);
      },
    };
  }

  /** 取消所有进行中的绘制 */
  private cancelAll(): void {
    for (const strategy of this.strategies.values()) {
      if (strategy.isActive()) strategy.cancel();
    }
    if (this.selectStrategy.isActive()) this.selectStrategy.cancel();
  }
}
