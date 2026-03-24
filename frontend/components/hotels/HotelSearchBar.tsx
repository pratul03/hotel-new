"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Calendar, Users, Search } from "lucide-react";

interface SearchFilters {
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}

interface HotelSearchBarProps {
  onSearch?: (filters: SearchFilters) => void;
}

export function HotelSearchBar({ onSearch }: HotelSearchBarProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    location: "",
    checkIn: "",
    checkOut: "",
    guests: 1,
  });

  const handleChange = (key: keyof SearchFilters, value: unknown) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSearch = () => {
    onSearch?.(filters);
  };

  return (
    <Card className="p-6 bg-linear-to-r from-primary/5 to-primary/10 border-0">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-2 block">
            Where
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search locations..."
              value={filters.location}
              onChange={(e) => handleChange("location", e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-2 block">
            Check in
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={filters.checkIn}
              onChange={(e) => handleChange("checkIn", e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-2 block">
            Check out
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={filters.checkOut}
              onChange={(e) => handleChange("checkOut", e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-2 block">
            Guests
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              min="1"
              max="8"
              value={filters.guests}
              onChange={(e) => handleChange("guests", parseInt(e.target.value))}
              className="pl-10"
            />
          </div>
        </div>

        <Button onClick={handleSearch} className="w-full gap-2">
          <Search className="h-4 w-4" />
          Search
        </Button>
      </div>
    </Card>
  );
}
