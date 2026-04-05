"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton as UISkeleton } from "@/components/ui/skeleton";
import {
  useHostPayoutAccount,
  useHostPayouts,
  useRequestHostPayout,
  useSaveHostPayoutAccount,
} from "@/hooks/useHostFinance";
import { formatDate, formatPrice } from "@/lib/format";
import { Skeleton as BoneyardSkeleton } from "boneyard-js/react";

export default function HostPayoutsPage() {
  const { data: payoutAccount, isLoading: accountLoading } =
    useHostPayoutAccount();
  const { data: payoutHistory, isLoading: historyLoading } = useHostPayouts(20);
  const savePayoutAccount = useSaveHostPayoutAccount();
  const requestPayout = useRequestHostPayout();

  const [accountHolderName, setAccountHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [payoutMethod, setPayoutMethod] = useState<"bank_transfer" | "upi">(
    "bank_transfer",
  );
  const [upiId, setUpiId] = useState("");

  const [requestAmount, setRequestAmount] = useState("");
  const [requestNotes, setRequestNotes] = useState("");

  useEffect(() => {
    if (!payoutAccount) return;
    setAccountHolderName(payoutAccount.accountHolderName ?? "");
    setBankName(payoutAccount.bankName ?? "");
    setIfscCode(payoutAccount.ifscCode ?? "");
    setPayoutMethod(payoutAccount.payoutMethod ?? "bank_transfer");
    setUpiId(payoutAccount.upiId ?? "");
  }, [payoutAccount]);

  const handleSave = async () => {
    try {
      if (!accountHolderName || !bankName || !accountNumber || !ifscCode) {
        toast.error("Please fill all required payout fields");
        return;
      }

      await savePayoutAccount.mutateAsync({
        accountHolderName,
        bankName,
        accountNumber,
        ifscCode,
        payoutMethod,
        upiId: upiId || undefined,
      });

      setAccountNumber("");
      toast.success("Payout account saved");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error?.message ??
          "Failed to save payout account",
      );
    }
  };

  const handleRequestPayout = async () => {
    try {
      const amount = Number(requestAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        toast.error("Enter a valid payout amount");
        return;
      }

      await requestPayout.mutateAsync({
        amount,
        notes: requestNotes || undefined,
      });

      setRequestAmount("");
      setRequestNotes("");
      toast.success("Payout request submitted");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.error?.message ?? "Failed to request payout",
      );
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Payouts</h1>
          <p className="text-muted-foreground">
            Configure payout account and track payout requests.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payout Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <BoneyardSkeleton
              loading={accountLoading}
              name="host-payout-account"
              fallback={
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div key={index} className="space-y-2">
                        <UISkeleton className="h-4 w-32" />
                        <UISkeleton className="h-10 w-full" />
                      </div>
                    ))}
                  </div>
                  <UISkeleton className="h-10 w-44" />
                </div>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Account Holder Name</Label>
                  <Input
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <Input
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="HDFC Bank"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Enter account number"
                  />
                  {payoutAccount?.accountNumberLast4 && (
                    <p className="text-xs text-muted-foreground">
                      Existing account ending:{" "}
                      {payoutAccount.accountNumberLast4}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>IFSC Code</Label>
                  <Input
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                    placeholder="HDFC0001234"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Payout Method</Label>
                  <select
                    className="w-full h-10 rounded-md border bg-background px-3"
                    value={payoutMethod}
                    onChange={(e) =>
                      setPayoutMethod(e.target.value as "bank_transfer" | "upi")
                    }
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="upi">UPI</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>UPI ID (Optional)</Label>
                  <Input
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="name@bank"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleSave}
                  disabled={savePayoutAccount.isPending || accountLoading}
                >
                  Save Payout Account
                </Button>
                {payoutAccount && (
                  <Badge
                    variant={payoutAccount.isVerified ? "default" : "secondary"}
                  >
                    {payoutAccount.isVerified
                      ? "Verified"
                      : "Pending verification"}
                  </Badge>
                )}
              </div>
            </BoneyardSkeleton>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Request Payout</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Available balance:{" "}
              {formatPrice(payoutHistory?.availableForPayout ?? 0)}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NumberInput
                value={requestAmount === "" ? undefined : Number(requestAmount)}
                onValueChange={(value) =>
                  setRequestAmount(value === undefined ? "" : String(value))
                }
                placeholder="Amount"
              />
              <Textarea
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
                placeholder="Notes (optional)"
              />
            </div>
            <Button
              onClick={handleRequestPayout}
              disabled={requestPayout.isPending}
            >
              Submit Payout Request
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payout History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {historyLoading &&
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-md border p-3 space-y-2">
                  <UISkeleton className="h-5 w-32" />
                  <UISkeleton className="h-4 w-48" />
                  <UISkeleton className="h-6 w-24" />
                </div>
              ))}

            {!historyLoading && (payoutHistory?.payouts.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground">
                No payout records yet.
              </p>
            )}

            {(payoutHistory?.payouts ?? []).map((payout) => (
              <div
                key={payout.id}
                className="rounded-md border p-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-medium">{formatPrice(payout.amount)}</p>
                  <p className="text-sm text-muted-foreground">
                    Requested on {formatDate(payout.requestedAt)}
                  </p>
                </div>
                <Badge variant="outline">{payout.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
