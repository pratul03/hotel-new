"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Upload,
  FileCheck2,
  Clock,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";

type DocStatus = "not_uploaded" | "pending" | "approved" | "rejected";

interface DocItem {
  key: string;
  label: string;
  description: string;
  status: DocStatus;
}

const STATUS_MAP: Record<
  DocStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    Icon: React.ElementType;
  }
> = {
  not_uploaded: {
    label: "Not uploaded",
    variant: "secondary",
    Icon: AlertCircle,
  },
  pending: { label: "Under review", variant: "outline", Icon: Clock },
  approved: { label: "Approved", variant: "default", Icon: ShieldCheck },
  rejected: { label: "Rejected", variant: "destructive", Icon: AlertCircle },
};

const DOC_TYPES: DocItem[] = [
  {
    key: "government_id",
    label: "Government ID",
    description: "Aadhaar, PAN, Passport, Driving License, or Voter ID",
    status: "not_uploaded",
  },
  {
    key: "address_proof",
    label: "Address Proof",
    description:
      "Utility bill, bank statement, or government letter (last 3 months)",
    status: "not_uploaded",
  },
  {
    key: "selfie",
    label: "Selfie with ID",
    description: "A clear photo of yourself holding your government ID",
    status: "not_uploaded",
  },
];

export default function HostVerificationPage() {
  const { user } = useAuthStore();
  const [docs, setDocs] = useState<DocItem[]>(DOC_TYPES);
  const [uploading, setUploading] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Load existing document statuses on mount
  useEffect(() => {
    if (!user?.id) return;
    axiosInstance
      .get(`/users/${user.id}/documents`)
      .then(({ data }) => {
        const apiDocs: Array<{ documentType: string; status: string }> =
          data?.data ?? [];
        setDocs((prev) =>
          prev.map((d) => {
            const found = apiDocs.find((a) => a.documentType === d.key);
            if (!found) return d;
            // Backend uses "verified", frontend uses "approved"
            const status =
              found.status === "verified"
                ? "approved"
                : (found.status as DocStatus);
            return { ...d, status };
          }),
        );
      })
      .catch(() => {
        // Silently fail — docs default to "not_uploaded"
      });
  }, [user?.id]);

  const handleUpload = async (key: string, file: File) => {
    if (!user?.id) return;
    setUploading(key);
    try {
      // Generate a placeholder URL for the document
      // In production this would be a MinIO presigned upload URL
      const placeholderUrl = `https://storage.mybnb.app/user-docs/${user.id}/${key}-${Date.now()}`;
      await axiosInstance.post(`/users/${user.id}/verify-document`, {
        documentType: key,
        docUrl: placeholderUrl,
      });
      setDocs((prev) =>
        prev.map((d) => (d.key === key ? { ...d, status: "pending" } : d)),
      );
      toast.success("Document submitted for review!");
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(null);
    }
  };

  const onFileChange =
    (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(key, file);
      // reset input so same file can be re-uploaded if needed
      e.target.value = "";
    };

  const overallApproved = docs.filter((d) => d.status === "approved").length;
  const isFullyVerified = overallApproved === docs.length;

  return (
    <AppLayout>
      <div className="max-w-2xl space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Identity Verification</h1>
            <p className="text-muted-foreground">
              Verify your identity to become a trusted host and unlock all
              features.
            </p>
          </div>
          {isFullyVerified && (
            <Badge className="mt-1 gap-1">
              <ShieldCheck className="h-3 w-3" /> Verified
            </Badge>
          )}
        </div>

        {/* Progress */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${(overallApproved / docs.length) * 100}%` }}
                />
              </div>
              <span className="text-sm text-muted-foreground shrink-0">
                {overallApproved}/{docs.length} approved
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {docs.map((doc, idx) => {
            const { label, variant, Icon } = STATUS_MAP[doc.status];
            const isUploading = uploading === doc.key;

            return (
              <Card key={doc.key}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{doc.label}</CardTitle>
                    <Badge variant={variant} className="gap-1">
                      <Icon className="h-3 w-3" />
                      {label}
                    </Badge>
                  </div>
                  <CardDescription>{doc.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <input
                    ref={(el) => {
                      inputRefs.current[doc.key] = el;
                    }}
                    type="file"
                    accept="image/*,.pdf"
                    className="sr-only"
                    onChange={onFileChange(doc.key)}
                  />
                  {doc.status === "approved" ? (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <FileCheck2 className="h-4 w-4" />
                      <span>Document approved</span>
                    </div>
                  ) : (
                    <Button
                      variant={
                        doc.status === "rejected" ? "destructive" : "outline"
                      }
                      size="sm"
                      disabled={isUploading || doc.status === "pending"}
                      onClick={() => inputRefs.current[doc.key]?.click()}
                    >
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      {isUploading
                        ? "Uploading…"
                        : doc.status === "pending"
                          ? "Awaiting review"
                          : doc.status === "rejected"
                            ? "Re-upload"
                            : "Upload"}
                    </Button>
                  )}
                </CardContent>
                {idx < docs.length - 1 && <Separator />}
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
