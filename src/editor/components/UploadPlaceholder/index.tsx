import React, { useRef, useCallback } from 'react';
import type { DragEvent } from 'react';
import { ImagePlus } from 'lucide-react';
import { ACCEPTED_IMAGE_TYPES } from '../../constants';

interface UploadPlaceholderProps {
  onImageLoad: (dataUrl: string) => void;
}

// 工具函数
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function isAcceptedImageType(file: File): boolean {
  return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type);
}

export const UploadPlaceholder: React.FC<UploadPlaceholderProps> = ({
  onImageLoad,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 拖拽事件
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer.files[0];
      if (!file || !isAcceptedImageType(file)) return;
      const dataUrl = await readFileAsDataUrl(file);
      onImageLoad(dataUrl);
    },
    [onImageLoad],
  );

  // 点击上传
  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !isAcceptedImageType(file)) return;
      const dataUrl = await readFileAsDataUrl(file);
      onImageLoad(dataUrl);
    },
    [onImageLoad],
  );

  return (
    <div
      className="flex flex-col items-center justify-center gap-4 cursor-pointer select-none"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <div className="w-[64px] h-[64px] rounded-[16px] flex items-center justify-center bg-[var(--color-editor-upload-bg)]">
        <ImagePlus
          size={28}
          style={{ color: 'var(--color-editor-upload-icon)' }}
        />
      </div>
      <div className="text-center">
        <p className="text-[13px] text-[var(--color-editor-comment)] font-body mb-1">
          // drop image here or paste
        </p>
        <p className="text-[11px] text-[var(--color-editor-hint)] font-body">
          click to browse
        </p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default UploadPlaceholder;
