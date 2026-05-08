/**
 * Store ↔ Backend 双向同步 Hook
 * Phase 0：Store → Backend 单向同步
 * Phase 1：增加 Backend → Store 回调 +
 *   改进 Store → Backend 形状同步
 * Phase 2：增加马赛克 onShapeCreated 和
 *   imageData 同步
 *
 * 关键设计：所有 sync effect 依赖
 * backend 参数（而非 backendRef），
 * 确保 backend 重建后状态完整同步。
 * 回调添加值比对防止异步 Leafer 事件
 * 触发无意义 store 更新。
 */

import { useEffect } from 'react';
import { useEditorStore } from '../../store/editor-store';
import type {
  IRendererBackend,
  ShapeType,
} from '../types';
import {
  generateArrowId,
  generateRectId,
  generateTextId,
  generateMosaicId,
} from '../../utils/editor';

const SHAPE_TYPES: ShapeType[] = [
  'arrow',
  'rect',
  'text',
  'mosaic',
];

/** 获取 Store 中对应图形类型的数组 */
function getShapeCollections() {
  const state = useEditorStore.getState();
  return {
    arrow: {
      items: state.arrows,
      selectedIds: state.selectedArrowIds,
    },
    rect: {
      items: state.rects,
      selectedIds: state.selectedRectIds,
    },
    text: {
      items: state.texts,
      selectedIds: state.selectedTextIds,
    },
    mosaic: {
      items: state.mosaics,
      selectedIds: state.selectedMosaicIds,
    },
  };
}

/** syncing 守卫接口 */
interface Syncable {
  startSync?: () => void;
  endSync?: () => void;
}

/** 在 syncing 守卫内执行操作。
 * endSync 通过微任务延迟释放，
 * 覆盖 Leafer 异步事件回调窗口，
 * 防止 Store→Backend→(async event)→Store 循环
 */
function withSync<T>(
  syncable: Syncable,
  fn: () => T
): T {
  syncable.startSync?.();
  try {
    return fn();
  } finally {
    queueMicrotask(() => syncable.endSync?.());
  }
}

/** 浮点容差比较 */
const EPS = 1e-6;

/** 比较两个数组内容是否相同（无序） */
function arraysEqual<T>(
  a: T[],
  b: T[]
): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every((v) => setA.has(v));
}

export function useBackendSync(
  backend: IRendererBackend | null
): void {
  // 注册 Backend → Store 回调
  useEffect(() => {
    if (!backend) return;

    backend.setCallbacks({
      onShapeChange: (
        type,
        id,
        updates
      ) => {
        const store =
          useEditorStore.getState();
        switch (type) {
          case 'arrow':
            store.updateArrow(
              id,
              updates as Partial<
                import('../../types').ArrowShape
              >
            );
            break;
          case 'rect':
            store.updateRect(
              id,
              updates as Partial<
                import('../../types').RectShape
              >
            );
            break;
          case 'text':
            store.updateText(
              id,
              updates as Partial<
                import('../../types').TextShape
              >
            );
            break;
          case 'mosaic':
            store.updateMosaic(
              id,
              updates as Partial<
                import('../../types').MosaicShape
              >
            );
            break;
        }
      },
      onSelectionChange: (ids) => {
        const store =
          useEditorStore.getState();
        // 值比对：相同选中不更新 store，
        // 防止异步 Leafer 事件触发循环
        if (
          arraysEqual(
            ids.arrow,
            store.selectedArrowIds
          ) &&
          arraysEqual(
            ids.rect,
            store.selectedRectIds
          ) &&
          arraysEqual(
            ids.text,
            store.selectedTextIds
          ) &&
          arraysEqual(
            ids.mosaic,
            store.selectedMosaicIds
          )
        )
          return;
        store.setSelectedArrowIds(
          ids.arrow
        );
        store.setSelectedRectIds(ids.rect);
        store.setSelectedTextIds(ids.text);
        store.setSelectedMosaicIds(
          ids.mosaic
        );
      },
      onViewportChange: (state) => {
        const store =
          useEditorStore.getState();
        // 浮点容差比较：相同视口
        // 不更新 store
        if (
          Math.abs(store.scale - state.scale) <
            EPS &&
          Math.abs(
            store.offset.x - state.offset.x
          ) < EPS &&
          Math.abs(
            store.offset.y - state.offset.y
          ) < EPS
        )
          return;
        store.setScale(state.scale);
        store.setOffset(state.offset);
      },
      onShapeCreated: (
        type,
        data
      ) => {
        const store =
          useEditorStore.getState();

        // 在 withSync 守卫内同步创建 Leafer 元素并选中，
        // 确保元素在 endDrawing()→setEditable(true) 之前已存在，
        // 并防止 Leafer 异步 SELECT 事件清空 store 选中状态
        withSync(backend as Syncable, () => {
          let shapeId = '';
          let shapeData: unknown = null;

          switch (type) {
            case 'arrow': {
              const shape = {
                id: generateArrowId(),
                ...(data as Partial<
                  import('../../types').ArrowShape
                >),
              } as import('../../types').ArrowShape;
              shapeId = shape.id;
              shapeData = shape;
              store.addArrow(shape);
              store.updateLastUsedStyles('arrow', {
                color: shape.color,
                strokeWidth: shape.strokeWidth,
                headSize: shape.headSize,
                style: shape.style,
              });
              store.setSelectedArrowIds([shape.id]);
              store.setSelectedRectIds([]);
              store.setSelectedTextIds([]);
              store.setSelectedMosaicIds([]);
              break;
            }
            case 'rect': {
              const shape = {
                id: generateRectId(),
                ...(data as Partial<
                  import('../../types').RectShape
                >),
              } as import('../../types').RectShape;
              shapeId = shape.id;
              shapeData = shape;
              store.addRect(shape);
              store.updateLastUsedStyles('rect', {
                color: shape.color,
                strokeWidth: shape.strokeWidth,
                fillOpacity: shape.fillOpacity,
                borderStyle: shape.borderStyle,
              });
              store.setSelectedArrowIds([]);
              store.setSelectedRectIds([shape.id]);
              store.setSelectedTextIds([]);
              store.setSelectedMosaicIds([]);
              break;
            }
            case 'text': {
              const shape = {
                id: generateTextId(),
                ...(data as Partial<
                  import('../../types').TextShape
                >),
              } as import('../../types').TextShape;
              shapeId = shape.id;
              shapeData = shape;
              store.addText(shape);
              store.updateLastUsedStyles('text', {
                color: shape.color,
                fontSize: shape.fontSize,
                fontWeight: shape.fontWeight,
                fontStyle: shape.fontStyle,
              });
              store.setSelectedArrowIds([]);
              store.setSelectedRectIds([]);
              store.setSelectedTextIds([shape.id]);
              store.setSelectedMosaicIds([]);
              break;
            }
            case 'mosaic': {
              const shape = {
                id: generateMosaicId(),
                ...(data as Partial<
                  import('../../types').MosaicShape
                >),
              } as import('../../types').MosaicShape;
              shapeId = shape.id;
              shapeData = shape;
              store.addMosaic(shape);
              store.updateLastUsedStyles('mosaic', {
                blockSize: shape.blockSize,
                opacity: shape.opacity,
              });
              store.setSelectedArrowIds([]);
              store.setSelectedRectIds([]);
              store.setSelectedTextIds([]);
              store.setSelectedMosaicIds([shape.id]);
              break;
            }
          }

          // 同步创建 Leafer 元素并选中，避免 React effect 延迟
          if (shapeId && shapeData) {
            backend.addShape(type, shapeId, shapeData);
            const ids = {
              arrow: [] as string[],
              rect: [] as string[],
              text: [] as string[],
              mosaic: [] as string[],
            };
            ids[type] = [shapeId];
            backend.setSelection(ids);
          }
        });
      },
      onCropAreaChange: (area) => {
        const store =
          useEditorStore.getState();
        // 值比对：相同裁剪区域不更新
        const current = store.cropArea;
        if (area && current) {
          if (
            Math.abs(area.x - current.x) <
              EPS &&
            Math.abs(area.y - current.y) <
              EPS &&
            Math.abs(
              area.width - current.width
            ) < EPS &&
            Math.abs(
              area.height - current.height
            ) < EPS
          )
            return;
        }
        if (!area && !current) return;
        store.setCropArea(area);
      },
    });

    return () => {
      backend.setCallbacks({
        onShapeChange: () => {},
        onSelectionChange: () => {},
        onViewportChange: () => {},
        onShapeCreated: () => {},
        onCropAreaChange: () => {},
      });
    };
  }, [backend]);

  // ---- Store → Backend 同步 ----
  // 所有同步 effect 依赖 backend 参数，
  // 确保 backend 变化时完整重同步；
  // 统一使用 syncing 守卫，
  // 防止 Backend→Store 回调
  // 造成 Store→Backend→Store 循环

  // 同步图形数据：用 hash 检测变化
  const shapesHash = useEditorStore(
    (s) =>
      [
        s.arrows
          .map(
            (a) =>
              `${a.id}:${a.startX}:${a.startY}:${a.endX}:${a.endY}:${a.color}:${a.strokeWidth}:${a.headSize}:${a.style}:${a.zIndex}`
          )
          .join('|'),
        s.rects
          .map(
            (r) =>
              `${r.id}:${r.x}:${r.y}:${r.width}:${r.height}:${r.color}:${r.strokeWidth}:${r.fillOpacity}:${r.borderStyle}:${r.zIndex}`
          )
          .join('|'),
        s.texts
          .map(
            (t) =>
              `${t.id}:${t.x}:${t.y}:${t.text}:${t.color}:${t.fontSize}:${t.fontWeight}:${t.fontStyle}:${t.zIndex}`
          )
          .join('|'),
        s.mosaics
          .map(
            (m) =>
              `${m.id}:${m.x}:${m.y}:${m.width}:${m.height}:${m.blockSize}:${m.opacity}:${m.zIndex}`
          )
          .join('|'),
      ].join('%%')
  );

  useEffect(() => {
    if (!backend) return;
    const syncable = backend as Syncable;
    const collections = getShapeCollections();
    const currentIds = new Set<string>();

    withSync(syncable, () => {
      for (const type of SHAPE_TYPES) {
        const { items } = collections[type];
        for (const item of items) {
          currentIds.add(item.id);
          backend.addShape(
            type,
            item.id,
            item
          );
        }
      }
    });

    void currentIds;
  }, [backend, shapesHash]);

  // 同步选中状态 → Backend
  const selectionKey = useEditorStore(
    (s) =>
      [
        s.selectedArrowIds,
        s.selectedRectIds,
        s.selectedTextIds,
        s.selectedMosaicIds,
      ].join(',')
  );

  useEffect(() => {
    if (!backend) return;
    const syncable = backend as Syncable;
    const collections = getShapeCollections();
    const ids = {} as Record<
      ShapeType,
      string[]
    >;
    for (const type of SHAPE_TYPES) {
      ids[type] =
        collections[type].selectedIds;
    }

    withSync(syncable, () => {
      backend.setSelection(ids);
    });
  }, [backend, selectionKey]);

  // 同步视口状态 → Backend
  const viewportKey = useEditorStore(
    (s) =>
      `${s.scale},${s.offset.x},${s.offset.y}`
  );

  useEffect(() => {
    if (!backend) return;
    const syncable = backend as Syncable;
    const { scale, offset } =
      useEditorStore.getState();

    withSync(syncable, () => {
      backend.setViewport({
        scale,
        offset,
      });
    });
  }, [backend, viewportKey]);

  // 同步工具状态 → Backend
  const activeTool = useEditorStore(
    (s) => s.activeTool
  );

  useEffect(() => {
    if (!backend) return;
    const b = backend as {
      setToolMode?: (tool: string) => void;
    };
    b.setToolMode?.(activeTool);
  }, [backend, activeTool]);

  // 同步裁剪模式 → Backend
  const isCropMode = useEditorStore(
    (s) => s.isCropMode
  );

  useEffect(() => {
    if (!backend) return;
    const b = backend as {
      setCropMode?: (active: boolean) => void;
    };
    b.setCropMode?.(isCropMode);
  }, [backend, isCropMode]);

  // 同步图片数据 → Backend（马赛克需要）
  const imageData = useEditorStore(
    (s) => s.imageData
  );

  useEffect(() => {
    if (!backend || !imageData) return;
    const syncable = backend as Syncable;
    const b = backend as {
      setImageData?: (url: string) => void;
    };

    withSync(syncable, () => {
      b.setImageData?.(imageData);
    });
  }, [backend, imageData]);

  // 同步裁剪区域 → Backend
  const cropAreaKey = useEditorStore(
    (s) =>
      s.cropArea
        ? `${s.cropArea.x},${s.cropArea.y},${s.cropArea.width},${s.cropArea.height}`
        : 'null',
  );

  useEffect(() => {
    if (!backend) return;
    const syncable = backend as Syncable;
    const { cropArea } =
      useEditorStore.getState();

    withSync(syncable, () => {
      backend.setCropArea(cropArea);
    });
  }, [backend, cropAreaKey]);
}
