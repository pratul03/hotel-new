"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { AppCard } from "@/components/common/AppCard/AppCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton as UISkeleton } from "@/components/ui/skeleton";
import { formatDate, formatPrice } from "@/lib/format";
import { useHostEarnings, useHostTransactions } from "@/hooks/useHostFinance";
import { DollarSign, Landmark, Wallet, Clock3 } from "lucide-react";
import { Skeleton as BoneyardSkeleton } from "boneyard-js/react";

export default function HostEarningsPage() {
  const { data: earnings, isLoading: earningsLoading } = useHostEarnings(6);
  const { data: transactions, isLoading: transactionsLoading } =
    useHostTransactions(15);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Earnings</h1>
          <p className="text-muted-foreground">
            Revenue snapshot and recent host transactions.
          </p>
        </div>

        <BoneyardSkeleton
          loading={earningsLoading}
          name="host-earnings-stats"
          fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-lg border bg-card p-6 space-y-3"
                >
                  <UISkeleton className="h-5 w-1/3" />
                  <UISkeleton className="h-9 w-3/4" />
                  <UISkeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AppCard
              variant="stat"
              title="Gross Revenue"
              icon={DollarSign}
              stats={[
                {
                  label: "All paid bookings",
                  value: formatPrice(earnings?.totalGross ?? 0),
                },
              ]}
            />
            <AppCard
              variant="stat"
              title="Net Revenue"
              icon={Wallet}
              stats={[
                {
                  label: "After fees and tax",
                  value: formatPrice(earnings?.totalNet ?? 0),
                },
              ]}
            />
            <AppCard
              variant="stat"
              title="Deductions"
              icon={Landmark}
              stats={[
                {
                  label: "Service fee + tax",
                  value: formatPrice(
                    (earnings?.totalServiceFee ?? 0) +
                      (earnings?.totalTax ?? 0),
                  ),
                },
              ]}
            />
            <AppCard
              variant="stat"
              title="Pending Payout"
              icon={Clock3}
              stats={[
                {
                  label: "Not settled yet",
                  value: formatPrice(earnings?.pendingPayoutAmount ?? 0),
                },
              ]}
            />
          </div>
        </BoneyardSkeleton>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Gross (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {earningsLoading &&
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="rounded-md border p-3 space-y-2">
                    <UISkeleton className="h-4 w-1/2" />
                    <UISkeleton className="h-5 w-1/3" />
                  </div>
                ))}
              {(earnings?.monthlyGross ?? []).map((item) => (
                <div
                  key={item.month}
                  className="rounded-md border p-3 flex items-center justify-between"
                >
                  <span className="text-sm text-muted-foreground">
                    {item.month}
                  </span>
                  <span className="font-medium">{formatPrice(item.gross)}</span>
                </div>
              ))}
              {!earningsLoading &&
                (earnings?.monthlyGross?.length ?? 0) === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No monthly data yet.
                  </p>
                )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {transactionsLoading &&
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-md border p-3 space-y-2">
                  <UISkeleton className="h-5 w-1/3" />
                  <UISkeleton className="h-4 w-1/2" />
                  <UISkeleton className="h-6 w-20" />
                </div>
              ))}

            {!transactionsLoading && (transactions?.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground">
                No transactions found.
              </p>
            )}

            {(transactions ?? []).map((tx) => (
              <div
                key={tx.bookingId}
                className="rounded-md border p-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-medium">{tx.hotel.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Guest: {tx.guest.name} • {formatDate(tx.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{tx.paymentStatus}</Badge>
                  <span className="font-semibold">
                    {formatPrice(tx.netAmount)}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
