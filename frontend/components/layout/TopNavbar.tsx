"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import {
  formatSegment,
  getWorkspaceLabel,
  resolveWorkspaceMode,
} from "@/lib/crmNavigation";

export function TopNavbar() {
  const pathname = usePathname();
  const role = useAuthStore((state) => state.user?.role);
  const preferredWorkspace = useUIStore((state) =>
    role ? state.workspacePreference[role] : undefined,
  );

  const workspace = role
    ? resolveWorkspaceMode(role, pathname, preferredWorkspace)
    : "guest";

  const segments = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => formatSegment(segment));

  return (
    <header className="flex h-14 items-center gap-4 border-b px-6 sticky top-0 bg-background z-10">
      <SidebarTrigger />

      <Badge variant="outline" className="hidden md:inline-flex">
        {getWorkspaceLabel(workspace)}
      </Badge>

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <span className="text-sm">{getWorkspaceLabel(workspace)}</span>
          </BreadcrumbItem>
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center gap-2">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <span className="text-sm">{segment}</span>
              </BreadcrumbItem>
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-3">
        <ThemeToggle className="h-9 w-9" />

        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
        </Button>
      </div>
    </header>
  );
}
