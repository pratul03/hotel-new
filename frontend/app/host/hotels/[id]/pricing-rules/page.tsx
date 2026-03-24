"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
              <Input
                type="number"
                step="0.01"
                min={0.5}
                max={5}
                value={weekdayMultiplier}
                onChange={(e) => setWeekdayMultiplier(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Weekend multiplier</Label>
              <Input
                type="number"
                step="0.01"
                min={0.5}
                max={5}
                value={weekendMultiplier}
                onChange={(e) => setWeekendMultiplier(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Weekly discount %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={weeklyDiscountPercent}
                onChange={(e) => setWeeklyDiscountPercent(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Monthly discount %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={monthlyDiscountPercent}
                onChange={(e) => setMonthlyDiscountPercent(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Early-bird discount %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={earlyBirdDiscountPercent}
                onChange={(e) => setEarlyBirdDiscountPercent(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Last-minute discount %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={lastMinuteDiscountPercent}
                onChange={(e) => setLastMinuteDiscountPercent(e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Cleaning fee</Label>
              <Input
                type="number"
                min={0}
                value={cleaningFee}
                onChange={(e) => setCleaningFee(e.target.value)}
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
