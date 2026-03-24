"use client";

import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  getUserPreferences,
  setUserPreferences,
  SUPPORTED_CURRENCIES,
  SUPPORTED_LOCALES,
  SupportedCurrency,
  SupportedLocale,
} from "@/lib/userPreferences";
import { formatDate, formatPrice } from "@/lib/format";

export default function ProfilePreferencesPage() {
  const [locale, setLocale] = useState<SupportedLocale>("en-IN");
  const [currency, setCurrency] = useState<SupportedCurrency>("INR");

  useEffect(() => {
    const prefs = getUserPreferences();
    setLocale(prefs.locale);
    setCurrency(prefs.currency);
  }, []);

  const preview = useMemo(() => {
    return {
      price: formatPrice(12345, { locale, currency }),
      date: formatDate(new Date(), { locale }),
    };
  }, [locale, currency]);

  const savePreferences = () => {
    setUserPreferences({ locale, currency });
    toast.success("Preferences saved");
  };

  return (
    <AppLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Language and Currency</h1>
          <p className="text-muted-foreground">
            Personalize date and price formatting for your browsing experience.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="locale">Language / Locale</Label>
              <select
                id="locale"
                value={locale}
                onChange={(e) => setLocale(e.target.value as SupportedLocale)}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                {SUPPORTED_LOCALES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                value={currency}
                onChange={(e) =>
                  setCurrency(e.target.value as SupportedCurrency)
                }
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                {SUPPORTED_CURRENCIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p>
                Price preview: <strong>{preview.price}</strong>
              </p>
              <p>
                Date preview: <strong>{preview.date}</strong>
              </p>
            </div>

            <Button onClick={savePreferences}>Save Preferences</Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
