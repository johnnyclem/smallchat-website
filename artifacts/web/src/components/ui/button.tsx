import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Buttons: the primary is an off-white from the ramp with dark text, so the accent
 * stays free for the one thing that is chosen. The secondary is the raised surface
 * with a hairline. Press scales down a hair, hover is a surface step.
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium cursor-pointer select-none transition-[color,background-color,border-color,transform] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background hover:bg-foreground/90",
        outline: "border border-border-strong bg-raised text-foreground hover:bg-raised-hover",
        glass: "border border-border-strong bg-raised text-foreground hover:bg-raised-hover",
        ghost: "text-subtle hover:bg-raised hover:text-foreground",
        link: "text-foreground underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 text-sm",
        sm: "h-8 px-3 text-sm",
        lg: "h-12 px-5 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";

export { Button };
