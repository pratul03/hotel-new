"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CalendarX, Plus } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { useHotel } from "@/hooks/useHotels";

interface BlockedDate {
  id: string;
  hotelId: string;
  roomId: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export default function BlockDatesPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: hotel } = useHotel(id);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const { data: blockedDates, isLoading } = useQuery({
    queryKey: ["blocked-dates", id],
    queryFn: async () => {
      const { data } = await axiosInstance.get<{ data: BlockedDate[] }>(
        `/hotels/${id}/block-dates`,
      );
      return data.data;
    },
    enabled: !!id,
  });

  const blockMutation = useMutation({
    mutationFn: async () => {
      await axiosInstance.post(`/hotels/${id}/block-dates`, {
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blocked-dates", id] });
      setStartDate("");
      setEndDate("");
      setReason("");
      toast.success("Dates blocked for all rooms");
    },
    onError: () => toast.error("Failed to block dates"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(endDate) <= new Date(startDate)) {
      toast.error("End date must be after start date");
      return;
    }
    blockMutation.mutate();
  };

  return (
    <AppLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Block Dates</h1>
          <p className="text-muted-foreground">
            {hotel?.name ?? "Hotel"} — blocking applies to all rooms
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Block New Dates</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Reason</Label>
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Renovation, Private event"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={blockMutation.isPending}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Block Dates
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h2 className="font-semibold">Blocked Periods</h2>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : !blockedDates?.length ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <CalendarX className="h-4 w-4" />
              No blocked dates yet.
            </div>
          ) : (
            <div className="space-y-2">
              {blockedDates.map((bd, idx) => (
                <Card key={`${bd.id}-${idx}`} className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 space-y-1 text-sm">
                      <p className="font-medium">
                        {format(new Date(bd.startDate), "MMM d, yyyy")} –{" "}
                        {format(new Date(bd.endDate), "MMM d, yyyy")}
                      </p>
                      <Badge variant="secondary">{bd.reason}</Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
