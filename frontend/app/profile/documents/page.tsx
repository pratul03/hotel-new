"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, ShieldCheck, Clock, AlertCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";

interface Document {
  id: string;
  type: string;
  url: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  reviewNote?: string;
}

const STATUS_MAP = {
  pending: { label: "Under Review", variant: "outline" as const, Icon: Clock },
  approved: {
    label: "Approved",
    variant: "default" as const,
    Icon: ShieldCheck,
  },
  rejected: {
    label: "Rejected",
    variant: "destructive" as const,
    Icon: AlertCircle,
  },
};

const TYPE_LABELS: Record<string, string> = {
  government_id: "Government ID",
  address_proof: "Address Proof",
  selfie: "Selfie with ID",
};

export default function ProfileDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get<{ data: Document[] }>("/users/me/documents")
      .then(({ data }) => setDocuments(data.data))
      .catch(() => toast.error("Failed to load documents"))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <AppLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Documents</h1>
          <p className="text-muted-foreground">
            View the status of your submitted verification documents.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <FileText className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">
                No documents submitted yet.
              </p>
              <Button variant="outline" asChild>
                <a href="/host/verification">Upload Documents</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => {
              const { label, variant, Icon } = STATUS_MAP[doc.status];
              return (
                <Card key={doc.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {TYPE_LABELS[doc.type] ?? doc.type}
                      </CardTitle>
                      <Badge variant={variant} className="gap-1">
                        <Icon className="h-3 w-3" />
                        {label}
                      </Badge>
                    </div>
                    <CardDescription>
                      Submitted{" "}
                      {new Date(doc.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {doc.reviewNote && (
                      <p className="text-sm text-muted-foreground italic">
                        {doc.reviewNote}
                      </p>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1.5" />
                        View Document
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
