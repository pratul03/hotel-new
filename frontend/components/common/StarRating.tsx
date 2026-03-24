"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface StarRatingProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  onChange?: (value: number) => void;
  className?: string;
}

const SIZE_MAP = { sm: "h-3 w-3", md: "h-4 w-4", lg: "h-5 w-5" };

export function StarRating({
  value,
  max = 5,
  size = "md",
  readonly = true,
  onChange,
  className,
}: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1;
        const filled = (hovered ?? value) >= starValue;

        return (
          <button
            key={i}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(starValue)}
            onMouseEnter={() => !readonly && setHovered(starValue)}
            onMouseLeave={() => !readonly && setHovered(null)}
            className={cn(
              "transition-colors",
              readonly ? "cursor-default" : "cursor-pointer hover:scale-110",
            )}
            aria-label={`${starValue} star${starValue !== 1 ? "s" : ""}`}
          >
            <Star
              className={cn(
                SIZE_MAP[size],
                filled
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-none text-muted-foreground",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
