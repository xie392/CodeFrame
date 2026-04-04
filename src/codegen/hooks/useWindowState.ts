/**
 * useWindowState Hook
 * 管理代码窗口状态
 */

import { useCallback, useEffect } from 'react';
import { useDrag } from '@use-gesture/react';
import { useCodegenStore } from '../stores/codegen-store';
import { useCurrentRef } from './useCurrent';
import { calcAutoHeight } from '../utils/layout';
import { MIN_WIN_W, MAX_WIN_W, MAX_WIN_H, DRAG_THRESHOLD_PX } from '../constants';

export function useWindowState() {
  const {
    editor,
    window: windowState,
    isEditing,
    winSize,
    manualResized,
    setIsEditing,
    setWinSize,
    setManualResized,
  } = useCodegenStore();

  const codeRef = useCurrentRef(editor.code);
  const showHeaderRef = useCurrentRef(windowState.showHeader);
  const fontSizeRef = useCurrentRef(editor.fontSize);
  const isEditingRef = useCurrentRef(isEditing);
  const manualResizedRef = useCurrentRef(manualResized);

  /**
   * 计算自适应高度
   */
  const getAutoHeight = useCallback(() => {
    return calcAutoHeight(codeRef.current, showHeaderRef.current, fontSizeRef.current);
  }, [codeRef, showHeaderRef, fontSizeRef]);

  /**
   * 退出编辑模式
   */
  const exitEdit = useCallback(() => {
    setIsEditing(false);
    if (!manualResizedRef.current) {
      setWinSize({
        width: winSize.width,
        height: getAutoHeight(),
      });
    }
  }, [setIsEditing, setWinSize, winSize.width, manualResizedRef, getAutoHeight]);

  const exitEditRef = useCurrentRef(exitEdit);

  /**
   * 进入编辑模式
   */
  const enterEdit = useCallback(() => {
    setIsEditing(true);
    setManualResized(false);
  }, [setIsEditing, setManualResized]);

  /**
   * 自适应高度更新
   */
  useEffect(() => {
    if (!manualResized) {
      setWinSize({
        width: winSize.width,
        height: calcAutoHeight(editor.code, windowState.showHeader, editor.fontSize),
      });
    }
  }, [editor.code, windowState.showHeader, editor.fontSize, manualResized, setWinSize, winSize.width]);

  /**
   * 拖拽调整大小
   */
  const bindResize = useDrag(
    ({ delta: [dx, dy], movement: [mx, my] }) => {
      if (Math.abs(mx) > DRAG_THRESHOLD_PX || Math.abs(my) > DRAG_THRESHOLD_PX) {
        setManualResized(true);
      }
      const currentHeight = calcAutoHeight(
        codeRef.current,
        showHeaderRef.current,
        fontSizeRef.current,
      );
      setWinSize({
        width: Math.min(MAX_WIN_W, Math.max(MIN_WIN_W, winSize.width + dx)),
        height: Math.min(MAX_WIN_H, Math.max(currentHeight, winSize.height + dy)),
      });
    },
    { filterTaps: true },
  );

  return {
    winSize,
    isEditing,
    isEditingRef,
    exitEdit,
    exitEditRef,
    enterEdit,
    bindResize,
    getAutoHeight,
    setWinSize,
  };
}
