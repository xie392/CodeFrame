import * as React from "react"
import { cn } from "@shared/lib/utils"

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  selectSize?: "default" | "sm"
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className: _className, selectSize = "default", children, ...props }, ref) => {
    return (
      <select
        className={cn(
          "w-full border rounded px-2 outline-none transition-colors cursor-pointer",
          "focus:border-[var(--color-field-focus)]",
          "text-[11px]",
          selectSize === "default"
            ? "h-8 rounded-[8px]"
            : "h-7 rounded-[6px]"
        )}
        style={{
          backgroundColor: "var(--color-field-bg)",
          borderColor: "var(--color-field-border)",
          color: "#333",
        }}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = "Select"

export { Select }
