"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import { useMyHotels } from "@/hooks/useHotels";
import {
  useAddCoHost,
  useCancellationPolicy,
  useComplianceChecklist,
  useCreateHostClaim,
  useCreateQuickReply,
  useCreateScheduledMessage,
  useDeleteQuickReply,
  useHostAnalytics,
  useHostClaims,
  useListingQuality,
  useQuickReplies,
  useRemoveCoHost,
  useScheduledMessages,
  useUpsertCancellationPolicy,
  useUpsertComplianceChecklist,
  useUpsertListingQuality,
  useCoHosts,
  useCancelScheduledMessage,
} from "@/hooks/useHostTools";

export default function HostToolsPage() {
  const { data: hotels } = useMyHotels();
  const selectedHotelId = hotels?.[0]?.id ?? "";

  const { data: analytics } = useHostAnalytics(30);
  const { data: claims } = useHostClaims();
  const createClaim = useCreateHostClaim();

  const { data: cancellationPolicy } = useCancellationPolicy(selectedHotelId);
  const upsertCancellation = useUpsertCancellationPolicy(selectedHotelId);

  const { data: quickReplies } = useQuickReplies();
  const createQuickReply = useCreateQuickReply();
  const deleteQuickReply = useDeleteQuickReply();

  const { data: scheduled } = useScheduledMessages();
  const createScheduled = useCreateScheduledMessage();
  const cancelScheduled = useCancelScheduledMessage();

  const { data: cohosts } = useCoHosts(selectedHotelId);
  const addCoHost = useAddCoHost(selectedHotelId);
  const removeCoHost = useRemoveCoHost(selectedHotelId);

  const { data: compliance } = useComplianceChecklist(selectedHotelId);
  const upsertCompliance = useUpsertComplianceChecklist(selectedHotelId);
  const { data: listingQuality } = useListingQuality(selectedHotelId);
  const upsertListingQuality = useUpsertListingQuality(selectedHotelId);

  const [policyType, setPolicyType] = useState<
    "flexible" | "moderate" | "strict"
  >("moderate");
  const [freeHours, setFreeHours] = useState("24");
  const [partialRefund, setPartialRefund] = useState("50");
  const [noShowPenalty, setNoShowPenalty] = useState("100");

  const [replyTitle, setReplyTitle] = useState("");
  const [replyContent, setReplyContent] = useState("");

  const [receiverUserId, setReceiverUserId] = useState("");
  const [scheduledContent, setScheduledContent] = useState("");
  const [sendAt, setSendAt] = useState("");

  const [cohostUserId, setCohostUserId] = useState("");
  const [cohostPermissions, setCohostPermissions] =
    useState("messages,calendar");
  const [cohostSplit, setCohostSplit] = useState("0");

  const [jurisdictionCode, setJurisdictionCode] = useState("IN");
  const [checklistRaw, setChecklistRaw] = useState(
    '[{"label":"Local registration","completed":false}]',
  );

  const [claimBookingId, setClaimBookingId] = useState("");
  const [claimTitle, setClaimTitle] = useState("");
  const [claimDescription, setClaimDescription] = useState("");
  const [claimAmount, setClaimAmount] = useState("0");

  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [guidebook, setGuidebook] = useState("");
  const [houseManual, setHouseManual] = useState("");
  const [checkInSteps, setCheckInSteps] = useState("");

  useEffect(() => {
    if (!cancellationPolicy) return;
    setPolicyType(cancellationPolicy.policyType);
    setFreeHours(String(cancellationPolicy.freeCancellationHours));
    setPartialRefund(String(cancellationPolicy.partialRefundPercent));
    setNoShowPenalty(String(cancellationPolicy.noShowPenaltyPercent));
  }, [cancellationPolicy]);

  useEffect(() => {
    if (!compliance) return;
    setJurisdictionCode(compliance.jurisdictionCode);
    setChecklistRaw(compliance.checklistItems || "[]");
  }, [compliance]);

  useEffect(() => {
    if (!listingQuality) return;
    setCoverImageUrl(listingQuality.coverImageUrl ?? "");
    setGuidebook(listingQuality.guidebook ?? "");
    setHouseManual(listingQuality.houseManual ?? "");
    setCheckInSteps(listingQuality.checkInSteps ?? "");
  }, [listingQuality]);

  const selectedHotelName = useMemo(
    () => hotels?.find((h) => h.id === selectedHotelId)?.name ?? "No Hotel",
    [hotels, selectedHotelId],
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Host Tools</h1>
          <p className="text-muted-foreground">
            Advanced host operations for {selectedHotelName}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Analytics (30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Bookings</p>
              <p className="font-semibold">{analytics?.totals.bookings ?? 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Confirmed</p>
              <p className="font-semibold">
                {analytics?.totals.confirmed ?? 0}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Cancellation Rate</p>
              <p className="font-semibold">
                {((analytics?.totals.cancellationRate ?? 0) * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Revenue</p>
              <p className="font-semibold">
                {formatPrice(analytics?.totals.revenue ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Avg Rating</p>
              <p className="font-semibold">
                {(analytics?.totals.avgRating ?? 0).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Reviews</p>
              <p className="font-semibold">
                {analytics?.totals.reviewsCount ?? 0}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Occupancy</p>
              <p className="font-semibold">
                {((analytics?.totals.occupancyRate ?? 0) * 100).toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Listing Quality Toolkit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="Cover image URL"
            />
            <Textarea
              value={guidebook}
              onChange={(e) => setGuidebook(e.target.value)}
              placeholder="Guidebook"
              rows={3}
            />
            <Textarea
              value={houseManual}
              onChange={(e) => setHouseManual(e.target.value)}
              placeholder="House manual"
              rows={3}
            />
            <Textarea
              value={checkInSteps}
              onChange={(e) => setCheckInSteps(e.target.value)}
              placeholder="Check-in steps"
              rows={3}
            />
            <div className="flex items-center gap-3">
              <Button
                onClick={async () => {
                  try {
                    await upsertListingQuality.mutateAsync({
                      coverImageUrl: coverImageUrl || undefined,
                      guidebook: guidebook || undefined,
                      houseManual: houseManual || undefined,
                      checkInSteps: checkInSteps || undefined,
                    });
                    toast.success("Listing quality saved");
                  } catch {
                    toast.error("Failed to save listing quality");
                  }
                }}
              >
                Save Listing Toolkit
              </Button>
              <Badge variant="outline">
                Completeness {listingQuality?.completenessScore ?? 0}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cancellation Policy</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <select
              className="h-10 rounded-md border px-3"
              value={policyType}
              onChange={(e) => setPolicyType(e.target.value as any)}
            >
              <option value="flexible">Flexible</option>
              <option value="moderate">Moderate</option>
              <option value="strict">Strict</option>
            </select>
            <NumberInput
              value={freeHours === "" ? undefined : Number(freeHours)}
              onValueChange={(value) =>
                setFreeHours(value === undefined ? "" : String(value))
              }
              placeholder="Free cancel hours"
            />
            <NumberInput
              value={partialRefund === "" ? undefined : Number(partialRefund)}
              onValueChange={(value) =>
                setPartialRefund(value === undefined ? "" : String(value))
              }
              placeholder="Partial refund %"
            />
            <NumberInput
              value={noShowPenalty === "" ? undefined : Number(noShowPenalty)}
              onValueChange={(value) =>
                setNoShowPenalty(value === undefined ? "" : String(value))
              }
              placeholder="No-show penalty %"
            />
            <div className="md:col-span-4">
              <Button
                onClick={async () => {
                  try {
                    await upsertCancellation.mutateAsync({
                      policyType,
                      freeCancellationHours: Number(freeHours),
                      partialRefundPercent: Number(partialRefund),
                      noShowPenaltyPercent: Number(noShowPenalty),
                    });
                    toast.success("Cancellation policy saved");
                  } catch {
                    toast.error("Failed to save policy");
                  }
                }}
              >
                Save Policy
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Replies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                value={replyTitle}
                onChange={(e) => setReplyTitle(e.target.value)}
                placeholder="Template title"
              />
              <Input
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Template content"
              />
            </div>
            <Button
              onClick={async () => {
                try {
                  await createQuickReply.mutateAsync({
                    title: replyTitle,
                    content: replyContent,
                    category: "general",
                  });
                  setReplyTitle("");
                  setReplyContent("");
                  toast.success("Quick reply created");
                } catch {
                  toast.error("Failed to create quick reply");
                }
              }}
            >
              Add Quick Reply
            </Button>
            <div className="space-y-2">
              {(quickReplies ?? []).map((r) => (
                <div
                  key={r.id}
                  className="border rounded-md p-2 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-sm">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.content}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteQuickReply.mutate(r.id)}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scheduled Messages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                value={receiverUserId}
                onChange={(e) => setReceiverUserId(e.target.value)}
                placeholder="Receiver user ID"
              />
              <Input
                value={scheduledContent}
                onChange={(e) => setScheduledContent(e.target.value)}
                placeholder="Message content"
              />
              <Input
                value={sendAt}
                onChange={(e) => setSendAt(e.target.value)}
                type="datetime-local"
              />
            </div>
            <Button
              onClick={async () => {
                try {
                  await createScheduled.mutateAsync({
                    receiverUserId,
                    content: scheduledContent,
                    sendAt: new Date(sendAt).toISOString(),
                  });
                  toast.success("Scheduled message created");
                } catch {
                  toast.error("Failed to schedule message");
                }
              }}
            >
              Schedule Message
            </Button>
            <div className="space-y-2">
              {(scheduled ?? []).map((m) => (
                <div
                  key={m.id}
                  className="border rounded-md p-2 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm">{m.content}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.status} • {new Date(m.sendAt).toLocaleString()}
                    </p>
                  </div>
                  {m.status === "scheduled" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cancelScheduled.mutate(m.id)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Co-Hosts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                value={cohostUserId}
                onChange={(e) => setCohostUserId(e.target.value)}
                placeholder="Co-host user ID"
              />
              <Input
                value={cohostPermissions}
                onChange={(e) => setCohostPermissions(e.target.value)}
                placeholder="permissions comma separated"
              />
              <NumberInput
                value={cohostSplit === "" ? undefined : Number(cohostSplit)}
                onValueChange={(value) =>
                  setCohostSplit(value === undefined ? "" : String(value))
                }
                placeholder="Revenue split %"
              />
            </div>
            <Button
              onClick={async () => {
                try {
                  await addCoHost.mutateAsync({
                    cohostUserId,
                    permissions: cohostPermissions
                      .split(",")
                      .map((v) => v.trim())
                      .filter(Boolean),
                    revenueSplitPercent: Number(cohostSplit),
                  });
                  toast.success("Co-host assigned");
                } catch {
                  toast.error("Failed to assign co-host");
                }
              }}
            >
              Add Co-host
            </Button>
            <div className="space-y-2">
              {(cohosts ?? []).map((c) => (
                <div
                  key={c.id}
                  className="border rounded-md p-2 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm">
                      {c.cohost?.name ?? c.cohostUserId}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Split: {c.revenueSplitPercent}%
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => removeCoHost.mutate(c.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance Checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={jurisdictionCode}
              onChange={(e) => setJurisdictionCode(e.target.value)}
              placeholder="Jurisdiction code"
            />
            <Textarea
              value={checklistRaw}
              onChange={(e) => setChecklistRaw(e.target.value)}
              rows={5}
            />
            <Button
              onClick={async () => {
                try {
                  const parsed = JSON.parse(checklistRaw);
                  await upsertCompliance.mutateAsync({
                    jurisdictionCode,
                    checklistItems: parsed,
                    status: "in_review",
                  });
                  toast.success("Compliance checklist saved");
                } catch {
                  toast.error("Failed to save compliance checklist");
                }
              }}
            >
              Save Checklist
            </Button>
            {compliance && <Badge variant="outline">{compliance.status}</Badge>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Claims Workflow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input
                value={claimBookingId}
                onChange={(e) => setClaimBookingId(e.target.value)}
                placeholder="Booking ID"
              />
              <Input
                value={claimTitle}
                onChange={(e) => setClaimTitle(e.target.value)}
                placeholder="Claim title"
              />
              <NumberInput
                value={claimAmount === "" ? undefined : Number(claimAmount)}
                onValueChange={(value) =>
                  setClaimAmount(value === undefined ? "" : String(value))
                }
                placeholder="Amount"
              />
              <Input
                value={claimDescription}
                onChange={(e) => setClaimDescription(e.target.value)}
                placeholder="Description"
              />
            </div>
            <Button
              onClick={async () => {
                try {
                  await createClaim.mutateAsync({
                    hotelId: selectedHotelId,
                    bookingId: claimBookingId,
                    title: claimTitle,
                    description: claimDescription,
                    amountClaimed: Number(claimAmount),
                  });
                  toast.success("Claim submitted");
                } catch {
                  toast.error("Failed to submit claim");
                }
              }}
            >
              Create Claim
            </Button>
            <div className="space-y-2">
              {(claims ?? []).map((claim) => (
                <div
                  key={claim.id}
                  className="border rounded-md p-2 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">{claim.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {claim.status} • {formatPrice(claim.amountClaimed)}
                    </p>
                  </div>
                  <Badge variant="outline">{claim.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
