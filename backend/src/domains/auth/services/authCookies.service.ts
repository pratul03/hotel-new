import { Request, Response } from "express";
import { env } from "../../../config/environment";

export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

const DEFAULT_ACCESS_MAX_AGE_MS = 15 * 60 * 1000;
const DEFAULT_REFRESH_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const parseDurationToMs = (
  input: string | undefined,
  fallback: number,
): number => {
  if (!input) {
    return fallback;
  }

  const trimmed = input.trim();
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed) * 1000;
  }

  const match = trimmed.match(/^(\d+)\s*([smhd])$/i);
  if (!match) {
    return fallback;
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      return fallback;
  }
};

const cookieBaseOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAME_SITE,
  path: "/",
  ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
} as const;

export const setAuthCookies = (
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
) => {
  const accessMaxAge = parseDurationToMs(
    env.JWT_ACCESS_EXPIRE,
    DEFAULT_ACCESS_MAX_AGE_MS,
  );
  const refreshMaxAge = parseDurationToMs(
    env.JWT_REFRESH_EXPIRE,
    DEFAULT_REFRESH_MAX_AGE_MS,
  );

  res.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...cookieBaseOptions,
    maxAge: accessMaxAge,
  });

  res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...cookieBaseOptions,
    maxAge: refreshMaxAge,
  });
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie(ACCESS_TOKEN_COOKIE, cookieBaseOptions);
  res.clearCookie(REFRESH_TOKEN_COOKIE, cookieBaseOptions);
};

export const readAccessTokenFromRequest = (req: Request): string | undefined =>
  req.cookies?.[ACCESS_TOKEN_COOKIE];

export const readRefreshTokenFromRequest = (
  req: Request,
): string | undefined => req.cookies?.[REFRESH_TOKEN_COOKIE];
