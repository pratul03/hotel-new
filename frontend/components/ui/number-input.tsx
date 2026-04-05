"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { NumericFormat, NumericFormatProps } from "react-number-format";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface NumberInputProps extends Omit<
  NumericFormatProps,
  "value" | "onValueChange" | "defaultValue"
> {
  showSteppers?: boolean;
  stepper?: number;
  thousandSeparator?: string;
  placeholder?: string;
  defaultValue?: number;
  min?: number;
  max?: number;
  value?: number;
  suffix?: string;
  prefix?: string;
  onValueChange?: (value: number | undefined) => void;
  fixedDecimalScale?: boolean;
  decimalScale?: number;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      showSteppers = false,
      stepper,
      thousandSeparator,
      placeholder,
      defaultValue,
      min = -Infinity,
      max = Infinity,
      onValueChange,
      fixedDecimalScale = false,
      decimalScale = 0,
      suffix,
      prefix,
      value: controlledValue,
      className,
      ...props
    },
    ref,
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uncontrolledValue, setUncontrolledValue] = useState<
      number | undefined
    >(controlledValue ?? defaultValue);
    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : uncontrolledValue;

    const commitValue = useCallback(
      (next: number | undefined) => {
        if (!isControlled) {
          setUncontrolledValue(next);
        }
        onValueChange?.(next);
      },
      [isControlled, onValueChange],
    );

    const syncRefs = useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref],
    );

    const handleIncrement = useCallback(() => {
      const next =
        value === undefined
          ? Math.min(stepper ?? 1, max)
          : Math.min(value + (stepper ?? 1), max);
      commitValue(next);
    }, [value, stepper, max, commitValue]);

    const handleDecrement = useCallback(() => {
      const next =
        value === undefined
          ? Math.max(-(stepper ?? 1), min)
          : Math.max(value - (stepper ?? 1), min);
      commitValue(next);
    }, [value, stepper, min, commitValue]);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (document.activeElement === inputRef.current) {
          if (e.key === "ArrowUp") {
            handleIncrement();
          } else if (e.key === "ArrowDown") {
            handleDecrement();
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }, [handleIncrement, handleDecrement]);

    const handleChange = (values: {
      value: string;
      floatValue: number | undefined;
    }) => {
      const newValue =
        values.floatValue === undefined ? undefined : values.floatValue;
      commitValue(newValue);
    };

    const handleBlur = () => {
      if (value !== undefined) {
        if (value < min) {
          commitValue(min);
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          inputRef.current && (inputRef.current.value = String(min));
        } else if (value > max) {
          commitValue(max);
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          inputRef.current && (inputRef.current.value = String(max));
        }
      }
    };

    return (
      <div className="flex items-center">
        <NumericFormat
          value={value}
          onValueChange={handleChange}
          thousandSeparator={thousandSeparator}
          decimalScale={decimalScale}
          fixedDecimalScale={fixedDecimalScale}
          allowNegative={min < 0}
          onBlur={handleBlur}
          max={max}
          min={min}
          suffix={suffix}
          prefix={prefix}
          customInput={Input}
          placeholder={placeholder}
          className={cn(
            "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none relative",
            showSteppers && "rounded-r-none",
            className,
          )}
          getInputRef={syncRefs}
          {...props}
        />

        {showSteppers && (
          <div className="flex flex-col">
            <Button
              type="button"
              aria-label="Increase value"
              className="px-2 h-5 rounded-l-none rounded-br-none border-input border-l-0 border-b-[0.5px] focus-visible:relative"
              variant="outline"
              onClick={handleIncrement}
              disabled={value === max}
            >
              <ChevronUp size={15} />
            </Button>
            <Button
              type="button"
              aria-label="Decrease value"
              className="px-2 h-5 rounded-l-none rounded-tr-none border-input border-l-0 border-t-[0.5px] focus-visible:relative"
              variant="outline"
              onClick={handleDecrement}
              disabled={value === min}
            >
              <ChevronDown size={15} />
            </Button>
          </div>
        )}
      </div>
    );
  },
);

NumberInput.displayName = "NumberInput";
