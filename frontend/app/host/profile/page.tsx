"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { Loader2 } from "lucide-react";

const profileSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  businessType: z.enum(["agency", "chain", "management_company", "individual"]),
  description: z.string().max(1000).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function HostProfilePage() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [exists, setExists] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      companyName: "",
      website: "",
      businessType: "agency",
      description: "",
    },
  });

  useEffect(() => {
    if (!user) return;
    axiosInstance
      .get("/host/profile")
      .then(({ data }) => {
        const p = data?.data ?? data;
        form.reset({
          companyName: p.companyName ?? "",
          website: p.website ?? "",
          businessType: p.businessType ?? "agency",
          description: p.description ?? "",
        });
        setExists(true);
      })
      .catch(() => {
        // no profile yet
      })
      .finally(() => setIsFetching(false));
  }, [user, form]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        website: data.website || undefined,
      };
      if (exists) {
        await axiosInstance.put("/host/profile", payload);
        toast.success("Profile updated!");
      } else {
        await axiosInstance.post("/host/profile", payload);
        toast.success("Profile created!");
        setExists(true);
      }
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <AppLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Host Business Profile</h1>
          <p className="text-muted-foreground">
            {exists
              ? "Update your business details"
              : "Set up your host profile"}
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Acme Hospitality"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="businessType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="agency">Agency</SelectItem>
                          <SelectItem value="chain">Hotel Chain</SelectItem>
                          <SelectItem value="management_company">
                            Management Company
                          </SelectItem>
                          <SelectItem value="individual">Individual</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://yourcompany.com"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell guests about your business..."
                          className="resize-none"
                          rows={4}
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  size="lg"
                  className="w-full"
                >
                  {isLoading
                    ? exists
                      ? "Saving..."
                      : "Creating..."
                    : exists
                      ? "Save Changes"
                      : "Create Profile"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
