"use client";

import { Badge } from "@/components/ui/badge";

interface AdminStatusBadgeProps {
  status: string;
}

const toVariant = (status: string) => {
  const normalized = status.toLowerCase();

  if (
    normalized.includes("verified") ||
    normalized.includes("completed") ||
    normalized.includes("resolved") ||
    normalized.includes("approved") ||
    normalized.includes("settled")
  ) {
    return "default" as const;
  }

  if (
    normalized.includes("pending") ||
    normalized.includes("review") ||
    normalized.includes("processing") ||
    normalized.includes("queued") ||
    normalized.includes("watch")
  ) {
    return "secondary" as const;
  }

  if (
    normalized.includes("failed") ||
    normalized.includes("rejected") ||
    normalized.includes("cancel") ||
    normalized.includes("attention")
  ) {
    return "destructive" as const;
  }

  return "outline" as const;
};

const toLabel = (status: string) =>
  status.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());

export function AdminStatusBadge({ status }: AdminStatusBadgeProps) {
  return <Badge variant={toVariant(status)}>{toLabel(status)}</Badge>;
}
