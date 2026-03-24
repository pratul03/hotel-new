"use client";

import * as React from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type { DateRange };

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Minimum selectable date (e.g. today) */
  fromDate?: Date;
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Select dates",
  disabled = false,
  className,
  fromDate,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const label =
    value?.from && value?.to
      ? `${format(value.from, "MMM d")} – ${format(value.to, "MMM d, yyyy")}`
      : value?.from
        ? format(value.from, "MMM d, yyyy")
        : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start gap-2 font-normal",
            !value?.from && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={value}
          onSelect={(range) => {
            onChange?.(range);
            // close only when both dates are selected
            if (range?.from && range?.to) setOpen(false);
          }}
          numberOfMonths={2}
          disabled={fromDate ? { before: fromDate } : undefined}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
