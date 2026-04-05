import type { User } from "@/types/user";

type UserRole = User["role"];

interface RoleRule {
  pattern: RegExp;
  allowedRoles: UserRole[];
}

const ROLE_RULES: RoleRule[] = [
  {
    pattern: /^\/admin(?:\/|$)/,
    allowedRoles: ["admin"],
  },
  {
    pattern: /^\/host(?:\/|$)/,
    allowedRoles: ["host"],
  },
  {
    pattern: /^\/bookings(?:\/|$)/,
    allowedRoles: ["guest", "host"],
  },
  {
    pattern: /^\/wishlist(?:\/|$)/,
    allowedRoles: ["guest", "host"],
  },
  {
    pattern: /^\/payment(?:\/|$)/,
    allowedRoles: ["guest", "host"],
  },
  {
    pattern: /^\/profile\/loyalty(?:\/|$)/,
    allowedRoles: ["guest", "host"],
  },
];

const DEFAULT_ROUTE_BY_ROLE: Record<UserRole, string> = {
  guest: "/",
  host: "/host",
  admin: "/admin",
};

const normalizePath = (pathname: string) => {
  if (!pathname) return "/";
  if (pathname === "/") return pathname;
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
};

export function getRoleDefaultRoute(role: UserRole) {
  return DEFAULT_ROUTE_BY_ROLE[role];
}

export function canRoleAccessPath(pathname: string, role: UserRole) {
  const normalized = normalizePath(pathname);
  const matchingRule = ROLE_RULES.find((rule) => rule.pattern.test(normalized));

  if (!matchingRule) {
    return true;
  }

  return matchingRule.allowedRoles.includes(role);
}
