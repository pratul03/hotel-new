"use client";

import * as React from "react";
import { addDays, format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type { DateRange };

export interface BookingTimes {
  checkInTime: string;
  checkOutTime: string;
}

const DEFAULT_BOOKING_TIMES: BookingTimes = {
  checkInTime: "11:00",
  checkOutTime: "10:00",
};

const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hours = String(Math.floor(index / 2)).padStart(2, "0");
  const minutes = index % 2 === 0 ? "00" : "30";
  const value = `${hours}:${minutes}`;
  const hourNumber = Number(hours);
  const displayHour = hourNumber % 12 === 0 ? 12 : hourNumber % 12;
  const meridiem = hourNumber >= 12 ? "PM" : "AM";

  return {
    value,
    label: `${displayHour}:${minutes} ${meridiem}`,
  };
});

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Minimum selectable date (e.g. today) */
  fromDate?: Date;
  /** Maximum number of days ahead a guest can prebook */
  maxAdvanceDays?: number;
  numberOfMonths?: number;
  enableDragSelect?: boolean;
  checkInTime?: string;
  checkOutTime?: string;
  onTimeChange?: (times: BookingTimes) => void;
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Select dates",
  disabled = false,
  className,
  fromDate,
  maxAdvanceDays = 90,
  numberOfMonths = 2,
  enableDragSelect = false,
  checkInTime,
  checkOutTime,
  onTimeChange,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [draftRange, setDraftRange] = React.useState<DateRange | undefined>(
    value,
  );
  const [times, setTimes] = React.useState<BookingTimes>({
    checkInTime: checkInTime ?? DEFAULT_BOOKING_TIMES.checkInTime,
    checkOutTime: checkOutTime ?? DEFAULT_BOOKING_TIMES.checkOutTime,
  });
  const dragStartRef = React.useRef<Date | null>(null);
  const suppressNextSelectRef = React.useRef(false);

  React.useEffect(() => {
    setDraftRange(value);
  }, [value]);

  React.useEffect(() => {
    setTimes((previous) => ({
      checkInTime: checkInTime ?? previous.checkInTime,
      checkOutTime: checkOutTime ?? previous.checkOutTime,
    }));
  }, [checkInTime, checkOutTime]);

  React.useEffect(() => {
    const clearDrag = () => {
      dragStartRef.current = null;
    };

    window.addEventListener("pointerup", clearDrag);
    window.addEventListener("pointercancel", clearDrag);
    return () => {
      window.removeEventListener("pointerup", clearDrag);
      window.removeEventListener("pointercancel", clearDrag);
    };
  }, []);

  const normalizeDay = React.useCallback((date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }, []);

  const today = React.useMemo(() => normalizeDay(new Date()), [normalizeDay]);
  const minimumSelectableDate = React.useMemo(() => {
    const minDate = fromDate ? normalizeDay(fromDate) : today;
    return minDate > today ? minDate : today;
  }, [fromDate, normalizeDay, today]);
  const maximumSelectableDate = React.useMemo(
    () => addDays(today, maxAdvanceDays),
    [maxAdvanceDays, today],
  );
  const effectiveMinimumSelectableDate = React.useMemo(
    () =>
      minimumSelectableDate > maximumSelectableDate
        ? maximumSelectableDate
        : minimumSelectableDate,
    [maximumSelectableDate, minimumSelectableDate],
  );

  const sanitizeRange = React.useCallback(
    (range: DateRange | undefined): DateRange | undefined => {
      if (!range?.from) {
        return range;
      }

      const clampToBounds = (date: Date) => {
        const normalizedDate = normalizeDay(date);
        if (normalizedDate < effectiveMinimumSelectableDate) {
          return effectiveMinimumSelectableDate;
        }
        if (normalizedDate > maximumSelectableDate) {
          return maximumSelectableDate;
        }
        return normalizedDate;
      };

      const normalizedFrom = clampToBounds(range.from);
      const normalizedTo = range.to ? clampToBounds(range.to) : undefined;

      if (!normalizedTo) {
        return { from: normalizedFrom, to: undefined };
      }

      return normalizedFrom <= normalizedTo
        ? { from: normalizedFrom, to: normalizedTo }
        : { from: normalizedTo, to: normalizedFrom };
    },
    [effectiveMinimumSelectableDate, maximumSelectableDate, normalizeDay],
  );

  const toOrderedRange = React.useCallback(
    (start: Date, end: Date): DateRange => {
      const startDay = normalizeDay(start);
      const endDay = normalizeDay(end);
      return startDay <= endDay
        ? { from: startDay, to: endDay }
        : { from: endDay, to: startDay };
    },
    [normalizeDay],
  );

  const updateRange = React.useCallback(
    (range: DateRange | undefined, closeWhenComplete = false) => {
      const sanitizedRange = sanitizeRange(range);
      setDraftRange(sanitizedRange);
      onChange?.(sanitizedRange);
      if (closeWhenComplete && sanitizedRange?.from && sanitizedRange?.to) {
        setOpen(false);
      }
    },
    [onChange, sanitizeRange],
  );

  const handleTimeUpdate = React.useCallback(
    (key: keyof BookingTimes, selectedValue: string) => {
      setTimes((previous) => {
        const nextTimes = { ...previous, [key]: selectedValue };
        onTimeChange?.(nextTimes);
        return nextTimes;
      });
    },
    [onTimeChange],
  );

  const label =
    draftRange?.from && draftRange?.to
      ? `${format(draftRange.from, "MMM d")} – ${format(
          draftRange.to,
          "MMM d, yyyy",
        )}`
      : draftRange?.from
        ? format(draftRange.from, "MMM d, yyyy")
        : placeholder;

  const DragSelectDayButton = (
    props: React.ComponentProps<typeof CalendarDayButton>,
  ) => {
    const {
      day,
      modifiers,
      onPointerDown,
      onPointerEnter,
      onPointerUp,
      ...rest
    } = props;

    return (
      <CalendarDayButton
        {...rest}
        day={day}
        modifiers={modifiers}
        onPointerDown={(event) => {
          onPointerDown?.(event);
          if (!enableDragSelect || modifiers.disabled || event.button !== 0) {
            return;
          }

          dragStartRef.current = day.date;
          updateRange({ from: normalizeDay(day.date), to: undefined });
        }}
        onPointerEnter={(event) => {
          onPointerEnter?.(event);
          if (
            !enableDragSelect ||
            !dragStartRef.current ||
            modifiers.disabled
          ) {
            return;
          }

          if ((event.buttons & 1) !== 1) {
            return;
          }

          updateRange(toOrderedRange(dragStartRef.current, day.date));
        }}
        onPointerUp={(event) => {
          onPointerUp?.(event);
          if (
            !enableDragSelect ||
            !dragStartRef.current ||
            modifiers.disabled
          ) {
            return;
          }

          const start = normalizeDay(dragStartRef.current);
          const end = normalizeDay(day.date);
          const finalRange: DateRange =
            start.getTime() === end.getTime()
              ? { from: start, to: undefined }
              : toOrderedRange(start, end);

          suppressNextSelectRef.current = true;
          updateRange(finalRange, true);
          dragStartRef.current = null;
        }}
      />
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start gap-2 font-normal",
            !draftRange?.from && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="space-y-0">
          <Calendar
            mode="range"
            selected={draftRange}
            onSelect={(range) => {
              if (suppressNextSelectRef.current) {
                suppressNextSelectRef.current = false;
                return;
              }

              updateRange(range, true);
            }}
            numberOfMonths={numberOfMonths}
            captionLayout="dropdown"
            startMonth={effectiveMinimumSelectableDate}
            endMonth={maximumSelectableDate}
            components={
              enableDragSelect ? { DayButton: DragSelectDayButton } : undefined
            }
            disabled={[
              { before: effectiveMinimumSelectableDate },
              { after: maximumSelectableDate },
            ]}
            initialFocus
          />

          <div className="grid grid-cols-1 gap-3 border-t p-3 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Check-in time
              </p>
              <Select
                value={times.checkInTime}
                onValueChange={(selectedValue) =>
                  handleTimeUpdate("checkInTime", selectedValue)
                }
                disabled={disabled}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((option) => (
                    <SelectItem
                      key={`checkin-${option.value}`}
                      value={option.value}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Check-out time
              </p>
              <Select
                value={times.checkOutTime}
                onValueChange={(selectedValue) =>
                  handleTimeUpdate("checkOutTime", selectedValue)
                }
                disabled={disabled}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((option) => (
                    <SelectItem
                      key={`checkout-${option.value}`}
                      value={option.value}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
