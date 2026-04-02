import * as React from "react"
import { Palette } from "lucide-react"
import { cn } from "@shared/lib/utils"

export interface ColorPickerProps {
  colors: string[]
  value: string
  onChange: (color: string) => void
  showCustom?: boolean
  className?: string
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  colors,
  value,
  onChange,
  showCustom = true,
  className,
}) => {
  const customInputRef = React.useRef<HTMLInputElement>(null)
  const [isCustom, setIsCustom] = React.useState(false)

  const handleCustomClick = () => {
    customInputRef.current?.click()
  }

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsCustom(true)
    onChange(e.target.value)
  }

  return (
    <div className={cn("flex gap-1 flex-wrap", className)}>
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => {
            setIsCustom(false)
            onChange(color)
          }}
          className={cn(
            "w-6 h-6 rounded-full shrink-0 cursor-pointer transition-transform hover:scale-110"
          )}
          style={{
            backgroundColor: color,
            border: value === color && !isCustom
              ? "2px solid var(--color-field-focus)"
              : "2px solid transparent",
          }}
        />
      ))}
      {showCustom && (
        <button
          type="button"
          onClick={handleCustomClick}
          className={cn(
            "w-6 h-6 rounded-full shrink-0 cursor-pointer overflow-hidden flex items-center justify-center"
          )}
          style={{
            border: isCustom
              ? "2px solid var(--color-field-focus)"
              : "2px solid var(--color-field-border)",
          }}
        >
          {isCustom && value && !colors.includes(value) ? (
            <div
              className="w-full h-full"
              style={{ backgroundColor: value }}
            />
          ) : (
            <Palette size={12} style={{ color: "#999" }} />
          )}
          <input
            ref={customInputRef}
            type="color"
            value={value}
            onChange={handleCustomChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </button>
      )}
    </div>
  )
}

export { ColorPicker }
