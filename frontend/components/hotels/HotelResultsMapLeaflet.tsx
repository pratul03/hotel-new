"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LatLngBounds } from "leaflet";
import { Hotel } from "@/types/hotel";

interface HotelResultsMapProps {
  hotels: Hotel[];
  onSelect: (hotelId: string) => void;
  onSearchArea?: (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => void;
}

interface ParsedPoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
  price: number;
}

interface ClusterPoint {
  id: string;
  lat: number;
  lon: number;
  items: ParsedPoint[];
}

const parsePoint = (hotel: Hotel): ParsedPoint | null => {
  const [latRaw, lonRaw] = hotel.location.split(",");
  const lat = Number(latRaw);
  const lon = Number(lonRaw);
  if (Number.isNaN(lat) || Number.isNaN(lon)) return null;

  return {
    id: hotel.id,
    name: hotel.name,
    lat,
    lon,
    price: 0,
  };
};

function clusterPoints(points: ParsedPoint[], zoom: number): ClusterPoint[] {
  const precision = Math.max(0.005, 0.3 / Math.max(zoom, 3));
  const buckets = new Map<string, ParsedPoint[]>();

  for (const point of points) {
    const keyLat = Math.round(point.lat / precision);
    const keyLon = Math.round(point.lon / precision);
    const key = `${keyLat}:${keyLon}`;
    const bucket = buckets.get(key) || [];
    bucket.push(point);
    buckets.set(key, bucket);
  }

  return Array.from(buckets.entries()).map(([key, items]) => {
    const lat = items.reduce((sum, item) => sum + item.lat, 0) / items.length;
    const lon = items.reduce((sum, item) => sum + item.lon, 0) / items.length;
    return {
      id: key,
      lat,
      lon,
      items,
    };
  });
}

export function HotelResultsMapLeaflet({
  hotels,
  onSelect,
  onSearchArea,
}: HotelResultsMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerLayerRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);

  const points = useMemo(
    () => hotels.map(parsePoint).filter(Boolean) as ParsedPoint[],
    [hotels],
  );

  const [mapZoom, setMapZoom] = useState(7);
  const [lastBounds, setLastBounds] = useState<LatLngBounds | null>(null);

  const visiblePoints = useMemo(() => {
    if (!lastBounds) return points;
    return points.filter((p) => lastBounds.contains([p.lat, p.lon]));
  }, [points, lastBounds]);

  const clusters = useMemo(
    () => clusterPoints(visiblePoints, mapZoom),
    [visiblePoints, mapZoom],
  );

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    let active = true;

    void import("leaflet").then((leafletModule) => {
      if (!active || !mapContainerRef.current) return;

      const L = (leafletModule as any).default || leafletModule;
      leafletRef.current = L;

      const map = L.map(mapContainerRef.current, {
        center: [20.5937, 78.9629],
        zoom: 6,
        scrollWheelZoom: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      markerLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;

      const onViewportChange = () => {
        setLastBounds(map.getBounds());
        setMapZoom(map.getZoom());
      };

      map.on("moveend", onViewportChange);
      map.on("zoomend", onViewportChange);
      onViewportChange();
    });

    return () => {
      active = false;
      if (mapRef.current) {
        mapRef.current.remove();
      }
      mapRef.current = null;
      markerLayerRef.current = null;
      leafletRef.current = null;
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    if (!L || !mapRef.current || !markerLayerRef.current) return;

    if (points.length > 0) {
      const bounds = L.latLngBounds(
        points.map((p) => [p.lat, p.lon] as [number, number]),
      );
      mapRef.current.fitBounds(bounds.pad(0.2));
    }
  }, [points]);

  useEffect(() => {
    const L = leafletRef.current;
    if (!L) return;
    if (!markerLayerRef.current) return;
    markerLayerRef.current.clearLayers();

    for (const cluster of clusters) {
      const isCluster = cluster.items.length > 1;
      const marker = L.circleMarker([cluster.lat, cluster.lon], {
        radius: isCluster ? Math.min(18, 8 + cluster.items.length) : 8,
        color: isCluster ? "#0f766e" : "#0ea5e9",
        fillColor: isCluster ? "#14b8a6" : "#38bdf8",
        fillOpacity: 0.85,
        weight: 2,
      });

      if (isCluster) {
        marker.bindTooltip(`${cluster.items.length} listings`, {
          direction: "top",
        });
      } else {
        marker.bindTooltip(cluster.items[0].name, { direction: "top" });
        marker.on("click", () => onSelect(cluster.items[0].id));
      }

      marker.addTo(markerLayerRef.current);
    }
  }, [clusters, onSelect]);

  if (!points.length) {
    return (
      <div className="rounded-xl border p-6 text-sm text-muted-foreground">
        No mappable coordinates found for these listings.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border bg-card p-3 text-xs text-muted-foreground">
        Live map mode with clustered pins. Drag or zoom, then refresh search
        area.
      </div>

      {onSearchArea && (
        <div>
          <button
            type="button"
            onClick={() => {
              if (!lastBounds) return;
              onSearchArea({
                north: lastBounds.getNorth(),
                south: lastBounds.getSouth(),
                east: lastBounds.getEast(),
                west: lastBounds.getWest(),
              });
            }}
            className="h-9 rounded-md border bg-background px-3 text-sm hover:bg-muted"
          >
            Search this area
          </button>
        </div>
      )}

      <div className="relative h-120 w-full overflow-hidden rounded-xl border">
        <div ref={mapContainerRef} className="h-full w-full" />
      </div>
    </div>
  );
}
