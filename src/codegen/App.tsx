/**
 * CodeGen 主组件
 * 代码截图工具入口
 */

import React, { useRef, useEffect } from 'react';
import { useCodegenStore } from './stores/codegen-store';
import { useWindowState, useExport, useOperationHistory } from './hooks';
import { LeftPanel, CanvasArea } from './components';
import { MAIN_CONTAINER_STYLE } from './constants';
import { calcAutoHeight } from './utils/layout';
import { DEFAULT_CODE } from './constants';

const App: React.FC = () => {
  // Refs
  const exportRef = useRef<HTMLDivElement>(null);
  const codeWindowRef = useRef<HTMLDivElement>(null);

  // Store 状态
  const { setWinSize } = useCodegenStore();

  // 操作历史
  useOperationHistory();

  // 窗口状态
  const {
    isEditing,
    isEditingRef,
    exitEdit,
    exitEditRef,
    enterEdit,
    bindResize,
  } = useWindowState();

  // 导出功能
  const {
    isExporting,
    copied,
    handleExportImage,
    handleCopyToClipboard,
    cancel: cancelExport,
  } = useExport({
    exportRef,
    isEditingRef,
    exitEditRef,
  });

  // 组件卸载时取消异步操作
  useEffect(() => {
    return () => {
      cancelExport();
    };
  }, [cancelExport]);

  // 自适应高度初始化
  useEffect(() => {
    setWinSize({
      width: 520,
      height: calcAutoHeight(DEFAULT_CODE, true, 13),
    });
  }, [setWinSize]);

  return (
    <div
      className="w-screen h-screen flex font-body"
      style={MAIN_CONTAINER_STYLE}
    >
      {/* 左侧控制面板 */}
      <LeftPanel
        isExporting={isExporting}
        copied={copied}
        onExport={handleExportImage}
        onCopy={handleCopyToClipboard}
      />

      {/* 画布区域 */}
      <CanvasArea
        onExportRef={exportRef}
        onCodeWindowRef={codeWindowRef}
        isEditing={isEditing}
        isEditingRef={isEditingRef}
        onExitEdit={exitEdit}
        onEnterEdit={enterEdit}
        bindResize={bindResize}
      />
    </div>
  );
};

export default App;
