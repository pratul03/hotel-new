import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { prisma } from "../../../config/database";
import { env } from "../../../config/environment";
import { getRedisClient } from "../../../config/redis";
import { sessionService } from "./session.service";
import {
  generateAccessToken,
  generateRefreshToken,
  generateToken,
  verifyRefreshToken,
} from "../../../utils/jwt";
import { AppError } from "../../../utils";

const SALT_ROUNDS = 10;
const PASSWORD_RESET_EXPIRES_IN = "15m";

const createPasswordResetToken = (userId: string, email: string): string =>
  jwt.sign(
    {
      sub: userId,
      email,
      type: "password_reset",
    },
    env.JWT_SECRET,
    {
      expiresIn: PASSWORD_RESET_EXPIRES_IN,
      algorithm: "HS256",
    },
  );

export const authService = {
  async register(
    email: string,
    password: string,
    name: string,
    role: "guest" | "host" = "guest",
  ) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError("User with this email already exists", 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
      },
    });

    // Generate token
    const sessionId = randomUUID();
    await sessionService.createSession(user.id, sessionId);
    const accessToken = generateAccessToken(
      user.id,
      user.email,
      user.role,
      sessionId,
    );
    const refreshToken = generateRefreshToken(
      user.id,
      user.email,
      user.role,
      sessionId,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token: accessToken,
      accessToken,
      refreshToken,
    };
  },

  async login(email: string, password: string) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new AppError("Invalid email or password", 401);
    }

    // Generate token
    const sessionId = randomUUID();
    await sessionService.createSession(user.id, sessionId);
    const accessToken = generateAccessToken(
      user.id,
      user.email,
      user.role,
      sessionId,
    );
    const refreshToken = generateRefreshToken(
      user.id,
      user.email,
      user.role,
      sessionId,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        verified: user.verified,
        superhost: user.superhost,
      },
      token: accessToken,
      accessToken,
      refreshToken,
    };
  },

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        verified: true,
        superhost: true,
        responseRate: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  },

  async updateProfile(
    userId: string,
    data: { name?: string; avatar?: string },
  ) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.avatar && { avatar: data.avatar }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
        verified: true,
      },
    });

    return user;
  },

  async verifyEmail(userId: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { verified: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        verified: true,
      },
    });

    return user;
  },

  async refreshToken(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const sessionId = randomUUID();
    await sessionService.createSession(user.id, sessionId);
    const token = generateToken(user.id, user.email, user.role, sessionId);
    return { token };
  },

  async refreshSessionFromToken(refreshToken: string) {
    let decoded: { userId: string; email: string; role: string; sid?: string };

    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw new AppError("Invalid or expired refresh token", 401);
    }

    if (!decoded.sid) {
      throw new AppError("Refresh token is missing session information", 401);
    }

    const sessionActive = await sessionService.isSessionActive(
      decoded.userId,
      decoded.sid,
    );
    if (!sessionActive) {
      throw new AppError("Session is no longer active", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    await sessionService.touchSession(user.id, decoded.sid);

    const accessToken = generateAccessToken(
      user.id,
      user.email,
      user.role,
      decoded.sid,
    );
    const rotatedRefreshToken = generateRefreshToken(
      user.id,
      user.email,
      user.role,
      decoded.sid,
    );

    return {
      token: accessToken,
      accessToken,
      refreshToken: rotatedRefreshToken,
      sessionId: decoded.sid,
    };
  },

  async forgotPassword(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
      },
    });

    // Always return success to avoid account enumeration.
    if (!user) {
      return {
        message:
          "If an account exists for this email, a reset link has been generated.",
      };
    }

    const resetToken = createPasswordResetToken(user.id, user.email);
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(
      resetToken,
    )}`;

    // TODO: Send resetUrl by email from notification service.
    return {
      message:
        "If an account exists for this email, a reset link has been generated.",
      resetToken,
      resetUrl,
      expiresIn: PASSWORD_RESET_EXPIRES_IN,
    };
  },

  async resetPassword(token: string, newPassword: string) {
    let payload: { sub: string; email: string; type: string };

    try {
      payload = jwt.verify(token, env.JWT_SECRET) as {
        sub: string;
        email: string;
        type: string;
      };
    } catch {
      throw new AppError("Invalid or expired reset token", 400);
    }

    if (payload.type !== "password_reset") {
      throw new AppError("Invalid reset token type", 400);
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.email !== payload.email) {
      throw new AppError("Invalid reset token", 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await sessionService.revokeOtherSessions(user.id);

    return { success: true };
  },

  async listSessions(userId: string) {
    return sessionService.listSessions(userId);
  },

  async revokeSession(userId: string, sessionId: string) {
    return sessionService.revokeSession(userId, sessionId);
  },

  async revokeOtherSessions(userId: string, currentSessionId?: string) {
    return sessionService.revokeOtherSessions(userId, currentSessionId);
  },

  async setupMfa(userId: string) {
    const client = await getRedisClient();
    const secret = randomUUID().replace(/-/g, "").slice(0, 32).toUpperCase();
    const key = `auth:mfa:setup:${userId}`;

    await client.set(
      key,
      JSON.stringify({ secret, createdAt: new Date().toISOString() }),
      {
        EX: 60 * 10,
      },
    );

    const otpauthUrl = `otpauth://totp/MyBnB:${encodeURIComponent(
      userId,
    )}?secret=${secret}&issuer=MyBnB`;
    return { secret, otpauthUrl, expiresInSeconds: 600 };
  },

  async verifyMfa(userId: string, code: string) {
    if (!/^\d{6}$/.test(code)) {
      throw new AppError("MFA code must be a 6-digit number", 400);
    }

    const client = await getRedisClient();
    const setupKey = `auth:mfa:setup:${userId}`;
    const setup = await client.get(setupKey);
    if (!setup) {
      throw new AppError("MFA setup expired. Generate a new setup code.", 400);
    }

    const enabledKey = `auth:mfa:enabled:${userId}`;
    await client.set(enabledKey, "true");
    await client.del(setupKey);

    return { enabled: true };
  },
};

export default authService;
