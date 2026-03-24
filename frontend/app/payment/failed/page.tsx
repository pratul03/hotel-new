"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function PaymentFailedPage() {
  return (
    <main className="min-h-screen bg-linear-to-br from-destructive/5 to-destructive/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center space-y-6">
        <div className="flex justify-center">
          <AlertCircle className="h-16 w-16 text-red-500" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Payment Failed</h1>
          <p className="text-muted-foreground">
            Unfortunately, your payment could not be processed
          </p>
        </div>

        <div className="bg-muted p-4 rounded text-left space-y-2 text-sm">
          <p className="font-semibold">Possible reasons:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Insufficient funds</li>
            <li>Invalid card details</li>
            <li>Payment gateway error</li>
            <li>Transaction timeout</li>
          </ul>
        </div>

        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/bookings">Retry Payment</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </Card>
    </main>
  );
}
