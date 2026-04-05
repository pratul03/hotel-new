"use client";

import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  return (
    <AnimatedThemeToggler
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/60 bg-background/70 text-foreground shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&_svg]:size-4",
        className,
      )}
      aria-label="Toggle theme"
    />
  );
}
