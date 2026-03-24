"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";

const forgotSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const form = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ForgotFormData) => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.post(
        "/auth/forgot-password",
        values,
      );
      const payload = response.data?.data;
      if (payload?.resetUrl) {
        setDevResetUrl(payload.resetUrl);
      }
      toast.success("If your account exists, reset instructions are ready.");
    } catch {
      toast.error("Unable to process request. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Generating link..." : "Send reset link"}
          </Button>
        </form>
      </Form>

      {devResetUrl ? (
        <div className="rounded-md border bg-muted/30 p-3 text-xs">
          <p className="font-medium mb-1">Development reset link:</p>
          <a className="text-primary break-all underline" href={devResetUrl}>
            {devResetUrl}
          </a>
        </div>
      ) : null}
    </div>
  );
}
