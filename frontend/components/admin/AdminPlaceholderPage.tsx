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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface AdminPlaceholderPageProps {
  title: string;
  description: string;
  section: string;
}

export function AdminPlaceholderPage({
  title,
  description,
  section,
}: AdminPlaceholderPageProps) {
  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="space-y-2">
          <Badge variant="outline">{section}</Badge>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Coming Next</CardTitle>
            <CardDescription>
              This module is scaffolded as part of the CRM role-based reform.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild variant="default">
              <Link
                href="/admin/hotels"
                className="inline-flex items-center gap-2"
              >
                Open Registered Hotels
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin">Back to Admin Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
