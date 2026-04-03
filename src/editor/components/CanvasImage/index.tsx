import React from 'react';
import { MAX_IMG_W, MAX_IMG_H } from '../../constants';

interface CanvasImageProps {
  src: string;
  onSizeChange?: (w: number, h: number) => void;
  onNaturalSizeChange?: (w: number, h: number) => void;
}

export const CanvasImage: React.FC<CanvasImageProps> = ({
  src,
  onSizeChange,
  onNaturalSizeChange,
}) => {
  return (
    <img
      src={src}
      alt="编辑图片"
      onLoad={(e) => {
        const img = e.currentTarget;
        const nw = img.naturalWidth;
        const nh = img.naturalHeight;
        // 返回原始尺寸
        onNaturalSizeChange?.(nw, nh);
        // 计算实际显示尺寸（保持宽高比）
        const maxW = Math.min(MAX_IMG_W, nw);
        const maxH = Math.min(MAX_IMG_H, nh);
        const ratio = Math.min(maxW / nw, maxH / nh);
        const displayW = nw * ratio;
        const displayH = nh * ratio;
        onSizeChange?.(displayW, displayH);
      }}
      className="rounded-[8px] shadow-lg"
      draggable={false}
      style={{
        maxWidth: MAX_IMG_W,
        maxHeight: MAX_IMG_H,
        objectFit: 'contain',
      }}
    />
  );
};

export default CanvasImage;
