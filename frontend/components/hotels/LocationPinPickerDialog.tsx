"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Navigation } from "lucide-react";

import { Button } from "@/components/ui/button";
import axiosInstance from "@/lib/axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Coordinates {
  lat: number;
  lng: number;
}

interface LocationPinPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCoords?: Coordinates;
  onConfirm: (selection: Coordinates & { placeName?: string }) => void;
}

const DEFAULT_CENTER: Coordinates = {
  lat: 20.5937,
  lng: 78.9629,
};

const GEOLOCATION_PERMISSION_DENIED = 1;
const GEOLOCATION_POSITION_UNAVAILABLE = 2;
const GEOLOCATION_TIMEOUT = 3;
const GEOLOCATION_MAX_ATTEMPTS = 3;

function getGeolocationErrorMessage(code: number): string {
  if (code === GEOLOCATION_PERMISSION_DENIED) {
    return "Location permission is blocked. Browser will not show the popup again until you re-enable location for this site.";
  }

  if (code === GEOLOCATION_POSITION_UNAVAILABLE) {
    return "Your location is temporarily unavailable (CoreLocation kCLErrorLocationUnknown). Please try again in a moment.";
  }

  if (code === GEOLOCATION_TIMEOUT) {
    return "Timed out while fetching location. Please try again.";
  }

  return "Could not fetch your current location.";
}

function getPermissionResetHelp(): string {
  return "To re-enable: click the lock icon in the address bar and allow Location for this site, then check macOS System Settings > Privacy & Security > Location Services.";
}

function requestCurrentPosition(
  options: PositionOptions,
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

async function requestApproxLocationFromIp(): Promise<{
  lat: number;
  lng: number;
  label?: string;
}> {
  const response = await fetch("https://ipapi.co/json/", {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("IP geolocation request failed");
  }

  const payload = (await response.json()) as {
    latitude?: number;
    longitude?: number;
    city?: string;
    region?: string;
    country_name?: string;
  };

  if (
    !Number.isFinite(payload.latitude) ||
    !Number.isFinite(payload.longitude)
  ) {
    throw new Error("IP geolocation payload missing coordinates");
  }

  const label = [payload.city, payload.region, payload.country_name]
    .filter(Boolean)
    .join(", ");

  return {
    lat: Number(payload.latitude),
    lng: Number(payload.longitude),
    label: label || undefined,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function isRetryableLocationError(code: number): boolean {
  return (
    code === GEOLOCATION_POSITION_UNAVAILABLE || code === GEOLOCATION_TIMEOUT
  );
}

async function requestFreshLocationWithRetries(): Promise<GeolocationPosition> {
  let lastError: GeolocationPositionError | null = null;

  for (let attempt = 0; attempt < GEOLOCATION_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await requestCurrentPosition({
        enableHighAccuracy: attempt === 0,
        timeout: attempt === 0 ? 8000 : 12000,
        // Force a fresh sensor read every attempt (no cached location).
        maximumAge: 0,
      });
    } catch (error) {
      const geoError = error as GeolocationPositionError;
      lastError = geoError;

      const isLastAttempt = attempt === GEOLOCATION_MAX_ATTEMPTS - 1;
      if (!isRetryableLocationError(geoError.code) || isLastAttempt) {
        break;
      }

      await delay(1000);
    }
  }

  throw lastError ?? new Error("Unknown geolocation error");
}

function getPlaceStatusMessage(
  isResolvingPlaceName: boolean,
  selectedPlaceName: string | null,
): string {
  if (isResolvingPlaceName) {
    return "Finding place name...";
  }

  if (selectedPlaceName) {
    return selectedPlaceName;
  }

  return "Place name not available for this pin.";
}

function getAvailabilityStatusMessage(
  isCheckingAvailability: boolean,
  availabilityError: string | null,
  availableHotelsCount: number | null,
): string {
  if (isCheckingAvailability) {
    return "Checking hotel availability...";
  }

  if (availabilityError) {
    return availabilityError;
  }

  if (availableHotelsCount === null) {
    return "Pick a pin to check hotel availability.";
  }

  if (availableHotelsCount > 0) {
    return `${availableHotelsCount} hotel${availableHotelsCount === 1 ? "" : "s"} found near this location.`;
  }

  return "No hotels found near this location right now.";
}

export function LocationPinPickerDialog({
  open,
  onOpenChange,
  initialCoords,
  onConfirm,
}: LocationPinPickerDialogProps) {
  const [mapContainerEl, setMapContainerEl] = useState<HTMLDivElement | null>(
    null,
  );
  const mapRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const pendingMarkerRef = useRef<{
    lat: number;
    lng: number;
    centerOnPoint: boolean;
  } | null>(null);
  const geocodeRequestIdRef = useRef(0);
  const availabilityRequestIdRef = useRef(0);

  const [selectedCoords, setSelectedCoords] = useState<Coordinates | undefined>(
    initialCoords,
  );
  const [selectedPlaceName, setSelectedPlaceName] = useState<string | null>(
    null,
  );
  const [isLoadingMap, setIsLoadingMap] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationInfo, setLocationInfo] = useState<string | null>(null);
  const [locationPermissionState, setLocationPermissionState] = useState<
    PermissionState | "unknown"
  >("unknown");
  const [isResolvingPlaceName, setIsResolvingPlaceName] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availableHotelsCount, setAvailableHotelsCount] = useState<
    number | null
  >(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null,
  );
  const [mapError, setMapError] = useState<string | null>(null);

  const formatPlaceName = useCallback(
    (payload: {
      name?: string;
      display_name?: string;
      address?: Record<string, string | undefined>;
    }): string | null => {
      const address = payload.address ?? {};
      const place =
        payload.name ||
        address.neighbourhood ||
        address.road ||
        address.village ||
        address.town ||
        address.city ||
        address.hamlet;

      const locality =
        address.city ||
        address.town ||
        address.village ||
        address.hamlet ||
        address.suburb;
      const district =
        address.state_district || address.county || address.district;
      const state = address.state;
      const pincode = address.postcode;
      const country = address.country;

      const rawParts = [place, locality, district, state, pincode, country]
        .map((part) => (part ? part.trim() : ""))
        .filter(Boolean);

      const parts = rawParts.filter(
        (part, index) =>
          rawParts.findIndex(
            (candidate) => candidate.toLowerCase() === part.toLowerCase(),
          ) === index,
      );

      if (parts.length > 0) {
        return parts.join(", ");
      }

      if (payload.display_name) {
        return payload.display_name.split(",").slice(0, 3).join(",").trim();
      }

      return null;
    },
    [],
  );

  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      const requestId = ++geocodeRequestIdRef.current;
      setIsResolvingPlaceName(true);

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
          {
            headers: {
              Accept: "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error("Reverse geocode request failed");
        }

        const payload = (await response.json()) as {
          display_name?: string;
          address?: Record<string, string | undefined>;
        };

        if (requestId !== geocodeRequestIdRef.current) {
          return;
        }

        setSelectedPlaceName(formatPlaceName(payload));
      } catch {
        if (requestId !== geocodeRequestIdRef.current) {
          return;
        }
        setSelectedPlaceName(null);
      } finally {
        if (requestId === geocodeRequestIdRef.current) {
          setIsResolvingPlaceName(false);
        }
      }
    },
    [formatPlaceName],
  );

  const checkHotelsAvailability = useCallback(
    async (lat: number, lng: number) => {
      const requestId = ++availabilityRequestIdRef.current;
      setIsCheckingAvailability(true);
      setAvailabilityError(null);

      try {
        const { data } = await axiosInstance.get<{
          data?: unknown[];
          total?: number;
        }>("/hotels/search", {
          params: {
            latitude: lat,
            longitude: lng,
            radiusKm: 40,
            page: 1,
            limit: 20,
          },
        });

        if (requestId !== availabilityRequestIdRef.current) {
          return;
        }

        const total =
          typeof data?.total === "number"
            ? data.total
            : Array.isArray(data?.data)
              ? data.data.length
              : 0;

        setAvailableHotelsCount(total);
      } catch {
        if (requestId !== availabilityRequestIdRef.current) {
          return;
        }
        setAvailableHotelsCount(null);
        setAvailabilityError("Could not check hotel availability right now.");
      } finally {
        if (requestId === availabilityRequestIdRef.current) {
          setIsCheckingAvailability(false);
        }
      }
    },
    [],
  );

  const drawMarkerOnMap = useCallback(
    (lat: number, lng: number, centerOnPoint = false): boolean => {
      const L = leafletRef.current;
      const map = mapRef.current;
      if (!L || !map) return false;

      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }

      markerRef.current = L.circleMarker([lat, lng], {
        radius: 9,
        color: "#0369a1",
        fillColor: "#0ea5e9",
        fillOpacity: 0.95,
        weight: 2,
      }).addTo(map);

      if (centerOnPoint) {
        map.setView([lat, lng], Math.max(map.getZoom(), 12));
      }

      return true;
    },
    [],
  );

  const setMarker = useCallback(
    (lat: number, lng: number, centerOnPoint = false) => {
      const drewMarker = drawMarkerOnMap(lat, lng, centerOnPoint);
      if (!drewMarker) {
        pendingMarkerRef.current = { lat, lng, centerOnPoint };
      }

      setSelectedCoords({ lat, lng });
      void reverseGeocode(lat, lng);
      void checkHotelsAvailability(lat, lng);
    },
    [drawMarkerOnMap, reverseGeocode, checkHotelsAvailability],
  );

  useEffect(() => {
    if (!open) return;
    setSelectedCoords(initialCoords);
    setSelectedPlaceName(null);
    setAvailableHotelsCount(null);
    setAvailabilityError(null);
    setLocationError(null);
    setLocationInfo(null);
  }, [open, initialCoords]);

  useEffect(() => {
    if (!open) return;

    if (!navigator.permissions?.query) {
      setLocationPermissionState("unknown");
      return;
    }

    let active = true;

    void navigator.permissions
      .query({ name: "geolocation" })
      .then((result) => {
        if (!active) return;
        setLocationPermissionState(result.state);
      })
      .catch(() => {
        if (!active) return;
        setLocationPermissionState("unknown");
      });

    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !mapContainerEl) return;

    let active = true;
    let resizeTimerOne: number | undefined;
    let resizeTimerTwo: number | undefined;

    setIsLoadingMap(true);
    setMapError(null);

    void import("leaflet")
      .then((leafletModule) => {
        if (!active || !mapContainerEl) return;

        const L = (leafletModule as any).default || leafletModule;
        leafletRef.current = L;

        const center = initialCoords ?? DEFAULT_CENTER;
        const map = L.map(mapContainerEl, {
          center: [center.lat, center.lng],
          zoom: initialCoords ? 12 : 6,
          scrollWheelZoom: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        map.on("click", (e: any) => {
          setMarker(e.latlng.lat, e.latlng.lng);
        });

        mapRef.current = map;

        if (pendingMarkerRef.current) {
          const pending = pendingMarkerRef.current;
          pendingMarkerRef.current = null;
          drawMarkerOnMap(pending.lat, pending.lng, pending.centerOnPoint);
        } else if (initialCoords) {
          setMarker(initialCoords.lat, initialCoords.lng);
        }

        // Dialog open animation can cause a zero-size first paint; re-invalidate.
        requestAnimationFrame(() => {
          map.invalidateSize();
        });
        resizeTimerOne = window.setTimeout(() => map.invalidateSize(), 220);
        resizeTimerTwo = window.setTimeout(() => map.invalidateSize(), 520);
      })
      .catch(() => {
        if (!active) return;
        setMapError("Could not load map right now. Please try again.");
      })
      .finally(() => {
        if (active) {
          setIsLoadingMap(false);
        }
      });

    return () => {
      active = false;
      if (resizeTimerOne !== undefined) {
        window.clearTimeout(resizeTimerOne);
      }
      if (resizeTimerTwo !== undefined) {
        window.clearTimeout(resizeTimerTwo);
      }
      if (mapRef.current) {
        mapRef.current.remove();
      }
      mapRef.current = null;
      leafletRef.current = null;
      markerRef.current = null;
      pendingMarkerRef.current = null;
    };
  }, [open, initialCoords, mapContainerEl, setMarker, drawMarkerOnMap]);

  const handleUseMyLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported on this browser.");
      return;
    }

    if (!window.isSecureContext) {
      setLocationError(
        "Location access requires a secure context (https or localhost).",
      );
      return;
    }

    if (locationPermissionState === "denied") {
      setLocationError(
        `${getGeolocationErrorMessage(GEOLOCATION_PERMISSION_DENIED)} ${getPermissionResetHelp()}`,
      );
      return;
    }

    setIsLocating(true);
    setLocationError(null);
    setLocationInfo(null);

    try {
      const position = await requestFreshLocationWithRetries();

      setMarker(position.coords.latitude, position.coords.longitude, true);
      return;
    } catch (error) {
      const geoError = error as GeolocationPositionError;

      if (isRetryableLocationError(geoError.code)) {
        try {
          const approxLocation = await requestApproxLocationFromIp();
          setMarker(approxLocation.lat, approxLocation.lng, true);
          setLocationInfo(
            `Using approximate network location${approxLocation.label ? `: ${approxLocation.label}` : "."}`,
          );
          return;
        } catch {
          // Fall back to the detailed error message below.
        }
      }

      const baseMessage = getGeolocationErrorMessage(geoError.code);
      setLocationError(
        geoError.code === GEOLOCATION_POSITION_UNAVAILABLE
          ? `${baseMessage} We already retried with fresh location requests. Ensure macOS Location Services are enabled and your device has network access, then try again.`
          : geoError.code === GEOLOCATION_PERMISSION_DENIED
            ? `${baseMessage} ${getPermissionResetHelp()}`
            : baseMessage,
      );
    } finally {
      setIsLocating(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedCoords) return;
    onConfirm({
      ...selectedCoords,
      placeName: selectedPlaceName ?? undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 sm:max-w-3xl" showCloseButton>
        <div className="p-5 pb-3">
          <DialogHeader>
            <DialogTitle>Select Place On Map</DialogTitle>
            <DialogDescription>
              Click on the map to drop a pin and search hotels near that place.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-5 pb-4">
          <div className="relative h-96 w-full overflow-hidden rounded-lg border bg-muted/20">
            <div ref={setMapContainerEl} className="h-full w-full" />
            {isLoadingMap && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            )}
            {mapError && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/85 px-6 text-center text-sm text-destructive">
                {mapError}
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUseMyLocation}
              disabled={isLocating}
              className="gap-2"
            >
              {isLocating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4" />
              )}
              Use my location
            </Button>
            <span>Permission: {locationPermissionState}</span>
            {selectedCoords ? (
              <div className="space-y-1">
                <div>
                  Pinned at {selectedCoords.lat.toFixed(5)},{" "}
                  {selectedCoords.lng.toFixed(5)}
                </div>
                <div>
                  {getPlaceStatusMessage(
                    isResolvingPlaceName,
                    selectedPlaceName,
                  )}
                </div>
                <div>
                  {getAvailabilityStatusMessage(
                    isCheckingAvailability,
                    availabilityError,
                    availableHotelsCount,
                  )}
                </div>
              </div>
            ) : (
              <span>No pin selected yet.</span>
            )}
            {locationError && (
              <div className="w-full text-sm text-destructive">
                {locationError}
              </div>
            )}
            {locationInfo && (
              <div className="w-full text-sm text-emerald-700">
                {locationInfo}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t px-5 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedCoords}
          >
            Use This Place
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
