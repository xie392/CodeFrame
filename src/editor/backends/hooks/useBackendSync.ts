/**
 * Store ↔ Backend 双向同步 Hook
 * Phase 0：Store → Backend 单向同步
 * Phase 1：增加 Backend → Store 回调 +
 *   改进 Store → Backend 形状同步
 */

import { useEffect, useRef } from 'react';
import { useEditorStore } from '../../store/editor-store';
import type {
  IRendererBackend,
  ShapeType,
} from '../types';
import {
  generateArrowId,
  generateRectId,
  generateTextId,
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

export function useBackendSync(
  backend: IRendererBackend | null
): void {
  const backendRef = useRef(backend);

  // 在 useEffect 中同步 ref
  useEffect(() => {
    backendRef.current = backend;
  }, [backend]);

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
        store.setSelectedArrowIds(ids.arrow);
        store.setSelectedRectIds(ids.rect);
        store.setSelectedTextIds(ids.text);
        store.setSelectedMosaicIds(
          ids.mosaic
        );
      },
      onViewportChange: (state) => {
        const store =
          useEditorStore.getState();
        store.setScale(state.scale);
        store.setOffset(state.offset);
      },
      onShapeCreated: (
        type,
        data
      ) => {
        const store =
          useEditorStore.getState();

        switch (type) {
          case 'arrow':
            store.addArrow({
              id: generateArrowId(),
              ...(data as Partial<
                import('../../types').ArrowShape
              >),
            } as import('../../types').ArrowShape);
            break;
          case 'rect':
            store.addRect({
              id: generateRectId(),
              ...(data as Partial<
                import('../../types').RectShape
              >),
            } as import('../../types').RectShape);
            break;
          case 'text':
            store.addText({
              id: generateTextId(),
              ...(data as Partial<
                import('../../types').TextShape
              >),
            } as import('../../types').TextShape);
            // 文字创建后切换到选择工具
            store.setActiveTool('select');
            break;
          case 'mosaic':
            // Phase 2
            break;
        }
      },
    });

    return () => {
      backend.setCallbacks({
        onShapeChange: () => {},
        onSelectionChange: () => {},
        onViewportChange: () => {},
        onShapeCreated: () => {},
      });
    };
  }, [backend]);

  // ---- Store → Backend 同步 ----

  // 同步图形数据：用 hash 检测变化
  const shapesHash = useEditorStore(
    (s) =>
      [
        s.arrows
          .map(
            (a) =>
              `${a.id}:${a.startX}:${a.startY}:${a.endX}:${a.endY}:${a.color}:${a.strokeWidth}:${a.headSize}:${a.style}`
          )
          .join('|'),
        s.rects
          .map(
            (r) =>
              `${r.id}:${r.x}:${r.y}:${r.width}:${r.height}:${r.color}:${r.strokeWidth}:${r.fillOpacity}:${r.borderStyle}`
          )
          .join('|'),
        s.texts
          .map(
            (t) =>
              `${t.id}:${t.x}:${t.y}:${t.text}:${t.color}:${t.fontSize}:${t.fontWeight}:${t.fontStyle}`
          )
          .join('|'),
        s.mosaics
          .map(
            (m) =>
              `${m.id}:${m.x}:${m.y}:${m.width}:${m.height}:${m.blockSize}:${m.opacity}`
          )
          .join('|'),
      ].join('%%')
  );

  useEffect(() => {
    if (!backendRef.current) return;
    const b = backendRef.current;
    const collections = getShapeCollections();
    const currentIds = new Set<string>();

    for (const type of SHAPE_TYPES) {
      const { items } = collections[type];
      for (const item of items) {
        currentIds.add(item.id);
        b.addShape(type, item.id, item);
      }
    }

    // 移除 Store 中不存在的元素
    // （需通过 Backend 暴露的方法实现）
    void currentIds;
  }, [shapesHash]);

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
    if (!backendRef.current) return;
    const collections = getShapeCollections();
    const ids = {} as Record<
      ShapeType,
      string[]
    >;
    for (const type of SHAPE_TYPES) {
      ids[type] = collections[type].selectedIds;
    }
    backendRef.current.setSelection(ids);
  }, [selectionKey]);

  // 同步视口状态 → Backend
  const viewportKey = useEditorStore(
    (s) =>
      `${s.scale},${s.offset.x},${s.offset.y}`
  );

  useEffect(() => {
    if (!backendRef.current) return;
    const { scale, offset } =
      useEditorStore.getState();
    backendRef.current.setViewport({
      scale,
      offset,
    });
  }, [viewportKey]);

  // 同步工具状态 → Backend
  const activeTool = useEditorStore(
    (s) => s.activeTool
  );

  useEffect(() => {
    if (!backendRef.current) return;
    const b = backendRef.current as {
      setToolMode?: (tool: string) => void;
    };
    b.setToolMode?.(activeTool);
  }, [activeTool]);
}
