"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Button } from "@/components/ui/button";
import {
  useHotel,
  useHotelCalendarRules,
  useUpdateHotelCalendarRules,
} from "@/hooks/useHotels";

export default function HostHotelCalendarRulesPage() {
  const { id } = useParams<{ id: string }>();
  const { data: hotel } = useHotel(id);
  const { data: rules, isLoading } = useHotelCalendarRules(id);
  const updateRules = useUpdateHotelCalendarRules(id);

  const [minStayNights, setMinStayNights] = useState("1");
  const [maxStayNights, setMaxStayNights] = useState("30");
  const [advanceNoticeHours, setAdvanceNoticeHours] = useState("24");
  const [prepTimeHours, setPrepTimeHours] = useState("0");
  const [allowSameDayCheckIn, setAllowSameDayCheckIn] = useState(false);
  const [checkInStartTime, setCheckInStartTime] = useState("");
  const [checkInEndTime, setCheckInEndTime] = useState("");

  useEffect(() => {
    if (!rules) return;
    setMinStayNights(String(rules.minStayNights));
    setMaxStayNights(String(rules.maxStayNights));
    setAdvanceNoticeHours(String(rules.advanceNoticeHours));
    setPrepTimeHours(String(rules.prepTimeHours));
    setAllowSameDayCheckIn(Boolean(rules.allowSameDayCheckIn));
    setCheckInStartTime(rules.checkInStartTime ?? "");
    setCheckInEndTime(rules.checkInEndTime ?? "");
  }, [rules]);

  const handleSave = async () => {
    try {
      await updateRules.mutateAsync({
        minStayNights: Number(minStayNights),
        maxStayNights: Number(maxStayNights),
        advanceNoticeHours: Number(advanceNoticeHours),
        prepTimeHours: Number(prepTimeHours),
        allowSameDayCheckIn,
        checkInStartTime: checkInStartTime || undefined,
        checkInEndTime: checkInEndTime || undefined,
      });
      toast.success("Calendar rules saved");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error?.message ?? "Failed to save rules",
      );
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Calendar Rules</h1>
          <p className="text-muted-foreground">
            {hotel?.name ?? "Hotel"} - control stay length and booking windows.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Booking Window Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Minimum stay nights</Label>
                <NumberInput
                  min={1}
                  value={
                    minStayNights === "" ? undefined : Number(minStayNights)
                  }
                  onValueChange={(value) =>
                    setMinStayNights(value === undefined ? "" : String(value))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Maximum stay nights</Label>
                <NumberInput
                  min={1}
                  value={
                    maxStayNights === "" ? undefined : Number(maxStayNights)
                  }
                  onValueChange={(value) =>
                    setMaxStayNights(value === undefined ? "" : String(value))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Advance notice (hours)</Label>
                <NumberInput
                  min={0}
                  value={
                    advanceNoticeHours === ""
                      ? undefined
                      : Number(advanceNoticeHours)
                  }
                  onValueChange={(value) =>
                    setAdvanceNoticeHours(
                      value === undefined ? "" : String(value),
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Preparation time (hours)</Label>
                <NumberInput
                  min={0}
                  value={
                    prepTimeHours === "" ? undefined : Number(prepTimeHours)
                  }
                  onValueChange={(value) =>
                    setPrepTimeHours(value === undefined ? "" : String(value))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Check-in start (optional)</Label>
                <Input
                  type="time"
                  value={checkInStartTime}
                  onChange={(e) => setCheckInStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Check-in end (optional)</Label>
                <Input
                  type="time"
                  value={checkInEndTime}
                  onChange={(e) => setCheckInEndTime(e.target.value)}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={allowSameDayCheckIn}
                onChange={(e) => setAllowSameDayCheckIn(e.target.checked)}
              />
              Allow same-day check-in
            </label>

            <Button
              onClick={handleSave}
              disabled={isLoading || updateRules.isPending}
            >
              Save Rules
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
