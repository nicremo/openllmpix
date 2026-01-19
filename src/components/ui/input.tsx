import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, style, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border px-3 py-1 text-base shadow-sm transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        style={{
          background: 'var(--bg-base)',
          borderColor: 'var(--border-default)',
          color: 'var(--text-primary)',
          outline: 'none',
          ...style,
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#f59e0b'
          e.target.style.boxShadow = '0 0 0 1px #f59e0b'
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--border-default)'
          e.target.style.boxShadow = 'none'
        }}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
