import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { GraphQLError } from "graphql";
import { env } from "../config/environment";
import { sessionService } from "../domains/auth/services/session.service";
import { readAccessTokenFromRequest } from "../domains/auth/services/authCookies.service";

export type GraphQLAuthUser = {
  userId: string;
  email: string;
  role: string;
  sessionId?: string;
};

export type GraphQLContext = {
  req: Request;
  res: Response;
  authUser?: GraphQLAuthUser;
};

const unauthorized = (message: string) =>
  new GraphQLError(message, {
    extensions: {
      code: "UNAUTHORIZED",
      http: { status: 401 },
    },
  });

const readBearerToken = (authorizationHeader?: string) => {
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return undefined;
  }

  return authorizationHeader.slice(7);
};

export const createGraphQLContext = async (
  req: Request,
  res: Response,
): Promise<GraphQLContext> => {
  const token =
    readBearerToken(req.headers.authorization) || readAccessTokenFromRequest(req);

  if (!token) {
    return { req, res };
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
      sid?: string;
    };

    if (decoded.sid) {
      const isActive = await sessionService.isSessionActive(
        decoded.userId,
        decoded.sid,
      );

      if (!isActive) {
        throw unauthorized("Session is no longer active");
      }

      await sessionService.touchSession(decoded.userId, decoded.sid);
    }

    return {
      req,
      res,
      authUser: {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        sessionId: decoded.sid,
      },
    };
  } catch (error) {
    if (error instanceof GraphQLError) {
      throw error;
    }

    // For cookie-based auth, expired/invalid access token should not break
    // public operations. Protected resolvers still enforce requireAuth.
    return { req, res };
  }
};

export const requireAuth = (context: GraphQLContext): GraphQLAuthUser => {
  if (!context.authUser) {
    throw unauthorized("Authentication required");
  }

  return context.authUser;
};

export const requireRole = (
  context: GraphQLContext,
  roles: string[],
): GraphQLAuthUser => {
  const authUser = requireAuth(context);
  if (!roles.includes(authUser.role)) {
    throw new GraphQLError("Insufficient permissions", {
      extensions: {
        code: "FORBIDDEN",
        http: { status: 403 },
      },
    });
  }

  return authUser;
};
