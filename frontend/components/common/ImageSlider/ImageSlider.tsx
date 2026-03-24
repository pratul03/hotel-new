"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageSliderProps {
  images: string[];
  alt?: string;
  aspectRatio?: "video" | "square";
  className?: string;
}

export function ImageSlider({
  images,
  alt = "Image",
  aspectRatio = "video",
  className,
}: ImageSliderProps) {
  const [current, setCurrent] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div
        className={cn(
          "w-full bg-linear-to-br from-muted to-muted-foreground/10 flex items-center justify-center",
          aspectRatio === "video" ? "aspect-video" : "aspect-square",
          className,
        )}
      >
        <span className="text-muted-foreground text-sm">No image</span>
      </div>
    );
  }

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));
  };

  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));
  };

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden group",
        aspectRatio === "video" ? "aspect-video" : "aspect-square",
        className,
      )}
    >
      <Image
        src={images[current]}
        alt={`${alt} ${current + 1}`}
        fill
        className="object-cover transition-opacity duration-300"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />

      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            aria-label="Next image"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrent(i);
                }}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === current ? "w-4 bg-white" : "w-1.5 bg-white/60",
                )}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
