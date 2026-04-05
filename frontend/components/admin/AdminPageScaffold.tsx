"use client";

import { ReactNode } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export interface AdminStat {
  label: string;
  value: ReactNode;
  hint?: string;
}

interface AdminPageScaffoldProps {
  section: string;
  title: string;
  description: string;
  stats?: AdminStat[];
  actions?: ReactNode;
  children: ReactNode;
}

export function AdminPageScaffold({
  section,
  title,
  description,
  stats,
  actions,
  children,
}: AdminPageScaffoldProps) {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Badge variant="outline">{section}</Badge>
            <div>
              <h1 className="text-3xl font-bold">{title}</h1>
              <p className="text-muted-foreground">{description}</p>
            </div>
          </div>
          {actions ? (
            <div className="flex items-center gap-2">{actions}</div>
          ) : null}
        </div>

        {stats && stats.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="space-y-1 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-semibold">{stat.value}</p>
                  {stat.hint ? (
                    <p className="text-xs text-muted-foreground">{stat.hint}</p>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}

        {children}
      </div>
    </AppLayout>
  );
}
