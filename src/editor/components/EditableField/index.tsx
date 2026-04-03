import React, { useState, useEffect, useRef } from 'react';

interface EditableFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  onChange,
}) => {
  const [localValue, setLocalValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  // 同步外部值变化
  useEffect(() => {
    setLocalValue(String(Math.round(value)));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = () => {
    const num = parseInt(localValue, 10);
    if (!isNaN(num)) {
      onChange(num);
    } else {
      setLocalValue(String(Math.round(value)));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  return (
    <div className="flex flex-col gap-1 flex-1">
      <span className="text-[10px] text-[var(--color-editor-hint)] font-body leading-none">
        {label}
      </span>
      <input
        ref={inputRef}
        type="number"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="prop-field h-[32px] rounded-[8px] px-[10px] flex items-center text-[12px] text-foreground font-body leading-none outline-none focus:ring-1 focus:ring-[var(--color-field-focus)]"
        style={{ backgroundColor: '#FAFAFA' }}
      />
    </div>
  );
};

export default EditableField;
