import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "neo-press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border-3 border-ink font-extrabold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:pointer-events-none disabled:bg-putty disabled:text-faint disabled:border-dashed disabled:border-faint disabled:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-sun text-ink shadow-neo",
        outline: "bg-surface text-fg shadow-neo",
        secondary: "bg-surface text-fg shadow-neo",
        destructive: "bg-danger text-ink shadow-neo",
        success: "bg-success text-ink shadow-neo",
        ghost: "border-transparent bg-transparent text-fg shadow-none",
        link: "border-transparent bg-transparent text-fg shadow-none underline decoration-2 underline-offset-4",
      },
      size: {
        default: "h-[58px] px-5 text-[17px]",
        sm: "h-10 px-3.5 text-sm rounded-[10px] border-2.5 shadow-neo-sm",
        lg: "h-16 px-6 text-xl rounded-[14px] shadow-neo-lg",
        icon: "h-[58px] w-[58px] p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
