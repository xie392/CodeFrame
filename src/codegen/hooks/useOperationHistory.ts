/**
 * useOperationHistory Hook
 * 管理操作历史的保存和恢复
 */

import { useEffect, useRef } from 'react';
import { useSettingsStore } from '@shared/stores/settings-store';
import { useCodegenStore } from '../stores/codegen-store';

export function useOperationHistory() {
  const { settings, operationHistory, updateOperationHistory } = useSettingsStore();
  const { restoreFromHistory, getHistoryState } = useCodegenStore();

  // 标记历史是否已恢复
  const historyRestoredRef = useRef(false);
  // 用于避免重复保存相同状态
  const prevSavedStateRef = useRef<string>('');

  /**
   * 恢复操作历史配置（仅在挂载时执行一次）
   */
  useEffect(() => {
    if (historyRestoredRef.current) return;
    if (!settings.saveOperationHistory || !operationHistory.codegen) {
      historyRestoredRef.current = true;
      return;
    }

    historyRestoredRef.current = true;
    restoreFromHistory(operationHistory.codegen as Record<string, unknown>);
  }, [settings.saveOperationHistory, operationHistory.codegen, restoreFromHistory]);

  /**
   * 保存操作历史（仅在恢复完成后，且配置实际变化时保存）
   */
  useEffect(() => {
    if (!settings.saveOperationHistory || !historyRestoredRef.current) return;

    // 序列化当前状态，避免重复保存相同内容
    const currentState = JSON.stringify(getHistoryState());

    if (currentState === prevSavedStateRef.current) return;
    prevSavedStateRef.current = currentState;

    updateOperationHistory('codegen', getHistoryState());
  }, [
    settings.saveOperationHistory,
    // 监听所有可能变化的状态
    useCodegenStore.getState().theme,
    useCodegenStore.getState().window,
    useCodegenStore.getState().editor,
    useCodegenStore.getState().watermark,
    getHistoryState,
    updateOperationHistory,
  ]);

  return {
    historyRestoredRef,
  };
}
