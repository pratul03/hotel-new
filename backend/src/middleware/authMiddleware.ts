import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/environment";
import { sessionService } from "../modules/auth/services/session.service";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: string;
  sessionId?: string;
  file?: {
    originalname: string;
    buffer: Buffer;
  };
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Missing or invalid authorization token",
        },
      });
    }

    const token = authHeader.slice(7);

    const verifyAndAttach = async () => {
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        userId: string;
        email: string;
        role: string;
        sid?: string;
      };

      if (decoded.sid) {
        const active = await sessionService.isSessionActive(
          decoded.userId,
          decoded.sid,
        );
        if (!active) {
          return res.status(401).json({
            success: false,
            error: {
              code: "INVALID_SESSION",
              message: "Session is no longer active",
            },
          });
        }

        req.sessionId = decoded.sid;
        await sessionService.touchSession(decoded.userId, decoded.sid);
      }

      req.userId = decoded.userId;
      req.userRole = decoded.role;

      next();
    };

    verifyAndAttach().catch(() => {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid or expired token",
        },
      });
    });
  } catch (error) {
    next(error);
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.userRole) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        },
      });
    }

    if (!roles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Insufficient permissions",
        },
      });
    }

    next();
  };
};

export default authenticate;
