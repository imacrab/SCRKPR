import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    (<input
      type={type}
      className={cn(
        "flex h-[54px] w-full rounded-xl border-3 border-ink bg-surface px-3.5 text-lg font-bold text-fg transition-shadow file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-faint placeholder:font-semibold focus-visible:outline-none focus-visible:shadow-neo disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props} />)
  );
})
Input.displayName = "Input"

export { Input }
