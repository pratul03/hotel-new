"use client";

import { useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { AdminPageScaffold } from "@/components/admin/AdminPageScaffold";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminTableSection } from "@/components/admin/AdminTableSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  useAdminFxRates,
  useAdminPaymentQueueSummary,
  useAdminReprocessStalePayments,
  useAdminUpsertFxRate,
} from "@/hooks/useAdminModules";
import { formatDate } from "@/lib/format";
import type { AdminFxRate } from "@/types/admin";

const columns: ColumnDef<AdminFxRate>[] = [
  {
    id: "pair",
    header: "Currency Pair",
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.baseCurrency}/{row.original.quoteCurrency}
      </span>
    ),
  },
  {
    accessorKey: "rate",
    header: "Rate",
    cell: ({ row }) => row.original.rate.toFixed(4),
  },
  {
    accessorKey: "provider",
    header: "Provider",
    cell: ({ row }) => row.original.provider || "manual",
  },
  {
    accessorKey: "effectiveAt",
    header: "Effective",
    cell: ({ row }) =>
      row.original.effectiveAt ? formatDate(row.original.effectiveAt) : "--",
  },
  {
    accessorKey: "updatedAt",
    header: "Updated",
    cell: ({ row }) =>
      row.original.updatedAt ? formatDate(row.original.updatedAt) : "--",
  },
];

export default function AdminSettingsPage() {
  const { data: queue, refetch: refetchQueue } = useAdminPaymentQueueSummary();
  const {
    data: fxRates = [],
    isLoading: fxLoading,
    refetch: refetchFx,
  } = useAdminFxRates();
  const upsertFxRate = useAdminUpsertFxRate();
  const reprocessPayments = useAdminReprocessStalePayments();

  const [baseCurrency, setBaseCurrency] = useState("INR");
  const [quoteCurrency, setQuoteCurrency] = useState("USD");
  const [rate, setRate] = useState("0.0120");
  const [provider, setProvider] = useState("manual-admin");

  const [olderThanMinutes, setOlderThanMinutes] = useState("20");
  const [scanLimit, setScanLimit] = useState("100");
  const [dryRun, setDryRun] = useState(true);

  const [lastRunSummary, setLastRunSummary] = useState<string | null>(null);

  const queueHealth = useMemo(() => {
    const stale = queue?.staleProcessing ?? 0;
    if (stale === 0) return "healthy";
    if (stale <= 3) return "in_review";
    return "needs_attention";
  }, [queue]);

  const handleSaveFxRate = async () => {
    const parsedRate = Number(rate);
    if (!Number.isFinite(parsedRate) || parsedRate <= 0) {
      toast.error("Please provide a valid positive FX rate.");
      return;
    }

    try {
      await upsertFxRate.mutateAsync({
        baseCurrency: baseCurrency.toUpperCase(),
        quoteCurrency: quoteCurrency.toUpperCase(),
        rate: parsedRate,
        provider,
      });
      toast.success("FX rate updated");
      await refetchFx();
    } catch {
      toast.error("Failed to update FX rate");
    }
  };

  const handleReprocess = async () => {
    try {
      const result = await reprocessPayments.mutateAsync({
        olderThanMinutes: Number(olderThanMinutes) || 20,
        limit: Number(scanLimit) || 100,
        dryRun,
      });

      setLastRunSummary(
        `${result.dryRun ? "Dry run" : "Execution"}: scanned ${result.scanned}, processed ${result.processedCount}, skipped ${result.skippedCount}`,
      );
      toast.success("Payment queue action completed");
      await refetchQueue();
    } catch {
      toast.error("Failed to process stale payments");
    }
  };

  return (
    <AdminPageScaffold
      section="Settings"
      title="Platform Settings"
      description="Run payment operations and maintain FX conversion controls for platform-level finance settings."
      stats={[
        { label: "Queue Total", value: queue?.total ?? 0 },
        { label: "Queued", value: queue?.queued ?? 0 },
        { label: "Stale Processing", value: queue?.staleProcessing ?? 0 },
        {
          label: "Queue Health",
          value: <AdminStatusBadge status={queueHealth} />,
        },
      ]}
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>FX Rates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                placeholder="Base Currency"
                value={baseCurrency}
                onChange={(event) => setBaseCurrency(event.target.value)}
                maxLength={3}
              />
              <Input
                placeholder="Quote Currency"
                value={quoteCurrency}
                onChange={(event) => setQuoteCurrency(event.target.value)}
                maxLength={3}
              />
              <Input
                placeholder="Rate"
                value={rate}
                onChange={(event) => setRate(event.target.value)}
              />
              <Input
                placeholder="Provider"
                value={provider}
                onChange={(event) => setProvider(event.target.value)}
              />
            </div>

            <Button
              onClick={handleSaveFxRate}
              disabled={upsertFxRate.isPending}
              className="w-full sm:w-auto"
            >
              Save FX Rate
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Queue Ops</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                placeholder="Older Than Minutes"
                value={olderThanMinutes}
                onChange={(event) => setOlderThanMinutes(event.target.value)}
                type="number"
                min={1}
              />
              <Input
                placeholder="Scan Limit"
                value={scanLimit}
                onChange={(event) => setScanLimit(event.target.value)}
                type="number"
                min={1}
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={dryRun}
                onCheckedChange={(checked) => setDryRun(Boolean(checked))}
              />
              Run in dry-run mode
            </label>

            <Button
              variant="outline"
              onClick={handleReprocess}
              disabled={reprocessPayments.isPending}
              className="w-full sm:w-auto"
            >
              Run Reprocess
            </Button>

            {lastRunSummary ? (
              <p className="text-xs text-muted-foreground">{lastRunSummary}</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <AdminTableSection
        columns={columns}
        rows={fxRates}
        isLoading={fxLoading}
        searchPlaceholder="Search FX pair or provider..."
        getSearchText={(row) =>
          `${row.baseCurrency} ${row.quoteCurrency} ${row.provider ?? ""}`
        }
      />
    </AdminPageScaffold>
  );
}
