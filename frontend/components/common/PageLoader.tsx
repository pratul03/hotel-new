"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton as UISkeleton } from "@/components/ui/skeleton";
import { Skeleton as BoneyardSkeleton } from "boneyard-js/react";

interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = "Loading..." }: PageLoaderProps) {
  return (
    <div className="py-8">
      <BoneyardSkeleton
        loading
        name="page-loader-shell"
        fallback={
          <Card className="mx-auto w-full max-w-3xl">
            <CardHeader className="space-y-3">
              <UISkeleton className="h-6 w-48" />
              <UISkeleton className="h-4 w-80 max-w-full" />
            </CardHeader>
            <CardContent className="space-y-3">
              <UISkeleton className="h-24 w-full" />
              <UISkeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        }
      >
        <p className="text-muted-foreground text-center">{message}</p>
      </BoneyardSkeleton>
    </div>
  );
}
