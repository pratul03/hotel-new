"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { AppCard } from "@/components/common/AppCard/AppCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  CalendarDays,
  Home,
  DollarSign,
  Clock,
  Building2,
  Wallet,
  Landmark,
} from "lucide-react";
import { useHostBookings } from "@/hooks/useBookings";
import { formatPrice } from "@/lib/format";

export default function HostDashboardPage() {
  const { data: bookingsData } = useHostBookings(1, 100);

  const allBookings = bookingsData?.data ?? [];
  const totalBookings = bookingsData?.total ?? 0;
  const pendingBookings = allBookings.filter(
    (b) => b.status === "pending",
  ).length;
  const now = new Date();
  const thisMonthRevenue = allBookings
    .filter((b) => {
      const d = new Date(b.createdAt);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, b) => sum + (b.amount ?? 0), 0);

  const STATS = [
    {
      title: "Total Bookings",
      value: totalBookings,
      icon: CalendarDays,
    },
    {
      title: "Pending",
      value: pendingBookings,
      icon: Clock,
    },
    {
      title: "Revenue This Month",
      value: formatPrice(thisMonthRevenue),
      icon: DollarSign,
    },
    {
      title: "Active Listings",
      value: "—",
      icon: Home,
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Host Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your properties and bookings
            </p>
          </div>
          <Button asChild>
            <Link href="/host/hotels/new">
              <Home className="h-4 w-4 mr-2" />
              List New Property
            </Link>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((stat) => (
            <AppCard
              key={stat.title}
              variant="stat"
              title={stat.title}
              stats={[{ label: "", value: stat.value }]}
              icon={stat.icon}
            />
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <AppCard
            title="Upcoming Bookings"
            description="View bookings in the next 30 days"
            actions={
              <Button asChild variant="outline" size="sm">
                <Link href="/host/bookings">View All</Link>
              </Button>
            }
          />

          <AppCard
            title="My Properties"
            description="Manage and edit your listings"
            actions={
              <Button asChild variant="outline" size="sm">
                <Link href="/host/hotels">View Properties</Link>
              </Button>
            }
          />

          <AppCard
            title="Messages"
            description="Respond to guest inquiries"
            actions={
              <Button asChild variant="outline" size="sm">
                <Link href="/messages">Check Messages</Link>
              </Button>
            }
          />

          <AppCard
            title="Earnings"
            description="Track gross, net, and payout pipeline"
            actions={
              <Button asChild variant="outline" size="sm">
                <Link
                  href="/host/earnings"
                  className="inline-flex items-center gap-2"
                >
                  <Wallet className="h-4 w-4" />
                  View Earnings
                </Link>
              </Button>
            }
          />

          <AppCard
            title="Payout Setup"
            description="Configure payout account and request payouts"
            actions={
              <Button asChild variant="outline" size="sm">
                <Link
                  href="/host/payouts"
                  className="inline-flex items-center gap-2"
                >
                  <Landmark className="h-4 w-4" />
                  Manage Payouts
                </Link>
              </Button>
            }
          />

          <AppCard
            title="Business Profile"
            description="Manage your host profile and company details"
            actions={
              <Button asChild variant="outline" size="sm">
                <Link
                  href="/host/profile"
                  className="inline-flex items-center gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  Edit Profile
                </Link>
              </Button>
            }
          />

          <AppCard
            title="Host Tools"
            description="Policies, messaging, analytics, co-hosts, compliance"
            actions={
              <Button asChild variant="outline" size="sm">
                <Link href="/host/tools">Open Tools</Link>
              </Button>
            }
          />
        </div>
      </div>
    </AppLayout>
  );
}
