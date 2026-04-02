import * as React from "react"
import { cn } from "@shared/lib/utils"

export interface SliderProps {
  label?: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
  className?: string
}

const Slider: React.FC<SliderProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = "",
  className,
}) => {
  const displayValue = step < 1 ? value.toFixed(1) : value

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {label && (
        <span className="text-[11px] text-[var(--color-editor-hint)] font-body leading-none w-12 shrink-0">
          {label}:
        </span>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-1 cursor-pointer"
        style={{ accentColor: 'var(--color-field-focus)' }}
      />
      <span className="text-[11px] text-foreground font-body leading-none w-10 text-right tabular-nums shrink-0">
        {displayValue}{unit}
      </span>
    </div>
  )
}

export { Slider }
