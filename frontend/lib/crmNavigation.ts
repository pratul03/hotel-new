import type { User as AppUser } from "@/types/user";
import {
  BadgeCheck,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  FileText,
  Heart,
  Home,
  LayoutDashboard,
  LifeBuoy,
  Lock,
  Megaphone,
  MessageSquare,
  PlusSquare,
  Search,
  Settings,
  ShieldCheck,
  User,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type UserRole = AppUser["role"];
export type WorkspaceMode = "guest" | "host" | "admin";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
  badge?: string;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

const WORKSPACE_LABEL: Record<WorkspaceMode, string> = {
  guest: "Guest Workspace",
  host: "Host Workspace",
  admin: "Admin Workspace",
};

const WORKSPACE_HOME_PATH: Record<WorkspaceMode, string> = {
  guest: "/",
  host: "/host",
  admin: "/admin",
};

const ALLOWED_WORKSPACES_BY_ROLE: Record<UserRole, WorkspaceMode[]> = {
  guest: ["guest"],
  host: ["host", "guest"],
  admin: ["admin"],
};

const DEFAULT_WORKSPACE_BY_ROLE: Record<UserRole, WorkspaceMode> = {
  guest: "guest",
  host: "host",
  admin: "admin",
};

const GUEST_SECTIONS: NavSection[] = [
  {
    label: "Discover",
    items: [
      { label: "Home", href: "/", icon: Home },
      { label: "Search", href: "/search", icon: Search },
    ],
  },
  {
    label: "Trips",
    items: [
      { label: "My Bookings", href: "/bookings", icon: CalendarDays },
      { label: "Wishlist", href: "/wishlist", icon: Heart },
    ],
  },
  {
    label: "Communication",
    items: [
      { label: "Messages", href: "/messages", icon: MessageSquare },
      { label: "Notifications", href: "/notifications", icon: Bell },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Profile", href: "/profile", icon: User },
      { label: "Preferences", href: "/profile/preferences", icon: Settings },
      { label: "Security", href: "/profile/security", icon: Lock },
      { label: "Loyalty", href: "/profile/loyalty", icon: BadgeCheck },
      { label: "Documents", href: "/profile/documents", icon: FileText },
    ],
  },
  {
    label: "Help",
    items: [{ label: "Support", href: "/support", icon: LifeBuoy }],
  },
];

const HOST_SECTIONS: NavSection[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Host Dashboard",
        href: "/host",
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    label: "Listings",
    items: [
      { label: "My Hotels", href: "/host/hotels", icon: Building2 },
      { label: "Add Hotel", href: "/host/hotels/new", icon: PlusSquare },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Host Bookings", href: "/host/bookings", icon: CalendarDays },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Earnings", href: "/host/earnings", icon: BriefcaseBusiness },
      { label: "Payouts", href: "/host/payouts", icon: Wallet },
    ],
  },
  {
    label: "Growth and Compliance",
    items: [
      { label: "Tools", href: "/host/tools", icon: Wrench },
      { label: "Verification", href: "/host/verification", icon: ShieldCheck },
    ],
  },
  {
    label: "Communication",
    items: [
      { label: "Messages", href: "/messages", icon: MessageSquare },
      { label: "Notifications", href: "/notifications", icon: Bell },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Host Profile", href: "/host/profile", icon: User },
      { label: "Preferences", href: "/profile/preferences", icon: Settings },
      { label: "Security", href: "/profile/security", icon: Lock },
      { label: "Documents", href: "/profile/documents", icon: FileText },
    ],
  },
  {
    label: "Help",
    items: [{ label: "Support", href: "/support", icon: LifeBuoy }],
  },
];

const ADMIN_SECTIONS: NavSection[] = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    label: "Inventory",
    items: [
      { label: "Registered Hotels", href: "/admin/hotels", icon: Building2 },
      { label: "Promotions", href: "/admin/promotions", icon: Megaphone },
    ],
  },
  {
    label: "Platform Operations",
    items: [
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Bookings", href: "/admin/bookings", icon: CalendarDays },
      {
        label: "Verifications",
        href: "/admin/verifications",
        icon: ShieldCheck,
      },
    ],
  },
  {
    label: "Finance",
    items: [{ label: "Payouts", href: "/admin/payouts", icon: Wallet }],
  },
  {
    label: "Trust and Support",
    items: [
      { label: "Support Escalations", href: "/admin/support", icon: LifeBuoy },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Platform Settings", href: "/admin/settings", icon: Settings },
    ],
  },
  {
    label: "Communication",
    items: [
      { label: "Messages", href: "/messages", icon: MessageSquare },
      { label: "Notifications", href: "/notifications", icon: Bell },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Profile", href: "/profile", icon: User },
      { label: "Preferences", href: "/profile/preferences", icon: Settings },
      { label: "Security", href: "/profile/security", icon: Lock },
      { label: "Documents", href: "/profile/documents", icon: FileText },
    ],
  },
];

export const NAV_BY_WORKSPACE: Record<WorkspaceMode, NavSection[]> = {
  guest: GUEST_SECTIONS,
  host: HOST_SECTIONS,
  admin: ADMIN_SECTIONS,
};

const normalizePath = (pathname: string) => {
  if (!pathname) return "/";
  if (pathname === "/") return pathname;
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
};

export function getAllowedWorkspaces(role: UserRole) {
  return ALLOWED_WORKSPACES_BY_ROLE[role];
}

export function getDefaultWorkspace(role: UserRole) {
  return DEFAULT_WORKSPACE_BY_ROLE[role];
}

export function getWorkspaceLabel(workspace: WorkspaceMode) {
  return WORKSPACE_LABEL[workspace];
}

export function getWorkspaceHomePath(workspace: WorkspaceMode) {
  return WORKSPACE_HOME_PATH[workspace];
}

export function resolveWorkspaceMode(
  role: UserRole,
  pathname: string,
  preferredWorkspace?: WorkspaceMode,
): WorkspaceMode {
  if (role === "admin") {
    return "admin";
  }

  const normalized = normalizePath(pathname);

  if (role === "guest") {
    return "guest";
  }

  if (normalized === "/host" || normalized.startsWith("/host/")) {
    return "host";
  }

  const preferred = preferredWorkspace ?? DEFAULT_WORKSPACE_BY_ROLE[role];
  if (getAllowedWorkspaces(role).includes(preferred)) {
    return preferred;
  }

  return DEFAULT_WORKSPACE_BY_ROLE[role];
}

export function isRouteActive(pathname: string, href: string, exact = false) {
  const normalized = normalizePath(pathname);

  if (href === "/") {
    return normalized === "/";
  }

  if (exact) {
    return normalized === href;
  }

  return normalized === href || normalized.startsWith(`${href}/`);
}

export function formatSegment(segment: string) {
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
}
