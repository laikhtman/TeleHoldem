import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";

interface NumberInputProps extends Omit<React.ComponentProps<"input">, "type" | "onChange"> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  helperText?: string;
  errorMessage?: string;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      className,
      value,
      onChange,
      min = 0,
      max = Number.MAX_SAFE_INTEGER,
      step = 1,
      prefix,
      suffix,
      placeholder,
      helperText,
      errorMessage,
      disabled,
      ...props
    },
    ref
  ) => {
    const handleIncrement = () => {
      const newValue = Math.min(max, value + step);
      onChange(newValue);
    };

    const handleDecrement = () => {
      const newValue = Math.max(min, value - step);
      onChange(newValue);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Allow empty input temporarily
      if (inputValue === "") {
        onChange(min);
        return;
      }
      
      const numValue = parseFloat(inputValue);
      if (!isNaN(numValue)) {
        const clampedValue = Math.min(max, Math.max(min, numValue));
        onChange(clampedValue);
      }
    };

    const handleBlur = () => {
      // Ensure value is within bounds on blur
      if (value < min) onChange(min);
      if (value > max) onChange(max);
    };

    return (
      <div className="space-y-1">
        <div className="relative">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={handleDecrement}
              disabled={disabled || value <= min}
              className="h-12 w-12 shrink-0"
              data-testid={`button-decrement-${props.name || props.id}`}
              tabIndex={-1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            
            <div className="relative flex-1">
              {prefix && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base font-medium pointer-events-none">
                  {prefix}
                </span>
              )}
              <input
                ref={ref}
                type="number"
                value={value}
                onChange={handleInputChange}
                onBlur={handleBlur}
                min={min}
                max={max}
                step={step}
                disabled={disabled}
                placeholder={placeholder}
                className={cn(
                  "flex h-12 w-full rounded-md border border-input bg-background px-3 py-3 text-base ring-offset-background",
                  "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
                  "placeholder:text-muted-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                  prefix && "pl-8",
                  suffix && "pr-12",
                  errorMessage && "border-destructive focus-visible:ring-destructive",
                  className
                )}
                {...props}
              />
              {suffix && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                  {suffix}
                </span>
              )}
            </div>
            
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={handleIncrement}
              disabled={disabled || value >= max}
              className="h-12 w-12 shrink-0"
              data-testid={`button-increment-${props.name || props.id}`}
              tabIndex={-1}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {helperText && !errorMessage && (
          <p className="text-sm text-muted-foreground" id={`${props.id || props.name}-helper`}>
            {helperText}
          </p>
        )}
        
        {errorMessage && (
          <p className="text-sm text-destructive" id={`${props.id || props.name}-error`} role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

NumberInput.displayName = "NumberInput";

export { NumberInput };