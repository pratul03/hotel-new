"use client";

import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  CalendarDays,
  Megaphone,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import {
  useAdminPaymentQueueSummary,
  useAdminPromotions,
  useAdminSupportOpsDashboard,
  useAdminUsers,
} from "@/hooks/useAdminModules";
import type {
  AdminHotelInventoryRow,
  AdminUserManagementRow,
} from "@/types/admin";

const FALLBACK = "--";

const modules = [
  {
    title: "Registered Hotels",
    description: "Inspect and manage platform inventory.",
    href: "/admin/hotels",
    icon: Building2,
  },
  {
    title: "Users",
    description: "Moderate guest and host accounts.",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Bookings",
    description: "Platform-wide booking oversight.",
    href: "/admin/bookings",
    icon: CalendarDays,
  },
  {
    title: "Verifications",
    description: "Review compliance and verification queues.",
    href: "/admin/verifications",
    icon: ShieldCheck,
  },
  {
    title: "Payouts",
    description: "Track and review payout activity.",
    href: "/admin/payouts",
    icon: Wallet,
  },
  {
    title: "Promotions",
    description: "Manage featured inventory campaigns.",
    href: "/admin/promotions",
    icon: Megaphone,
  },
  {
    title: "Settings",
    description: "Control platform-level settings.",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminDashboardPage() {
  const { data: users, isLoading: usersLoading } = useAdminUsers();
  const { data: promotions, isLoading: promotionsLoading } =
    useAdminPromotions();
  const { data: supportOps, isLoading: supportLoading } =
    useAdminSupportOpsDashboard(30);
  const { data: queue, isLoading: queueLoading } =
    useAdminPaymentQueueSummary();

  const promotedHotels = promotions?.hotels.filter(
    (hotel: AdminHotelInventoryRow) => hotel.isPromoted,
  ).length;

  const moduleMetrics: Record<string, string | number> = {
    "Registered Hotels": promotions?.hotels.length ?? FALLBACK,
    Users: users?.length ?? FALLBACK,
    Bookings: supportOps?.safety.totalIncidents ?? FALLBACK,
    Verifications:
      users?.filter((user: AdminUserManagementRow) => !user.superhost).length ??
      FALLBACK,
    Payouts: queue?.staleProcessing ?? FALLBACK,
    Promotions: promotedHotels ?? FALLBACK,
    Settings: queue?.queued ?? FALLBACK,
  };

  const loading =
    usersLoading || promotionsLoading || supportLoading || queueLoading;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Central operations workspace for platform management.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon;

            return (
              <Card key={module.href}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Icon className="h-4 w-4" />
                    {module.title}
                  </CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-md border bg-muted/30 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Current Volume
                    </p>
                    {loading ? (
                      <Skeleton className="mt-2 h-7 w-24" />
                    ) : (
                      <p className="mt-1 text-2xl font-semibold">
                        {moduleMetrics[module.title]}
                      </p>
                    )}
                  </div>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={module.href}>Open</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
