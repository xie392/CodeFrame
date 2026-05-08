import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';

interface CropToolbarProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export const CropToolbar: React.FC<CropToolbarProps> = ({
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation('editor');

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-editor-bg)] shadow-lg border border-[var(--color-editor-border)]">
      <button
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-body font-semibold cursor-pointer"
        style={{
          color: 'var(--color-field-focus)',
          background: 'var(--color-editor-hover)',
        }}
        onClick={onConfirm}
      >
        <Check size={14} />
        {t('action.confirm')}
      </button>
      <button
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-body font-semibold cursor-pointer"
        style={{
          color: 'var(--color-editor-hint)',
          background: 'var(--color-editor-hover)',
        }}
        onClick={onCancel}
      >
        <X size={14} />
        {t('action.cancel')}
      </button>
    </div>
  );
};

export default CropToolbar;
