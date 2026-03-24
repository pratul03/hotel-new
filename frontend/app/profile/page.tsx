"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { AppForm } from "@/components/common/AppForm/AppForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { useAuthStore } from "@/store/authStore";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";
import { Skeleton } from "@/components/ui/skeleton";

const profileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [currentName, setCurrentName] = useState<string | null>(null);

  // Fetch latest profile from server on mount
  useEffect(() => {
    if (!user?.id) return;
    axiosInstance
      .get(`/users/${user.id}/profile`)
      .then(({ data }) => {
        const profile = data?.data ?? data;
        setCurrentName(profile.name ?? user.name);
        // Keep auth store in sync
        setUser({ ...user, name: profile.name ?? user.name });
      })
      .catch(() => {
        setCurrentName(user.name);
      });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Please log in to view your profile
          </p>
        </div>
      </AppLayout>
    );
  }

  if (currentName === null) {
    return (
      <AppLayout>
        <div className="max-w-2xl space-y-6">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  const handleSubmit = async (data: ProfileFormData) => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const resp = await axiosInstance.put(`/users/${user.id}/profile`, {
        name: data.name,
      });
      const updated = resp.data?.data ?? resp.data;
      setUser({ ...user, name: updated.name ?? data.name });
      setCurrentName(updated.name ?? data.name);
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Edit Profile</h1>
          <p className="text-muted-foreground">
            Update your personal information
          </p>
          <div className="mt-3">
            <Button variant="outline" asChild className="mr-2">
              <Link href="/profile/preferences">Language and Currency</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/profile/security">Security</Link>
            </Button>
            <Button variant="outline" asChild className="ml-2">
              <Link href="/profile/loyalty">Loyalty</Link>
            </Button>
          </div>
        </div>

        <AppForm
          schema={profileSchema}
          defaultValues={{
            name: currentName,
            email: user.email,
          }}
          fields={[
            { name: "name", label: "Full Name", type: "text", required: true },
            {
              name: "email",
              label: "Email",
              type: "email",
              required: true,
              disabled: true,
            },
          ]}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          submitLabel="Save Changes"
        />
      </div>
    </AppLayout>
  );
}
