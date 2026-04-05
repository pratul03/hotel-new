"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  useHotel,
  useHotelPricingRules,
  useUpdateHotelPricingRules,
} from "@/hooks/useHotels";

export default function HostHotelPricingRulesPage() {
  const { id } = useParams<{ id: string }>();
  const { data: hotel } = useHotel(id);
  const { data: rules, isLoading } = useHotelPricingRules(id);
  const updateRules = useUpdateHotelPricingRules(id);

  const [weekdayMultiplier, setWeekdayMultiplier] = useState("1");
  const [weekendMultiplier, setWeekendMultiplier] = useState("1.1");
  const [weeklyDiscountPercent, setWeeklyDiscountPercent] = useState("0");
  const [monthlyDiscountPercent, setMonthlyDiscountPercent] = useState("0");
  const [earlyBirdDiscountPercent, setEarlyBirdDiscountPercent] = useState("0");
  const [lastMinuteDiscountPercent, setLastMinuteDiscountPercent] =
    useState("0");
  const [cleaningFee, setCleaningFee] = useState("0");

  useEffect(() => {
    if (!rules) return;
    setWeekdayMultiplier(String(rules.weekdayMultiplier));
    setWeekendMultiplier(String(rules.weekendMultiplier));
    setWeeklyDiscountPercent(String(rules.weeklyDiscountPercent));
    setMonthlyDiscountPercent(String(rules.monthlyDiscountPercent));
    setEarlyBirdDiscountPercent(String(rules.earlyBirdDiscountPercent));
    setLastMinuteDiscountPercent(String(rules.lastMinuteDiscountPercent));
    setCleaningFee(String(rules.cleaningFee));
  }, [rules]);

  const handleSave = async () => {
    try {
      await updateRules.mutateAsync({
        weekdayMultiplier: Number(weekdayMultiplier),
        weekendMultiplier: Number(weekendMultiplier),
        weeklyDiscountPercent: Number(weeklyDiscountPercent),
        monthlyDiscountPercent: Number(monthlyDiscountPercent),
        earlyBirdDiscountPercent: Number(earlyBirdDiscountPercent),
        lastMinuteDiscountPercent: Number(lastMinuteDiscountPercent),
        cleaningFee: Number(cleaningFee),
      });
      toast.success("Pricing rules saved");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error?.message ?? "Failed to save pricing rules",
      );
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Pricing Rules</h1>
          <p className="text-muted-foreground">
            {hotel?.name ?? "Hotel"} - tune multipliers, discounts, and fees.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pricing Controls</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Weekday multiplier</Label>
              <NumberInput
                step="0.01"
                min={0.5}
                max={5}
                decimalScale={2}
                value={
                  weekdayMultiplier === ""
                    ? undefined
                    : Number(weekdayMultiplier)
                }
                onValueChange={(value) =>
                  setWeekdayMultiplier(value === undefined ? "" : String(value))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Weekend multiplier</Label>
              <NumberInput
                step="0.01"
                min={0.5}
                max={5}
                decimalScale={2}
                value={
                  weekendMultiplier === ""
                    ? undefined
                    : Number(weekendMultiplier)
                }
                onValueChange={(value) =>
                  setWeekendMultiplier(value === undefined ? "" : String(value))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Weekly discount %</Label>
              <NumberInput
                min={0}
                max={100}
                value={
                  weeklyDiscountPercent === ""
                    ? undefined
                    : Number(weeklyDiscountPercent)
                }
                onValueChange={(value) =>
                  setWeeklyDiscountPercent(
                    value === undefined ? "" : String(value),
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Monthly discount %</Label>
              <NumberInput
                min={0}
                max={100}
                value={
                  monthlyDiscountPercent === ""
                    ? undefined
                    : Number(monthlyDiscountPercent)
                }
                onValueChange={(value) =>
                  setMonthlyDiscountPercent(
                    value === undefined ? "" : String(value),
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Early-bird discount %</Label>
              <NumberInput
                min={0}
                max={100}
                value={
                  earlyBirdDiscountPercent === ""
                    ? undefined
                    : Number(earlyBirdDiscountPercent)
                }
                onValueChange={(value) =>
                  setEarlyBirdDiscountPercent(
                    value === undefined ? "" : String(value),
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Last-minute discount %</Label>
              <NumberInput
                min={0}
                max={100}
                value={
                  lastMinuteDiscountPercent === ""
                    ? undefined
                    : Number(lastMinuteDiscountPercent)
                }
                onValueChange={(value) =>
                  setLastMinuteDiscountPercent(
                    value === undefined ? "" : String(value),
                  )
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Cleaning fee</Label>
              <NumberInput
                min={0}
                value={cleaningFee === "" ? undefined : Number(cleaningFee)}
                onValueChange={(value) =>
                  setCleaningFee(value === undefined ? "" : String(value))
                }
              />
            </div>
            <div className="md:col-span-2">
              <Button
                onClick={handleSave}
                disabled={isLoading || updateRules.isPending}
              >
                Save Pricing Rules
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
