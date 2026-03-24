"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useLoyalty } from "@/hooks/useLoyalty";
import { formatPrice } from "@/lib/format";
import { Copy, Gift } from "lucide-react";
import { toast } from "sonner";

export default function LoyaltyPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useLoyalty(user?.id);

  if (!user) {
    return (
      <AppLayout>
        <p className="text-muted-foreground">
          Please log in to view loyalty rewards.
        </p>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold">Loyalty and Rewards</h1>
          <p className="text-muted-foreground">
            Track your tier, points, and referral benefits.
          </p>
        </div>

        {isLoading || !data ? (
          <Card className="p-6 space-y-3">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-6 w-60" />
            <Skeleton className="h-20 w-full" />
          </Card>
        ) : (
          <>
            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold">{data.tier} Tier</h2>
                </div>
                <Badge>{data.rewardPoints} points</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground">Completed stays</p>
                  <p className="text-lg font-semibold">{data.completedStays}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground">Total spent</p>
                  <p className="text-lg font-semibold">
                    {formatPrice(data.totalSpent)}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-muted-foreground">Search activity</p>
                  <p className="text-lg font-semibold">
                    {data.personalizationSignals.searches}
                  </p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                {data.nextTierTarget
                  ? `Book ${Math.max(0, data.nextTierTarget - data.completedStays)} more stay(s) to reach the next tier.`
                  : "You are at the top loyalty tier."}
              </p>
            </Card>

            <Card className="p-6 space-y-3">
              <h3 className="font-semibold">Referral code</h3>
              <div className="flex items-center gap-2">
                <code className="rounded-md border bg-muted px-3 py-2 text-sm">
                  {data.referralCode}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await navigator.clipboard.writeText(data.referralCode);
                    toast.success("Referral code copied");
                  }}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </div>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
