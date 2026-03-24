import { Badge } from "@/components/ui/badge";
import type { BookingStatus } from "@/types/booking";
import { cn } from "@/lib/utils";

interface BookingStatusBadgeProps {
  status: BookingStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  BookingStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    className: string;
  }
> = {
  pending: {
    label: "Pending",
    variant: "secondary",
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  confirmed: {
    label: "Confirmed",
    variant: "default",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  },
  checked_in: {
    label: "Checked In",
    variant: "default",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  },
  checked_out: { label: "Checked Out", variant: "outline", className: "" },
  cancelled: { label: "Cancelled", variant: "destructive", className: "" },
};

export function BookingStatusBadge({
  status,
  className,
}: BookingStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    variant: "outline" as const,
    className: "",
  };

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
