"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { HotelSearchBar } from "@/components/hotels/HotelSearchBar";
import { HotelCard } from "@/components/hotels/HotelCard";
import { HotelResultsMap } from "@/components/hotels/HotelResultsMap";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { Skeleton } from "@/components/ui/skeleton";
import { useHotels } from "@/hooks/useHotels";
import { ChevronLeft } from "lucide-react";

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 flex justify-center">
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const location = searchParams.get("location") || "";
  const checkIn = searchParams.get("checkIn") || undefined;
  const checkOut = searchParams.get("checkOut") || undefined;
  const adults = searchParams.get("adults")
    ? Number(searchParams.get("adults"))
    : undefined;
  const childCount = searchParams.get("childCount")
    ? Number(searchParams.get("childCount"))
    : undefined;
  const childAges = searchParams.get("childAges")
    ? searchParams
        .get("childAges")!
        .split(",")
        .map((age) => Number(age))
        .filter((age) => Number.isFinite(age))
    : undefined;
  const guests = searchParams.get("guests")
    ? Number(searchParams.get("guests"))
    : undefined;
  const minPriceParam = searchParams.get("minPrice");
  const maxPriceParam = searchParams.get("maxPrice");
  const instantBookingParam = searchParams.get("instantBooking") || "any";
  const minRatingParam = searchParams.get("minRating");
  const accessibilityParam = searchParams.get("accessibility") || "";
  const sortByParam = searchParams.get("sortBy") || "recommended";
  const viewParam = searchParams.get("view") || "list";
  const northParam = searchParams.get("north");
  const southParam = searchParams.get("south");
  const eastParam = searchParams.get("east");
  const westParam = searchParams.get("west");
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");

  const parsedLat = latParam ? Number(latParam) : undefined;
  const parsedLng = lngParam ? Number(lngParam) : undefined;
  const searchLat =
    parsedLat !== undefined && Number.isFinite(parsedLat)
      ? parsedLat
      : undefined;
  const searchLng =
    parsedLng !== undefined && Number.isFinite(parsedLng)
      ? parsedLng
      : undefined;
  const isPinnedLocationSearch =
    searchLat !== undefined && searchLng !== undefined;

  const [minPrice, setMinPrice] = useState(minPriceParam || "");
  const [maxPrice, setMaxPrice] = useState(maxPriceParam || "");
  const [instantBooking, setInstantBooking] = useState(instantBookingParam);
  const [minRating, setMinRating] = useState(minRatingParam || "");
  const [accessibility, setAccessibility] = useState(accessibilityParam);
  const [sortBy, setSortBy] = useState(sortByParam);
  const [view, setView] = useState(viewParam === "map" ? "map" : "list");

  const initialSearchFilters = useMemo(
    () => ({
      location,
      checkIn: checkIn ?? "",
      checkOut: checkOut ?? "",
      adults: adults ?? 1,
      childCount: childCount ?? 0,
      childAges: childAges ?? [],
      guests: guests ?? (adults ?? 1) + (childCount ?? 0),
      lat: searchLat,
      lng: searchLng,
    }),
    [
      location,
      checkIn,
      checkOut,
      adults,
      childCount,
      childAges,
      guests,
      searchLat,
      searchLng,
    ],
  );

  useEffect(() => {
    setMinPrice(minPriceParam || "");
    setMaxPrice(maxPriceParam || "");
    setInstantBooking(instantBookingParam);
    setMinRating(minRatingParam || "");
    setAccessibility(accessibilityParam);
    setSortBy(sortByParam);
    setView(viewParam === "map" ? "map" : "list");
  }, [
    minPriceParam,
    maxPriceParam,
    instantBookingParam,
    minRatingParam,
    accessibilityParam,
    sortByParam,
    viewParam,
  ]);

  // Default coords (India center) when no specific location
  const { data, isLoading } = useHotels({
    lat: searchLat ?? 20.5937,
    lng: searchLng ?? 78.9629,
    radiusKm: isPinnedLocationSearch ? 40 : 10000,
    checkIn,
    checkOut,
    adults,
    childCount,
    childAges,
    guests,
    minPrice: minPriceParam ? Number(minPriceParam) : undefined,
    maxPrice: maxPriceParam ? Number(maxPriceParam) : undefined,
    instantBooking:
      instantBookingParam === "any"
        ? undefined
        : instantBookingParam === "true",
    minRating: minRatingParam ? Number(minRatingParam) : undefined,
    accessibility: accessibilityParam
      ? (accessibilityParam as
          | "wheelchair_accessible"
          | "step_free_entry"
          | "accessible_parking")
      : undefined,
    sortBy: sortByParam as
      | "recommended"
      | "price_asc"
      | "price_desc"
      | "rating_desc",
    north: northParam ? Number(northParam) : undefined,
    south: southParam ? Number(southParam) : undefined,
    east: eastParam ? Number(eastParam) : undefined,
    west: westParam ? Number(westParam) : undefined,
    limit: 20,
  });

  const hotels = data?.data ?? [];

  const filteredHotels =
    location && !isPinnedLocationSearch
      ? hotels.filter(
          (h) =>
            h.location.toLowerCase().includes(location.toLowerCase()) ||
            h.name.toLowerCase().includes(location.toLowerCase()),
        )
      : hotels;

  const handleSearch = (filters: {
    location: string;
    checkIn: string;
    checkOut: string;
    adults: number;
    childCount: number;
    childAges: number[];
    guests: number;
    lat?: number;
    lng?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters.location) params.set("location", filters.location);
    if (filters.checkIn) params.set("checkIn", filters.checkIn);
    if (filters.checkOut) params.set("checkOut", filters.checkOut);
    if (filters.adults > 0) params.set("adults", String(filters.adults));
    if (filters.childCount > 0) {
      params.set("childCount", String(filters.childCount));
      params.set("childAges", filters.childAges.join(","));
    }
    if (filters.guests > 1) params.set("guests", String(filters.guests));
    if (filters.lat !== undefined && filters.lng !== undefined) {
      params.set("lat", String(filters.lat));
      params.set("lng", String(filters.lng));
    }
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (instantBooking !== "any") params.set("instantBooking", instantBooking);
    if (minRating) params.set("minRating", minRating);
    if (accessibility) params.set("accessibility", accessibility);
    if (sortBy && sortBy !== "recommended") params.set("sortBy", sortBy);
    router.push(`/search?${params.toString()}`);
  };

  const applyAdvancedFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (minPrice) params.set("minPrice", minPrice);
    else params.delete("minPrice");

    if (maxPrice) params.set("maxPrice", maxPrice);
    else params.delete("maxPrice");

    if (instantBooking !== "any") params.set("instantBooking", instantBooking);
    else params.delete("instantBooking");

    if (minRating) params.set("minRating", minRating);
    else params.delete("minRating");

    if (accessibility) params.set("accessibility", accessibility);
    else params.delete("accessibility");

    if (sortBy !== "recommended") params.set("sortBy", sortBy);
    else params.delete("sortBy");

    if (view === "map") params.set("view", "map");
    else params.delete("view");

    router.push(`/search?${params.toString()}`);
  };

  const setViewMode = (nextView: "list" | "map") => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextView === "map") params.set("view", "map");
    else params.delete("view");
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <div className="space-y-6">
          <Button variant="ghost" size="sm" asChild className="w-fit">
            <Link href="/" className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>

          <div>
            <h1 className="text-3xl font-bold">Search Results</h1>
            <p className="text-muted-foreground">
              {isPinnedLocationSearch
                ? "Showing hotels near your pinned map location"
                : location
                  ? `Showing results for "${location}"`
                  : "All available properties"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={view === "list" ? "default" : "outline"}
              onClick={() => setViewMode("list")}
            >
              List View
            </Button>
            <Button
              type="button"
              variant={view === "map" ? "default" : "outline"}
              onClick={() => setViewMode("map")}
            >
              Map View
            </Button>
          </div>

          <HotelSearchBar
            onSearch={handleSearch}
            initialFilters={initialSearchFilters}
          />

          <div className="rounded-xl border bg-card p-4">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Min price
                </label>
                <NumberInput
                  min={0}
                  value={minPrice === "" ? undefined : Number(minPrice)}
                  onValueChange={(value) =>
                    setMinPrice(value === undefined ? "" : String(value))
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Max price
                </label>
                <NumberInput
                  min={0}
                  value={maxPrice === "" ? undefined : Number(maxPrice)}
                  onValueChange={(value) =>
                    setMaxPrice(value === undefined ? "" : String(value))
                  }
                  placeholder="50000"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Instant booking
                </label>
                <select
                  value={instantBooking}
                  onChange={(e) => setInstantBooking(e.target.value)}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="any">Any</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Min rating
                </label>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">Any</option>
                  <option value="4.5">4.5+</option>
                  <option value="4">4.0+</option>
                  <option value="3.5">3.5+</option>
                  <option value="3">3.0+</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Sort by
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="recommended">Recommended</option>
                  <option value="price_asc">Price: low to high</option>
                  <option value="price_desc">Price: high to low</option>
                  <option value="rating_desc">Top rated</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Accessibility
                </label>
                <select
                  value={accessibility}
                  onChange={(e) => setAccessibility(e.target.value)}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">Any</option>
                  <option value="wheelchair_accessible">
                    Wheelchair accessible
                  </option>
                  <option value="step_free_entry">Step-free entry</option>
                  <option value="accessible_parking">Accessible parking</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button onClick={applyAdvancedFilters} className="w-full">
                  Apply filters
                </Button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : filteredHotels.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">No properties found.</p>
              <p className="text-sm mt-1">
                Try adjusting your search criteria.
              </p>
            </div>
          ) : view === "map" ? (
            <HotelResultsMap
              hotels={filteredHotels}
              onSelect={(hotelId) => router.push(`/hotels/${hotelId}`)}
              onSearchArea={(bounds) => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("north", String(bounds.north));
                params.set("south", String(bounds.south));
                params.set("east", String(bounds.east));
                params.set("west", String(bounds.west));
                params.set("view", "map");
                router.push(`/search?${params.toString()}`);
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredHotels.map((hotel) => (
                <HotelCard
                  key={hotel.id}
                  hotel={hotel}
                  onViewDetails={(id) => {
                    router.push(`/hotels/${id}`);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
