"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Baby, LocateFixed, MapPin, Users, Search } from "lucide-react";
import {
  CalendarRange,
  type DateRange,
} from "@/components/common/CalendarRange";
import { LocationPinPickerDialog } from "./LocationPinPickerDialog";

interface SearchFilters {
  location: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  childCount: number;
  childAges: number[];
  guests: number;
  lat?: number;
  lng?: number;
}

interface HotelSearchBarProps {
  onSearch?: (filters: SearchFilters) => void;
  initialFilters?: Partial<SearchFilters>;
}

export function HotelSearchBar({
  onSearch,
  initialFilters,
}: HotelSearchBarProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    location: "",
    checkIn: "",
    checkOut: "",
    adults: 1,
    childCount: 0,
    childAges: [],
    guests: 1,
    lat: undefined,
    lng: undefined,
  });
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [childAgeInputs, setChildAgeInputs] = useState<string[]>([]);
  const [replaceAdultsOnNextKey, setReplaceAdultsOnNextKey] = useState(false);
  const [replaceChildOnNextKey, setReplaceChildOnNextKey] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);

  useEffect(() => {
    if (!initialFilters) return;

    const adults = initialFilters.adults ?? 1;
    const childCount = initialFilters.childCount ?? 0;
    const childAges = (initialFilters.childAges ?? []).slice(0, childCount);
    while (childAges.length < childCount) childAges.push(0);

    setFilters((prev) => ({
      ...prev,
      location: initialFilters.location ?? "",
      checkIn: initialFilters.checkIn ?? "",
      checkOut: initialFilters.checkOut ?? "",
      adults,
      childCount,
      childAges,
      guests: initialFilters.guests ?? adults + childCount,
      lat: initialFilters.lat,
      lng: initialFilters.lng,
    }));

    setChildAgeInputs(
      childAges.map((age) => (Number.isFinite(age) ? String(age) : "")),
    );

    const fromDate =
      initialFilters.checkIn &&
      Number.isFinite(Date.parse(initialFilters.checkIn))
        ? new Date(initialFilters.checkIn)
        : undefined;
    const toDate =
      initialFilters.checkOut &&
      Number.isFinite(Date.parse(initialFilters.checkOut))
        ? new Date(initialFilters.checkOut)
        : undefined;

    setDateRange(
      fromDate || toDate
        ? {
            from: fromDate,
            to: toDate,
          }
        : undefined,
    );
  }, [initialFilters]);

  const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

  const handleLocationInputChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      location: value,
      lat: undefined,
      lng: undefined,
    }));
  };

  const handleMapLocationConfirm = (selection: {
    lat: number;
    lng: number;
    placeName?: string;
  }) => {
    const placeLabel =
      selection.placeName?.trim() ||
      `Pinned (${selection.lat.toFixed(4)}, ${selection.lng.toFixed(4)})`;

    setFilters((prev) => ({
      ...prev,
      location: placeLabel,
      lat: selection.lat,
      lng: selection.lng,
    }));
  };

  const handleSearch = () => {
    const parsedChildAges = childAgeInputs
      .slice(0, filters.childCount)
      .map((age) => clamp(Number(age) || 0, 0, 16));

    const payload: SearchFilters = {
      ...filters,
      childAges: parsedChildAges,
      guests: filters.adults + filters.childCount,
    };

    onSearch?.(payload);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setFilters((prev) => ({
      ...prev,
      checkIn: range?.from ? format(range.from, "yyyy-MM-dd") : "",
      checkOut: range?.to ? format(range.to, "yyyy-MM-dd") : "",
    }));
  };

  const handleAdultsChange = (value: number | undefined) => {
    if (value === undefined) {
      const adults = 1;
      setFilters((prev) => ({
        ...prev,
        adults,
        guests: adults + prev.childCount,
      }));
      return;
    }

    const normalized = Math.trunc(value);
    if (normalized < 1 || normalized > 16) {
      return;
    }

    const adults = normalized;
    setFilters((prev) => ({
      ...prev,
      adults,
      guests: adults + prev.childCount,
    }));
  };

  const handleChildCountChange = (value: number | undefined) => {
    if (value === undefined) {
      const childCount = 0;

      setChildAgeInputs([]);
      setFilters((prev) => ({
        ...prev,
        childCount,
        guests: prev.adults + childCount,
        childAges: [],
      }));
      return;
    }

    const normalized = Math.trunc(value);
    if (normalized < 0 || normalized > 8) {
      return;
    }

    const childCount = normalized;

    setChildAgeInputs((prev) => {
      const next = prev.slice(0, childCount);
      while (next.length < childCount) next.push("");
      return next;
    });

    setFilters((prev) => ({
      ...prev,
      childCount,
      guests: prev.adults + childCount,
      childAges: prev.childAges.slice(0, childCount),
    }));
  };

  const handleChildAgeChange = (index: number, value: string) => {
    const sanitized = value === "" ? "" : String(clamp(Number(value), 0, 16));

    setChildAgeInputs((prev) => {
      const next = [...prev];
      next[index] = sanitized;
      return next;
    });

    setFilters((prev) => {
      const nextAges = [...prev.childAges];
      nextAges[index] = clamp(Number(sanitized) || 0, 0, 16);
      return {
        ...prev,
        childAges: nextAges.slice(0, prev.childCount),
      };
    });
  };

  const isDigitKey = (key: string) => key >= "0" && key <= "9";

  const handleAdultsKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!replaceAdultsOnNextKey) return;

    if (isDigitKey(e.key)) {
      e.preventDefault();
      handleAdultsChange(Number(e.key));
      setReplaceAdultsOnNextKey(false);
      return;
    }

    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      handleAdultsChange(undefined);
      setReplaceAdultsOnNextKey(false);
    }
  };

  const handleChildKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!replaceChildOnNextKey) return;

    if (isDigitKey(e.key)) {
      e.preventDefault();
      handleChildCountChange(Number(e.key));
      setReplaceChildOnNextKey(false);
      return;
    }

    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      handleChildCountChange(undefined);
      setReplaceChildOnNextKey(false);
    }
  };

  const hasMissingChildAges =
    filters.childCount > 0 &&
    childAgeInputs
      .slice(0, filters.childCount)
      .some((age) => age.trim() === "");

  return (
    <Card className="p-6 bg-linear-to-r from-primary/5 to-primary/10 border-0">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-5">
          <label className="text-xs font-semibold text-muted-foreground mb-2 block">
            Where
          </label>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search locations..."
              value={filters.location}
              onChange={(e) => handleLocationInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              className="pl-10 pr-20 bg-white"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Pick location on map"
              title="Pick location on map"
              onClick={() => setIsMapPickerOpen(true)}
              className="absolute right-8 top-1/2 -translate-y-1/2 h-7 w-7"
            >
              <LocateFixed className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Search"
              onClick={handleSearch}
              disabled={hasMissingChildAges}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="md:col-span-3">
          <label className="text-xs font-semibold text-muted-foreground mb-2 block">
            Check in / Chec;k out
          </label>
          <CalendarRange
            value={dateRange}
            onChange={handleDateRangeChange}
            placeholder="Select check-in and check-out"
            fromDate={new Date()}
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-muted-foreground mb-2 block">
            Adults
          </label>
          <div className="relative">
            <Users className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-black" />
            <NumberInput
              min={1}
              max={16}
              value={filters.adults}
              onValueChange={handleAdultsChange}
              onFocus={(e) => {
                setReplaceAdultsOnNextKey(true);
                requestAnimationFrame(() => e.currentTarget.select());
              }}
              onBlur={() => setReplaceAdultsOnNextKey(false)}
              onKeyDown={handleAdultsKeyDown}
              className="pl-10 bg-white text-black"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-muted-foreground mb-2 block">
            Child
          </label>
          <div className="relative">
            <Baby className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-black" />
            <NumberInput
              min={0}
              max={8}
              value={filters.childCount}
              onValueChange={handleChildCountChange}
              onFocus={(e) => {
                setReplaceChildOnNextKey(true);
                requestAnimationFrame(() => e.currentTarget.select());
              }}
              onBlur={() => setReplaceChildOnNextKey(false)}
              onKeyDown={handleChildKeyDown}
              className="pl-10 bg-white text-black"
            />
          </div>
        </div>
      </div>

      {filters.childCount > 0 && (
        <div className="mt-4 rounded-lg border bg-background/60 p-3">
          <label className="text-xs font-semibold text-muted-foreground mb-2 block">
            Child ages (0-16 years)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
            {Array.from({ length: filters.childCount }).map((_, index) => (
              <NumberInput
                key={`child-age-${index}`}
                min={0}
                max={16}
                placeholder={`Child ${index + 1}`}
                value={
                  childAgeInputs[index] === "" || childAgeInputs[index] == null
                    ? undefined
                    : Number(childAgeInputs[index])
                }
                onValueChange={(value) =>
                  handleChildAgeChange(
                    index,
                    value === undefined ? "" : String(value),
                  )
                }
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Age 16 or below is treated as a child.
          </p>
        </div>
      )}

      <LocationPinPickerDialog
        open={isMapPickerOpen}
        onOpenChange={setIsMapPickerOpen}
        initialCoords={
          filters.lat !== undefined && filters.lng !== undefined
            ? { lat: filters.lat, lng: filters.lng }
            : undefined
        }
        onConfirm={handleMapLocationConfirm}
      />
    </Card>
  );
}
