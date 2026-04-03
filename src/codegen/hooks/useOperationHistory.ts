/**
 * useOperationHistory Hook
 * 管理操作历史的保存和恢复
 */

import { useEffect, useRef, useCallback } from 'react';
import { useSettingsStore } from '@shared/stores/settings-store';
import { useCodegenStore } from '../stores/codegen-store';

export function useOperationHistory() {
  const saveOperationHistory = useSettingsStore((s) => s.settings.saveOperationHistory);
  const operationHistory = useSettingsStore((s) => s.operationHistory);
  const updateOperationHistory = useSettingsStore((s) => s.updateOperationHistory);

  // 标记历史是否已恢复
  const historyRestoredRef = useRef(false);
  // 用于避免重复保存相同状态
  const prevSavedStateRef = useRef<string>('');

  /**
   * 获取当前历史状态（用于保存）
   */
  const getHistoryState = useCallback(() => {
    const state = useCodegenStore.getState();
    return {
      selectedTheme: state.theme.selectedTheme,
      selectedBg: state.theme.selectedBg,
      selectedFont: state.editor.selectedFont,
      fontSize: state.editor.fontSize,
      showLineNumbers: state.editor.showLineNumbers,
      padding: state.window.padding,
      borderRadius: state.window.borderRadius,
      shadowEnabled: state.window.shadowEnabled,
      shadowIntensity: state.window.shadowIntensity,
      showHeader: state.window.showHeader,
      fileName: state.window.fileName,
      watermarkEnabled: state.watermark.enabled,
      watermarkText: state.watermark.text,
      watermarkOpacity: state.watermark.opacity,
    };
  }, []);

  /**
   * 恢复操作历史配置（仅在挂载时执行一次）
   */
  useEffect(() => {
    if (historyRestoredRef.current) return;

    historyRestoredRef.current = true;

    if (!saveOperationHistory || !operationHistory.codegen) {
      return;
    }

    // 从历史记录恢复
    useCodegenStore.getState().restoreFromHistory(operationHistory.codegen as Record<string, unknown>);
  }, [saveOperationHistory, operationHistory.codegen]);

  /**
   * 保存操作历史
   * 使用 store subscription 监听变化，避免 useEffect 依赖问题
   */
  useEffect(() => {
    if (!saveOperationHistory) return;

    // 订阅 store 变化
    const unsubscribe = useCodegenStore.subscribe((state, prevState) => {
      // 检查关键状态是否变化
      const stateChanged =
        state.theme.selectedTheme !== prevState.theme.selectedTheme ||
        state.theme.selectedBg !== prevState.theme.selectedBg ||
        state.editor.selectedFont !== prevState.editor.selectedFont ||
        state.editor.fontSize !== prevState.editor.fontSize ||
        state.editor.showLineNumbers !== prevState.editor.showLineNumbers ||
        JSON.stringify(state.window.padding) !== JSON.stringify(prevState.window.padding) ||
        JSON.stringify(state.window.borderRadius) !== JSON.stringify(prevState.window.borderRadius) ||
        state.window.shadowEnabled !== prevState.window.shadowEnabled ||
        state.window.shadowIntensity !== prevState.window.shadowIntensity ||
        state.window.showHeader !== prevState.window.showHeader ||
        state.window.fileName !== prevState.window.fileName ||
        state.watermark.enabled !== prevState.watermark.enabled ||
        state.watermark.text !== prevState.watermark.text ||
        state.watermark.opacity !== prevState.watermark.opacity;

      if (!stateChanged) return;

      // 等待恢复完成后再保存
      if (!historyRestoredRef.current) return;

      // 序列化当前状态，避免重复保存相同内容
      const currentState = JSON.stringify(getHistoryState());
      if (currentState === prevSavedStateRef.current) return;
      prevSavedStateRef.current = currentState;

      // 保存到 settings store
      updateOperationHistory('codegen', getHistoryState());
    });

    return () => {
      unsubscribe();
    };
  }, [saveOperationHistory, getHistoryState, updateOperationHistory]);

  return {
    historyRestoredRef,
  };
}
