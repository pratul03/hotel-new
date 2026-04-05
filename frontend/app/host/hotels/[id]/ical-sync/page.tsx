"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton as UISkeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import {
  useCreateHotelIcalSource,
  useDeleteHotelIcalSource,
  useHotel,
  useHotelIcalSources,
  useImportHotelIcal,
  useSyncHotelIcalSource,
} from "@/hooks/useHotels";
import { Skeleton as BoneyardSkeleton } from "boneyard-js/react";

export default function HostHotelIcalSyncPage() {
  const { id } = useParams<{ id: string }>();
  const { data: hotel } = useHotel(id);
  const { data: sources, isLoading } = useHotelIcalSources(id);
  const createSource = useCreateHotelIcalSource(id);
  const deleteSource = useDeleteHotelIcalSource(id);
  const syncSource = useSyncHotelIcalSource(id);
  const importIcal = useImportHotelIcal(id);

  const [sourceName, setSourceName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [icsContent, setIcsContent] = useState("");

  const exportUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"}/hotels/${id}/ical/export`;

  const handleAddSource = async () => {
    try {
      if (!sourceName || !sourceUrl) {
        toast.error("Source name and URL are required");
        return;
      }

      await createSource.mutateAsync({
        name: sourceName,
        url: sourceUrl,
        enabled: true,
      });
      setSourceName("");
      setSourceUrl("");
      toast.success("iCal source added");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error?.message ?? "Failed to add source",
      );
    }
  };

  const handleManualImport = async () => {
    try {
      if (!icsContent.trim()) {
        toast.error("Paste iCal content first");
        return;
      }

      const result = await importIcal.mutateAsync({
        icsContent,
        reason: "ical_sync",
      });
      toast.success(`Imported ${result.eventsParsed} events`);
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message ?? "Import failed");
    }
  };

  const handleSync = async (sourceId: string) => {
    try {
      const result = await syncSource.mutateAsync(sourceId);
      toast.success(`Synced ${result.eventsParsed} events`);
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message ?? "Sync failed");
    }
  };

  const handleDelete = async (sourceId: string) => {
    try {
      await deleteSource.mutateAsync(sourceId);
      toast.success("Source removed");
    } catch (error: any) {
      toast.error(error?.response?.data?.error?.message ?? "Delete failed");
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">iCal Sync</h1>
          <p className="text-muted-foreground">
            {hotel?.name ?? "Hotel"} - import external availability and export
            your blocked dates.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Export Calendar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Use this URL in external platforms to read blocked dates.
            </p>
            <Input readOnly value={exportUrl} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add iCal Source</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Source Name</Label>
              <Input
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                placeholder="Airbnb Listing A"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>iCal URL</Label>
              <Input
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://.../calendar.ics"
              />
            </div>
            <div className="md:col-span-3">
              <Button
                onClick={handleAddSource}
                disabled={createSource.isPending}
              >
                Add Source
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Saved Sources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading &&
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-md border p-3 space-y-3">
                  <UISkeleton className="h-5 w-32" />
                  <UISkeleton className="h-4 w-full" />
                  <UISkeleton className="h-4 w-40" />
                  <div className="flex gap-2">
                    <UISkeleton className="h-8 w-20" />
                    <UISkeleton className="h-8 w-16" />
                    <UISkeleton className="h-8 w-20" />
                  </div>
                </div>
              ))}
            {!isLoading && (sources?.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground">
                No iCal sources added yet.
              </p>
            )}

            {(sources ?? []).map((source) => (
              <div
                key={source.id}
                className="rounded-md border p-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-medium">{source.name}</p>
                  <p className="text-xs text-muted-foreground break-all">
                    {source.url}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Last synced:{" "}
                    {source.lastSyncedAt
                      ? formatDate(source.lastSyncedAt)
                      : "Never"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={source.enabled ? "default" : "secondary"}>
                    {source.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSync(source.id)}
                  >
                    Sync
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(source.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manual iCal Import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <BoneyardSkeleton
              loading={isLoading}
              name="host-ical-manual-import"
              fallback={
                <div className="space-y-3">
                  <UISkeleton className="h-36 w-full" />
                  <UISkeleton className="h-10 w-44" />
                </div>
              }
            >
              <Textarea
                value={icsContent}
                onChange={(e) => setIcsContent(e.target.value)}
                placeholder="Paste .ics content here"
                rows={8}
              />
              <Button
                onClick={handleManualImport}
                disabled={importIcal.isPending}
              >
                Import iCal Content
              </Button>
            </BoneyardSkeleton>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
