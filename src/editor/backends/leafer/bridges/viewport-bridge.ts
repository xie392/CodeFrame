/**
 * 视口状态双向同步桥接
 * Store scale/offset ↔ Leafer zoomLayer
 */

import type { ViewportState } from '../../types';

export class ViewportBridge {
  private syncing = false;
  private onViewportChange:
    | ((state: ViewportState) => void)
    | null = null;

  isSyncing(): boolean {
    return this.syncing;
  }

  /** Store → Leafer 视口同步 */
  syncViewportToBackend(
    state: ViewportState,
    zoomLayer: { x: number; y: number; scale: number }
  ): void {
    this.syncing = true;
    try {
      zoomLayer.x = state.offset.x;
      zoomLayer.y = state.offset.y;
      zoomLayer.scale = state.scale;
    } finally {
      this.syncing = false;
    }
  }

  /** 注册 Leafer → Store 视口回调 */
  onViewportChangeCallback(
    callback: (state: ViewportState) => void
  ): void {
    this.onViewportChange = callback;
  }

  /** Leafer 视口变化时调用 */
  handleLeaferViewportChange(
    state: ViewportState
  ): void {
    if (this.syncing) return;
    this.onViewportChange?.(state);
  }
}
