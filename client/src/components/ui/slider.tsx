import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  showTickMarks?: boolean
  tickInterval?: number
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, showTickMarks = false, tickInterval, min = 0, max = 100, step = 1, ...props }, ref) => {
  // Calculate appropriate tick interval if not provided
  const calculatedTickInterval = React.useMemo(() => {
    if (tickInterval) return tickInterval
    const range = max - min
    if (range <= 100) return 10
    if (range <= 500) return 50
    if (range <= 1000) return 100
    if (range <= 5000) return 500
    return 1000
  }, [tickInterval, min, max])

  // Generate tick marks
  const tickMarks = React.useMemo(() => {
    if (!showTickMarks) return []
    const ticks = []
    for (let value = min; value <= max; value += calculatedTickInterval) {
      const percentage = ((value - min) / (max - min)) * 100
      ticks.push({ value, percentage })
    }
    // Ensure the max value is included if not already
    if (ticks.length > 0 && ticks[ticks.length - 1].value < max) {
      ticks.push({ value: max, percentage: 100 })
    }
    return ticks
  }, [showTickMarks, calculatedTickInterval, min, max])

  return (
    <div className="relative py-3">
      <SliderPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          className
        )}
        min={min}
        max={max}
        step={step}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-3 w-full grow overflow-visible rounded-full bg-background/50 border border-border/50 cursor-pointer">
          <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)]" />
          {/* Tick marks */}
          {showTickMarks && tickMarks.map((tick) => (
            <div
              key={tick.value}
              className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-border/50"
              style={{ left: `${tick.percentage}%` }}
              aria-hidden="true"
            />
          ))}
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb 
          className="block h-[44px] w-[44px] min-h-[44px] min-w-[44px] rounded-full border-2 border-white/20 bg-gradient-to-br from-white to-purple-300 shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all hover:scale-110 hover:shadow-[0_0_35px_rgba(139,92,246,0.7)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-500/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing active:scale-105"
          style={{ minWidth: '44px', minHeight: '44px', width: '44px', height: '44px' }}
          aria-label="Buy-in amount slider" 
        />
      </SliderPrimitive.Root>
      {/* Tick labels (optional) */}
      {showTickMarks && tickMarks.length > 0 && (
        <div className="relative mt-3">
          {tickMarks.filter((_, index, arr) => 
            // Show first, last, and every other tick for cleaner display
            index === 0 || index === arr.length - 1 || (arr.length <= 5 || index % 2 === 0)
          ).map((tick) => (
            <div
              key={tick.value}
              className="absolute text-xs text-muted-foreground -translate-x-1/2"
              style={{ left: `${tick.percentage}%` }}
            >
              ${tick.value}
            </div>
          ))}
        </div>
      )}
    </div>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
