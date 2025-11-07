import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-sm whitespace-nowrap rounded-md text-sm font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0" +
  " hover-elevate active-elevate-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border border-primary-border",
        destructive:
          "bg-destructive text-destructive-foreground border border-destructive-border",
        outline:
          // Shows the background color of whatever card / sidebar / accent background it is inside of.
          // Inherits the current text color.
          " border [border-color:var(--button-outline)]  shadow-xs active:shadow-none ",
        secondary: "border bg-secondary text-secondary-foreground border border-secondary-border ",
        // Add a transparent border so that when someone toggles a border on later, it doesn't shift layout/size.
        ghost: "border border-transparent",
        // Neon variants for crypto/Web3 aesthetic
        "neon-primary": "neon-button-primary no-default-hover-elevate no-default-active-elevate",
        "neon-secondary": "neon-button-secondary no-default-hover-elevate no-default-active-elevate",
        "neon-outline": "neon-button-outline no-default-hover-elevate no-default-active-elevate",
        "neon-ghost": "neon-button-ghost no-default-hover-elevate no-default-active-elevate",
        "neon-destructive": "neon-button-destructive no-default-hover-elevate no-default-active-elevate",
        "neon-icon": "neon-button-icon no-default-hover-elevate no-default-active-elevate",
        "neon-quick": "neon-button-quick no-default-hover-elevate no-default-active-elevate",
        "neon-toggle": "neon-button-toggle no-default-hover-elevate no-default-active-elevate",
        "neon-cyan": "neon-button-cyan no-default-hover-elevate no-default-active-elevate",
      },
      // Heights are set as "min" heights, because sometimes Ai will place large amount of content
      // inside buttons. With a min-height they will look appropriate with small amounts of content,
      // but will expand to fit large amounts of content.
      size: {
        default: "min-h-[48px] px-4 py-2", // 48px minimum for mobile
        sm: "min-h-[44px] rounded-md px-3 text-sm", // 44px for secondary actions  
        lg: "min-h-[56px] rounded-md px-8", // 56px for primary actions (Apple HIG requirement)
        icon: "h-[48px] w-[48px]", // 48x48px for icon buttons
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
