"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/common/EmptyState";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  useNotifications,
  useMarkAllRead,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/hooks/useNotifications";

const typeColors: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  booking: "default",
  message: "secondary",
  review: "default",
  system: "outline",
  payment: "default",
};

export default function NotificationsPage() {
  const { data, isLoading } = useNotifications(1, 30);
  const markAllRead = useMarkAllRead();
  const { data: preferences, isLoading: prefsLoading } =
    useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();

  const notifications = data?.data ?? [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with important events
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            Mark all as read
          </Button>
        </div>

        <Card className="p-4 space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Notification Preferences</h2>
            <p className="text-sm text-muted-foreground">
              Choose what updates you want to receive.
            </p>
          </div>
          {prefsLoading ? (
            <Skeleton className="h-20 rounded-xl" />
          ) : preferences ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: "inApp", label: "In-app notifications" },
                { key: "email", label: "Email notifications" },
                { key: "push", label: "Push notifications" },
                { key: "booking", label: "Booking updates" },
                { key: "message", label: "Message alerts" },
                { key: "payment", label: "Payment alerts" },
                { key: "marketing", label: "Offers and promotions" },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <span className="text-sm">{item.label}</span>
                  <Switch
                    checked={Boolean(
                      preferences[item.key as keyof typeof preferences],
                    )}
                    onCheckedChange={(checked) =>
                      updatePreferences.mutate({ [item.key]: checked })
                    }
                    disabled={updatePreferences.isPending}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </Card>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : !notifications.length ? (
          <EmptyState
            icon={<Bell className="h-12 w-12 text-muted-foreground" />}
            title="No Notifications"
            description="You're all caught up!"
          />
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-4 transition-colors ${!notification.read ? "bg-primary/5" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{notification.title}</h3>
                      <Badge
                        variant={typeColors[notification.type] ?? "outline"}
                      >
                        {notification.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
