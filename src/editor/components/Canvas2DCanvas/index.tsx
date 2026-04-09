/**
 * Canvas2DCanvas 组件
 * 封装现有 Canvas 2D 渲染逻辑为独立组件
 * 不修改任何现有代码，仅包裹
 */

import React, {
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { useEditorStore } from '../../store/editor-store';
import { useSyncedRef } from '../../hooks/useSyncedRef';
import { useZoomPan } from '../../hooks/useZoomPan';
import { useEditorHistory } from '../../hooks/useEditorHistory';
import { useExport } from '../../hooks/useExport';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useCrop } from '../../hooks/useCrop';
import { useTextEditing } from '../../hooks/useTextEditing';
import { useEditorEvents } from '../../hooks/useEditorEvents';
import { useEditorInit } from '../../hooks/useEditorInit';
import { useShortcutListener } from '@shared/hooks/useShortcutListener';
import { CanvasRenderer } from '../../services/canvas-renderer';
import { isPointInText, isPointInCrop } from '../../utils/shape-helpers';
import { FrameContainer } from '../FrameContainer';
import { TextEditorInput } from '../TextEditorInput';
import { CropHint } from '../CropHint';
import { ZoomControls } from '../ZoomControls';
import type {
  EditorState,
} from '../../types';

export interface Canvas2DCanvasProps {
  onHistoryActions: (
    actions: ReturnType<typeof useEditorHistory>
  ) => void;
  onExportHandlers: (handlers: {
    isExporting: boolean;
    copied: boolean;
    exportError: string | null;
    handleExportImage: () => Promise<void>;
    handleCopyToClipboard: () => Promise<void>;
  }) => void;
  onUndoRedo: (handlers: {
    handleUndo: () => void;
    handleRedo: () => void;
  }) => void;
}

export function Canvas2DCanvas({
  onHistoryActions,
  onExportHandlers,
  onUndoRedo,
}: Canvas2DCanvasProps): React.ReactElement | null {
  // ---- Store ----
  const {
    activeTool, setActiveTool,
    imageData, setImageData,
    imageNaturalSize, setImageNaturalSize,
    imageDisplaySize, setImageDisplaySize,
    arrows, setArrows,
    rects, setRects,
    texts, setTexts,
    mosaics, setMosaics,
    selectedArrowIds, setSelectedArrowIds,
    selectedRectIds, setSelectedRectIds,
    selectedTextIds, setSelectedTextIds,
    selectedMosaicIds, setSelectedMosaicIds,
    cropArea, setCropArea,
    editingTextId, setEditingTextId,
    editingTextValue, setEditingTextValue,
    canUndo, setCanUndo,
    canRedo, setCanRedo,
    frameSettings,
    source,
  } = useEditorStore();

  const setError = useEditorStore((s) => s.setError);
  const setSource = useEditorStore((s) => s.setSource);

  // Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const annotationCanvasRef =
    useRef<HTMLCanvasElement>(null);
  const imageContainerRef =
    useRef<HTMLDivElement>(null);
  const exportContainerRef =
    useRef<HTMLDivElement>(null);
  const textInputRef =
    useRef<HTMLInputElement>(null);
  const imageCanvasRef =
    useRef<HTMLCanvasElement | null>(null);
  const initializedRef = useRef(false);

  // ---- ZoomPan ----
  const {
    scale, offset, scaleRef, offsetRef,
    setScale, setOffset,
    zoomIn, zoomOut, resetView,
    handleSlider, zoomPercent,
  } = useZoomPan({
    containerRef: canvasRef,
    activeTool,
    imageData,
  });

  // ---- Synced Refs ----
  const arrowsRef = useSyncedRef(arrows);
  const rectsRef = useSyncedRef(rects);
  const textsRef = useSyncedRef(texts);
  const mosaicsRef = useSyncedRef(mosaics);
  const selectedArrowIdsRef =
    useSyncedRef(selectedArrowIds);
  const selectedRectIdsRef =
    useSyncedRef(selectedRectIds);
  const selectedTextIdsRef =
    useSyncedRef(selectedTextIds);
  const selectedMosaicIdsRef =
    useSyncedRef(selectedMosaicIds);
  const cropAreaRef = useSyncedRef(cropArea);
  const imageNaturalSizeRef =
    useSyncedRef(imageNaturalSize);
  const imageDisplaySizeRef =
    useSyncedRef(imageDisplaySize);

  // ---- History ----
  const historyActions = useEditorHistory();

  useEffect(() => {
    onHistoryActions(historyActions);
  }, [historyActions, onHistoryActions]);

  const updateHistoryButtons = useCallback(() => {
    setCanUndo(historyActions.canUndo());
    setCanRedo(historyActions.canRedo());
  }, [historyActions, setCanUndo, setCanRedo]);

  const pushHistory = useCallback(() => {
    const state: EditorState = {
      arrows: structuredClone(arrowsRef.current),
      rects: structuredClone(rectsRef.current),
      texts: structuredClone(textsRef.current),
      mosaics: structuredClone(
        mosaicsRef.current
      ),
      imageData,
      view: {
        scale: scaleRef.current,
        offset: { ...offsetRef.current },
      },
      selectedArrowIds: [
        ...selectedArrowIdsRef.current,
      ],
      selectedRectIds: [
        ...selectedRectIdsRef.current,
      ],
      selectedTextIds: [
        ...selectedTextIdsRef.current,
      ],
      selectedMosaicIds: [
        ...selectedMosaicIdsRef.current,
      ],
    };
    historyActions.pushState(state);
    updateHistoryButtons();
  }, [
    historyActions,
    imageData,
    updateHistoryButtons,
    arrowsRef,
    rectsRef,
    textsRef,
    mosaicsRef,
    scaleRef,
    offsetRef,
    selectedArrowIdsRef,
    selectedRectIdsRef,
    selectedTextIdsRef,
    selectedMosaicIdsRef,
  ]);

  const handleUndo = useCallback(() => {
    const prevState = historyActions.undo();
    if (prevState) {
      setArrows(prevState.arrows);
      setRects(prevState.rects);
      setTexts(prevState.texts);
      setMosaics(prevState.mosaics);
      arrowsRef.current = prevState.arrows;
      rectsRef.current = prevState.rects;
      textsRef.current = prevState.texts;
      mosaicsRef.current = prevState.mosaics;
      if (
        prevState.imageData &&
        prevState.imageData !== imageData
      ) {
        setImageData(prevState.imageData);
      }
      setScale(prevState.view.scale);
      setOffset(prevState.view.offset);
      scaleRef.current = prevState.view.scale;
      offsetRef.current = prevState.view.offset;
      setSelectedArrowIds(
        prevState.selectedArrowIds
      );
      setSelectedRectIds(
        prevState.selectedRectIds
      );
      setSelectedTextIds(
        prevState.selectedTextIds
      );
      setSelectedMosaicIds(
        prevState.selectedMosaicIds
      );
    }
    updateHistoryButtons();
  }, [
    historyActions, imageData,
    updateHistoryButtons,
    setScale, setOffset,
    setArrows, setRects, setTexts, setMosaics,
    setSelectedArrowIds, setSelectedRectIds,
    setSelectedTextIds, setSelectedMosaicIds,
    setImageData,
    arrowsRef, rectsRef, textsRef, mosaicsRef,
    scaleRef, offsetRef,
  ]);

  const handleRedo = useCallback(() => {
    const nextState = historyActions.redo();
    if (nextState) {
      setArrows(nextState.arrows);
      setRects(nextState.rects);
      setTexts(nextState.texts);
      setMosaics(nextState.mosaics);
      arrowsRef.current = nextState.arrows;
      rectsRef.current = nextState.rects;
      textsRef.current = nextState.texts;
      mosaicsRef.current = nextState.mosaics;
      if (
        nextState.imageData &&
        nextState.imageData !== imageData
      ) {
        setImageData(nextState.imageData);
      }
      setScale(nextState.view.scale);
      setOffset(nextState.view.offset);
      scaleRef.current = nextState.view.scale;
      offsetRef.current = nextState.view.offset;
      setSelectedArrowIds(
        nextState.selectedArrowIds
      );
      setSelectedRectIds(
        nextState.selectedRectIds
      );
      setSelectedTextIds(
        nextState.selectedTextIds
      );
      setSelectedMosaicIds(
        nextState.selectedMosaicIds
      );
    }
    updateHistoryButtons();
  }, [
    historyActions, imageData,
    updateHistoryButtons,
    setScale, setOffset,
    setArrows, setRects, setTexts, setMosaics,
    setSelectedArrowIds, setSelectedRectIds,
    setSelectedTextIds, setSelectedMosaicIds,
    setImageData,
    arrowsRef, rectsRef, textsRef, mosaicsRef,
    scaleRef, offsetRef,
  ]);

  useEffect(() => {
    onUndoRedo({ handleUndo, handleRedo });
  }, [handleUndo, handleRedo, onUndoRedo]);

  // ---- Canvas 渲染 ----
  const screenToImageCoord = useCallback(
    (
      clientX: number,
      clientY: number
    ): { x: number; y: number } | null => {
      const canvas = annotationCanvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      return {
        x:
          (clientX -
            rect.left -
            offsetRef.current.x) /
          scaleRef.current,
        y:
          (clientY -
            rect.top -
            offsetRef.current.y) /
          scaleRef.current,
      };
    },
    [offsetRef, scaleRef]
  );

  const renderShapes = useCallback(() => {
    const canvas = annotationCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(
      offsetRef.current.x,
      offsetRef.current.y
    );
    ctx.scale(
      scaleRef.current,
      scaleRef.current
    );

    const renderer = new CanvasRenderer(ctx);

    rects.forEach((rect) =>
      renderer.drawRect(
        rect,
        selectedRectIds.includes(rect.id)
      )
    );
    arrows.forEach((arrow) =>
      renderer.drawArrow(
        arrow,
        selectedArrowIds.includes(arrow.id)
      )
    );
    texts.forEach((text) => {
      if (editingTextId === text.id) return;
      renderer.drawText(
        text,
        selectedTextIds.includes(text.id)
      );
    });
    mosaics.forEach((mosaic) =>
      renderer.drawMosaic(
        mosaic,
        imageCanvasRef.current,
        selectedMosaicIds.includes(mosaic.id)
      )
    );
    if (
      activeTool === 'crop' &&
      imageDisplaySize &&
      cropArea
    ) {
      renderer.drawCropBox(
        cropArea,
        imageDisplaySize.width,
        imageDisplaySize.height
      );
    }

    ctx.restore();
  }, [
    arrows, rects, texts, mosaics,
    selectedArrowIds, selectedRectIds,
    selectedTextIds, selectedMosaicIds,
    editingTextId, cropArea,
    imageDisplaySize, activeTool,
    offsetRef, scaleRef,
  ]);

  // ---- Crop ----
  const { applyCrop, cancelCrop } = useCrop(
    {
      imageData, cropAreaRef,
      imageNaturalSizeRef,
      imageDisplaySizeRef,
      scaleRef, offsetRef,
    },
    {
      pushHistory, setImageData,
      setArrows, setRects,
      setTexts, setMosaics,
      setSelectedArrowIds,
      setSelectedRectIds,
      setSelectedTextIds,
      setSelectedMosaicIds,
      setCropArea, setImageNaturalSize,
      setImageDisplaySize,
      setActiveTool, setScale, setOffset,
    }
  );

  // ---- Text Editing ----
  const {
    startEditing, stopEditing,
    handleTextChange,
  } = useTextEditing(
    { editingTextId, editingTextValue },
    {
      setEditingTextId,
      setEditingTextValue,
      setTexts,
      setSelectedTextIds,
    }
  );

  // ---- Keyboard Shortcuts ----
  useKeyboardShortcuts(
    {
      activeTool, cropArea,
      selection: {
        arrowIds: selectedArrowIds,
        rectIds: selectedRectIds,
        textIds: selectedTextIds,
        mosaicIds: selectedMosaicIds,
      },
      isMarqueeSelecting: {
        current: false,
      } as React.MutableRefObject<boolean>,
    },
    {
      onUndo: handleUndo,
      onRedo: handleRedo,
      onSelectAll: () => {
        setSelectedArrowIds(
          arrowsRef.current.map((a) => a.id)
        );
        setSelectedRectIds(
          rectsRef.current.map((r) => r.id)
        );
        setSelectedTextIds(
          textsRef.current.map((t) => t.id)
        );
        setSelectedMosaicIds(
          mosaicsRef.current.map((m) => m.id)
        );
      },
      onClearSelection: () => {
        setSelectedArrowIds([]);
        setSelectedRectIds([]);
        setSelectedTextIds([]);
        setSelectedMosaicIds([]);
      },
      onDelete: () => {
        if (selectedArrowIds.length > 0) {
          setArrows((prev) =>
            prev.filter(
              (a) =>
                !selectedArrowIds.includes(a.id)
            )
          );
          setSelectedArrowIds([]);
        }
        if (selectedRectIds.length > 0) {
          setRects((prev) =>
            prev.filter(
              (r) =>
                !selectedRectIds.includes(r.id)
            )
          );
          setSelectedRectIds([]);
        }
        if (selectedTextIds.length > 0) {
          setTexts((prev) =>
            prev.filter(
              (t) =>
                !selectedTextIds.includes(t.id)
            )
          );
          setSelectedTextIds([]);
        }
        if (selectedMosaicIds.length > 0) {
          setMosaics((prev) =>
            prev.filter(
              (m) =>
                !selectedMosaicIds.includes(m.id)
            )
          );
          setSelectedMosaicIds([]);
        }
      },
      onApplyCrop: applyCrop,
      onCancelCrop: cancelCrop,
      onCancelMarquee: () => {
        renderShapes();
      },
      pushHistory,
    }
  );

  // ---- Chrome Extension Shortcuts ----
  useShortcutListener({
    captureVisible: () => {
      chrome.runtime.sendMessage({
        type: 'CAPTURE_REQUEST',
        payload: { mode: 'visible' },
      });
    },
    captureRegion: () => {
      chrome.runtime.sendMessage({
        type: 'CAPTURE_REQUEST',
        payload: { mode: 'region' },
      });
    },
    captureFullpage: () => {
      chrome.runtime.sendMessage({
        type: 'CAPTURE_REQUEST',
        payload: { mode: 'fullpage' },
      });
    },
    captureDesktop: () => {
      chrome.runtime.sendMessage({
        type: 'CAPTURE_REQUEST',
        payload: { mode: 'desktop' },
      });
    },
  });

  // ---- Editor Events ----
  useEditorEvents(
    {
      canvasRef, annotationCanvasRef,
      activeTool, imageData,
      editingTextId, cropArea,
      imageNaturalSize, imageDisplaySize,
      frameSettings,
      arrowsRef, rectsRef, textsRef, mosaicsRef,
      selectedArrowIdsRef,
      selectedRectIdsRef,
      selectedTextIdsRef,
      selectedMosaicIdsRef,
      cropAreaRef, imageNaturalSizeRef,
    },
    {
      pushHistory, renderShapes,
      screenToImageCoord,
      setArrows, setRects,
      setTexts, setMosaics,
      setSelectedArrowIds,
      setSelectedRectIds,
      setSelectedTextIds,
      setSelectedMosaicIds,
      setCropArea, setActiveTool,
      startEditing, applyCrop,
    }
  );

  // ---- Export ----
  const exportResult = useExport({
    exportContainerRef, imageData,
    frameSettings,
    imageDisplaySizeRef,
    arrowsRef, rectsRef,
    textsRef, mosaicsRef,
  });

  useEffect(() => {
    onExportHandlers(exportResult);
  }, [exportResult, onExportHandlers]);

  // ---- Init ----
  useEditorInit(
    {
      source, imageData, initializedRef,
    },
    {
      setSource, setImageData, setError,
      resetHistory: (state) =>
        historyActions.resetToState(
          state as EditorState
        ),
      updateHistoryButtons,
    }
  );

  // ---- Image Load Callbacks ----
  const handleImageSizeChange = useCallback(
    (w: number, h: number) => {
      setImageDisplaySize({
        width: w,
        height: h,
      });
      const container = canvasRef.current;
      if (!container) return;
      const padW = frameSettings.padding.linked
        ? frameSettings.padding.top * 2
        : frameSettings.padding.left +
          frameSettings.padding.right;
      const padH = frameSettings.padding.linked
        ? frameSettings.padding.top * 2
        : frameSettings.padding.top +
          frameSettings.padding.bottom;
      const newOffset = {
        x: (container.clientWidth - w - padW) / 2,
        y:
          (container.clientHeight - h - padH) / 2,
      };
      offsetRef.current = newOffset;
      setOffset(newOffset);
    },
    [
      frameSettings.padding,
      setOffset,
      setImageDisplaySize,
      offsetRef,
    ]
  );

  const handleImageNaturalSizeChange =
    useCallback(
      (w: number, h: number) => {
        setImageNaturalSize({
          width: w,
          height: h,
        });
      },
      [setImageNaturalSize]
    );

  // ---- Mosaic Image Canvas ----
  useEffect(() => {
    if (!imageData || !imageDisplaySize) {
      imageCanvasRef.current = null;
      return;
    }
    const img = new window.Image();
    img.onload = () => {
      const tempCanvas =
        document.createElement('canvas');
      tempCanvas.width = imageDisplaySize.width;
      tempCanvas.height = imageDisplaySize.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(
          img,
          0,
          0,
          imageDisplaySize.width,
          imageDisplaySize.height
        );
        imageCanvasRef.current = tempCanvas;
        renderShapes();
      }
    };
    img.src = imageData;
  }, [imageData, imageDisplaySize, renderShapes]);

  // ---- Render Effects ----
  useEffect(() => {
    renderShapes();
  }, [
    arrows, rects, texts, mosaics,
    selectedArrowIds, selectedRectIds,
    selectedTextIds, selectedMosaicIds,
    renderShapes,
  ]);

  useEffect(() => {
    renderShapes();
  }, [scale, offset, renderShapes]);

  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = annotationCanvasRef.current;
      const container = canvasRef.current;
      if (!canvas || !container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      renderShapes();
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () =>
      window.removeEventListener(
        'resize',
        resizeCanvas
      );
  }, [renderShapes]);

  // ---- Double Click ----
  useEffect(() => {
    const el = canvasRef.current;
    if (!el || !imageData) return;
    const onDoubleClick = (e: MouseEvent) => {
      const coord = screenToImageCoord(
        e.clientX,
        e.clientY
      );
      if (!coord) return;
      if (
        activeTool === 'crop' &&
        cropArea &&
        isPointInCrop(coord.x, coord.y, cropArea)
      ) {
        applyCrop();
        return;
      }
      if (activeTool !== 'select') return;
      const canvas = annotationCanvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;
      for (
        let i = textsRef.current.length - 1;
        i >= 0;
        i--
      ) {
        const text = textsRef.current[i];
        if (
          isPointInText(coord.x, coord.y, text, ctx)
        ) {
          startEditing(text);
          return;
        }
      }
    };
    el.addEventListener('dblclick', onDoubleClick);
    return () =>
      el.removeEventListener(
        'dblclick',
        onDoubleClick
      );
  }, [
    activeTool, imageData,
    screenToImageCoord,
    cropArea, applyCrop,
    startEditing, textsRef,
  ]);

  useEffect(() => {
    if (activeTool !== 'crop' && cropArea) {
      setCropArea(null);
    }
  }, [activeTool, cropArea, setCropArea]);

  // ---- Selected Objects ----
  const selectedArrow = useMemo(
    () =>
      selectedArrowIds.length === 1
        ? arrows.find(
            (a) => a.id === selectedArrowIds[0]
          ) ?? null
        : null,
    [arrows, selectedArrowIds]
  );
  const selectedRect = useMemo(
    () =>
      selectedRectIds.length === 1
        ? rects.find(
            (r) => r.id === selectedRectIds[0]
          ) ?? null
        : null,
    [rects, selectedRectIds]
  );
  const selectedText = useMemo(
    () =>
      selectedTextIds.length === 1
        ? texts.find(
            (t) => t.id === selectedTextIds[0]
          ) ?? null
        : null,
    [texts, selectedTextIds]
  );
  const selectedMosaic = useMemo(
    () =>
      selectedMosaicIds.length === 1
        ? mosaics.find(
            (m) => m.id === selectedMosaicIds[0]
          ) ?? null
        : null,
    [mosaics, selectedMosaicIds]
  );
  const editingText = useMemo(
    () =>
      editingTextId
        ? texts.find(
            (t) => t.id === editingTextId
          ) ?? null
        : null,
    [texts, editingTextId]
  );

  // ---- Render ----
  if (!imageData) return null;

  void selectedArrow;
  void selectedRect;
  void selectedText;
  void selectedMosaic;
  void editingText;
  void imageContainerRef;
  void canUndo;
  void canRedo;

  return (
    <>
      <div
        ref={imageContainerRef}
        className="absolute inset-0"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: '0 0',
        }}
      >
        <FrameContainer
          imageData={imageData}
          imageDisplaySize={imageDisplaySize}
          frameSettings={frameSettings}
          onImageSizeChange={handleImageSizeChange}
          onNaturalSizeChange={
            handleImageNaturalSizeChange
          }
          exportContainerRef={exportContainerRef}
        />
      </div>
      <canvas
        ref={annotationCanvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ pointerEvents: 'auto' }}
      />
      {editingText && (
        <TextEditorInput
          text={editingText}
          value={editingTextValue}
          scale={scale}
          offset={offset}
          inputRef={textInputRef}
          onChange={handleTextChange}
          onSave={() => stopEditing(true)}
          onCancel={() => stopEditing(false)}
        />
      )}
      {activeTool === 'crop' && (
        <CropHint cropArea={cropArea} />
      )}
      <ZoomControls
        scale={scale}
        zoomPercent={zoomPercent}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={resetView}
        onSliderChange={handleSlider}
      />
    </>
  );
}
