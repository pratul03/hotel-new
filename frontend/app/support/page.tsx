"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { AppForm } from "@/components/common/AppForm/AppForm";
import { z } from "zod";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { AlertTriangle, HelpCircle, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import axiosInstance from "@/lib/axios";

const ticketSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  priority: z.string(),
});

type TicketFormData = z.infer<typeof ticketSchema>;

export default function SupportPage() {
  const createTicket = useMutation({
    mutationFn: async (data: TicketFormData) => {
      await axiosInstance.post("/support/tickets", data);
    },
    onSuccess: () =>
      toast.success("Support ticket created! We will get back to you soon."),
    onError: () => toast.error("Failed to create ticket. Please try again."),
  });

  const emergencyHelp = useMutation({
    mutationFn: async () => {
      await axiosInstance.post("/support/emergency", {
        description: "Immediate safety help requested from support center",
      });
    },
    onSuccess: () =>
      toast.success(
        "Emergency alert sent. Our team will prioritize your case.",
      ),
    onError: () =>
      toast.error("Unable to send emergency alert. Try calling support."),
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Support Center</h1>
          <p className="text-muted-foreground">
            Get help and create support tickets
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="h-6 w-6 text-primary" />
              <h3 className="font-semibold">Email Support</h3>
            </div>
            <p className="text-sm text-muted-foreground">support@my-bnb.com</p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="flex items-center gap-3">
              <Phone className="h-6 w-6 text-primary" />
              <h3 className="font-semibold">Phone Support</h3>
            </div>
            <p className="text-sm text-muted-foreground">+91 98765 43210</p>
          </Card>

          <Card className="p-6 space-y-3">
            <div className="flex items-center gap-3">
              <HelpCircle className="h-6 w-6 text-primary" />
              <h3 className="font-semibold">FAQ</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Check our help center
            </p>
          </Card>
        </div>

        <Card className="p-6 space-y-3 border-destructive/40">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <h3 className="font-semibold">Emergency Assistance</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            For urgent safety situations, send a priority alert to support.
          </p>
          <Button
            variant="destructive"
            onClick={() => emergencyHelp.mutate()}
            disabled={emergencyHelp.isPending}
            className="w-fit"
          >
            Send Emergency Alert
          </Button>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-6">Create a Support Ticket</h2>
          <AppForm
            schema={ticketSchema}
            defaultValues={{ subject: "", description: "", priority: "medium" }}
            fields={[
              {
                name: "subject",
                label: "Subject",
                type: "text",
                required: true,
              },
              {
                name: "priority",
                label: "Priority",
                type: "select",
                options: [
                  { label: "Low", value: "low" },
                  { label: "Medium", value: "medium" },
                  { label: "High", value: "high" },
                ],
              },
              {
                name: "description",
                label: "Description",
                type: "textarea",
                required: true,
                description:
                  "Please describe your issue in detail (min 20 characters)",
                span: 2,
              },
            ]}
            onSubmit={(data) => createTicket.mutate(data)}
            isLoading={createTicket.isPending}
            submitLabel="Submit Ticket"
          />
        </Card>
      </div>
    </AppLayout>
  );
}
