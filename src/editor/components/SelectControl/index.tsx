import React from 'react';
import { useTranslation } from 'react-i18next';

interface SelectControlProps {
  value: string;
  options: { name: string; value: string }[];
  onChange: (value: string) => void;
}

export const SelectControl: React.FC<SelectControlProps> = ({
  value,
  options,
  onChange,
}) => {
  const { t } = useTranslation('editor');

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="prop-field-sm h-[28px] px-2 rounded-[6px] text-[11px] font-body text-foreground cursor-pointer outline-none"
      style={{ backgroundColor: '#FAFAFA' }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-white">
          {t(opt.name)}
        </option>
      ))}
    </select>
  );
};

export default SelectControl;
