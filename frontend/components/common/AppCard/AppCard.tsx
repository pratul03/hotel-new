"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ImageSlider } from "@/components/common/ImageSlider/ImageSlider";

type AppCardVariant = "default" | "compact" | "stat";

interface AppCardProps {
  variant?: AppCardVariant;
  title: string;
  subtitle?: string;
  description?: string;
  images?: string[];
  badge?: {
    label: string;
    color?: "green" | "yellow" | "red" | "blue" | "gold";
  };
  stats?: { label: string; value: string | number }[];
  actions?: ReactNode;
  onClick?: () => void;
  isLoading?: boolean;
  // stat variant only:
  icon?: LucideIcon;
  trend?: { value: number; direction: "up" | "down" };
}

export function AppCard({
  variant = "default",
  title,
  subtitle,
  description,
  images = [],
  badge,
  stats,
  actions,
  onClick,
  isLoading = false,
  icon: Icon,
  trend,
}: AppCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (variant === "stat") {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
            {trend && (
              <span
                className={cn(
                  "text-sm font-semibold",
                  trend.direction === "up" ? "text-green-600" : "text-red-600",
                )}
              >
                {trend.direction === "up" ? "+" : "-"}
                {trend.value}%
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-3xl font-bold">{stats?.[0]?.value}</p>
            <p className="text-xs text-muted-foreground">{title}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === "compact") {
    return (
      <Card
        className={cn(
          "hover:shadow-md transition-shadow",
          onClick && "cursor-pointer",
        )}
        onClick={onClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base">{title}</CardTitle>
              {subtitle && (
                <CardDescription className="text-sm">
                  {subtitle}
                </CardDescription>
              )}
            </div>
            {badge && (
              <Badge variant="secondary" className="ml-2">
                {badge.label}
              </Badge>
            )}
          </div>
        </CardHeader>
        {(description || stats || actions) && (
          <CardContent className="space-y-3">
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
            {stats && stats.length > 0 && (
              <div className="flex gap-4">
                {stats.map((stat, index) => (
                  <div key={index} className="text-sm">
                    <p className="text-muted-foreground">{stat.label}</p>
                    <p className="font-semibold">{stat.value}</p>
                  </div>
                ))}
              </div>
            )}
            {actions && <div>{actions}</div>}
          </CardContent>
        )}
      </Card>
    );
  }

  // default variant
  return (
    <Card
      className={cn(
        "overflow-hidden hover:shadow-md transition-shadow",
        onClick && "cursor-pointer",
      )}
      onClick={onClick}
    >
      <div className="relative overflow-hidden">
        {images.length > 0 ? (
          <ImageSlider images={images} alt={title} aspectRatio="video" />
        ) : (
          <div className="aspect-video bg-linear-to-br from-muted to-muted-foreground/10 flex items-center justify-center">
            <span className="text-muted-foreground text-sm">No image</span>
          </div>
        )}
        {badge && (
          <Badge className="absolute top-2 right-2 z-10" variant="secondary">
            {badge.label}
          </Badge>
        )}
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="line-clamp-1">{title}</CardTitle>
        {subtitle && (
          <CardDescription className="line-clamp-1">{subtitle}</CardDescription>
        )}
      </CardHeader>

      {(description || stats || actions) && (
        <CardContent className="space-y-3">
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
          {stats && stats.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {stats.map((stat, index) => (
                <div key={index} className="text-xs">
                  <p className="text-muted-foreground">{stat.label}</p>
                  <p className="font-semibold">{stat.value}</p>
                </div>
              ))}
            </div>
          )}
          {actions && <div>{actions}</div>}
        </CardContent>
      )}
    </Card>
  );
}
