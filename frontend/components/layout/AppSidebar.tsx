"use client";

import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import axiosInstance from "@/lib/axios";
import Link from "next/link";
import Image from "next/image";
import { useUIStore } from "@/store/uiStore";
import {
  getAllowedWorkspaces,
  getWorkspaceHomePath,
  getWorkspaceLabel,
  isRouteActive,
  NAV_BY_WORKSPACE,
  resolveWorkspaceMode,
  type WorkspaceMode,
} from "@/lib/crmNavigation";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const setWorkspacePreference = useUIStore(
    (state) => state.setWorkspacePreference,
  );
  const role = user?.role;
  const preferredWorkspace = useUIStore((state) =>
    role ? state.workspacePreference[role] : undefined,
  );
  const initials = user?.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("")
    : "?";

  const handleLogout = () => {
    axiosInstance.post("/auth/logout").catch(() => {});
    logout();
    router.push("/login");
  };

  const currentWorkspace = role
    ? resolveWorkspaceMode(role, pathname, preferredWorkspace)
    : undefined;

  const allowedWorkspaces = role ? getAllowedWorkspaces(role) : [];
  const sections = currentWorkspace ? NAV_BY_WORKSPACE[currentWorkspace] : [];

  const profileHref =
    currentWorkspace === "host" ? "/host/profile" : "/profile";

  const handleWorkspaceChange = (workspace: WorkspaceMode) => {
    if (!role) return;

    setWorkspacePreference(role, workspace);
    router.push(getWorkspaceHomePath(workspace));
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="space-y-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/icon.svg" alt="App logo" width={32} height={32} />
            <span className="font-bold text-lg">FND OUT SPACE</span>
          </Link>

          {role && allowedWorkspaces.length > 1 && currentWorkspace ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-8 w-full justify-start px-2 text-xs"
                >
                  {getWorkspaceLabel(currentWorkspace)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Switch Workspace</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={currentWorkspace}
                  onValueChange={(value) =>
                    handleWorkspaceChange(value as WorkspaceMode)
                  }
                >
                  {allowedWorkspaces.map((workspace) => (
                    <DropdownMenuRadioItem key={workspace} value={workspace}>
                      {getWorkspaceLabel(workspace)}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {sections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = isRouteActive(
                    pathname,
                    item.href,
                    item.exact,
                  );

                  return (
                    <SidebarMenuItem key={`${section.label}-${item.href}`}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link
                          href={item.href}
                          className="flex items-center gap-2"
                        >
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="ml-auto">
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-start p-2"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="ml-2 flex-1 text-left">
                  <p className="text-sm font-medium leading-none">
                    {user.name}
                  </p>
                  <Badge variant="outline" className="mt-1">
                    {user.role}
                  </Badge>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href={profileHref}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </SidebarFooter>
    </Sidebar>
  );
}
