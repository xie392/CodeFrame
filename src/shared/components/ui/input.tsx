import * as React from "react"
import { cn } from "@shared/lib/utils"

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  inputSize?: "default" | "sm"
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, inputSize = "default", type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "w-full border rounded outline-none transition-colors",
          "focus:border-[var(--color-field-focus)]",
          "text-[11px] tabular-nums",
          inputSize === "default"
            ? "h-8 rounded-[8px] px-2"
            : "h-7 rounded-[6px] px-2",
          className
        )}
        style={{
          backgroundColor: "var(--color-field-bg)",
          borderColor: "var(--color-field-border)",
          color: "#333",
        }}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
