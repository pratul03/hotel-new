"use client";

import { type DateRange } from "react-day-picker";
import {
  DateRangePicker,
  type BookingTimes,
} from "@/components/common/DateRangePicker";

export type { DateRange };
export type { BookingTimes };

interface CalendarRangeProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  fromDate?: Date;
  maxAdvanceDays?: number;
  numberOfMonths?: number;
  enableDragSelect?: boolean;
  checkInTime?: string;
  checkOutTime?: string;
  onTimeChange?: (times: BookingTimes) => void;
}

export function CalendarRange({
  value,
  onChange,
  placeholder = "Select check-in and check-out",
  disabled = false,
  className,
  fromDate,
  maxAdvanceDays = 90,
  numberOfMonths = 1,
  enableDragSelect = true,
  checkInTime,
  checkOutTime,
  onTimeChange,
}: CalendarRangeProps) {
  return (
    <DateRangePicker
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      fromDate={fromDate}
      maxAdvanceDays={maxAdvanceDays}
      numberOfMonths={numberOfMonths}
      enableDragSelect={enableDragSelect}
      checkInTime={checkInTime}
      checkOutTime={checkOutTime}
      onTimeChange={onTimeChange}
    />
  );
}
