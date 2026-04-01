"use client";

import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Home,
  Search,
  CalendarDays,
  MessageSquare,
  Heart,
  Bell,
  Building2,
  User,
  LifeBuoy,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import Image from "next/image";

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Search", href: "/search", icon: Search },
  { label: "Bookings", href: "/bookings", icon: CalendarDays },
  { label: "Messages", href: "/messages", icon: MessageSquare, badge: "3" },
  { label: "Wishlist", href: "/wishlist", icon: Heart },
  { label: "Notifications", href: "/notifications", icon: Bell, badge: "2" },
  {
    label: "Host",
    icon: Building2,
    children: [
      { label: "Dashboard", href: "/host" },
      { label: "My Hotels", href: "/host/hotels" },
      { label: "Bookings", href: "/host/bookings" },
      { label: "Earnings", href: "/host/earnings" },
      { label: "Payouts", href: "/host/payouts" },
      { label: "Tools", href: "/host/tools" },
      { label: "Verification", href: "/host/verification" },
    ],
  },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Support", href: "/support", icon: LifeBuoy },
];

const ADMIN_NAV_ITEMS = [
  {
    label: "Admin",
    icon: Building2,
    children: [{ label: "Registered Hotels", href: "/admin/hotels" }],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const initials = user?.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("")
    : "?";

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const sidebarItems = [...NAV_ITEMS, ...(isAdmin ? ADMIN_NAV_ITEMS : [])];

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/icon.svg" alt="App logo" width={32} height={32} />
          <span className="font-bold text-lg">FND OUT SPACE</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {sidebarItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            if (item.children) {
              return (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton asChild>
                    <div className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 hover:bg-accent">
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                      <ChevronRight className="ml-auto h-4 w-4" />
                    </div>
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                    {item.children.map((child) => {
                      const childIsActive = pathname === child.href;
                      return (
                        <SidebarMenuSubItem key={child.label}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={childIsActive}
                          >
                            <Link href={child.href}>
                              <span>{child.label}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </SidebarMenuItem>
              );
            }

            return (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link href={item.href!} className="flex items-center gap-2">
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
                <Link href="/profile">
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
