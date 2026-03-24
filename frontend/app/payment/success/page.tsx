"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen bg-linear-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center space-y-6">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Booking Confirmed!</h1>
          <p className="text-muted-foreground">
            Your reservation has been successfully booked
          </p>
        </div>

        <div className="bg-muted p-4 rounded space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Booking Reference:</span>
            <span className="font-mono font-bold">BK-2024-001234</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Confirmation sent to:</span>
            <span>your@email.com</span>
          </div>
        </div>

        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/bookings">View My Bookings</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Continue Browsing</Link>
          </Button>
        </div>
      </Card>
    </main>
  );
}
