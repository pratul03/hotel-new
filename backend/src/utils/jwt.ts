import jwt from "jsonwebtoken";
import { env } from "../config/environment";

type TokenPayload = {
  userId: string;
  email: string;
  role: string;
  sid?: string;
};

const signToken = (
  payload: TokenPayload,
  secret: string,
  expiresIn: jwt.SignOptions["expiresIn"],
) =>
  jwt.sign(payload, secret, {
    expiresIn,
    algorithm: "HS256",
  });

export const generateAccessToken = (
  userId: string,
  email: string,
  role: string,
  sessionId?: string,
) => {
  const expiresIn = env.JWT_ACCESS_EXPIRE as jwt.SignOptions["expiresIn"];
  return signToken(
    {
      userId,
      email,
      role,
      sid: sessionId,
    },
    env.JWT_SECRET,
    expiresIn,
  );
};

export const generateRefreshToken = (
  userId: string,
  email: string,
  role: string,
  sessionId?: string,
) => {
  const expiresIn = env.JWT_REFRESH_EXPIRE as jwt.SignOptions["expiresIn"];
  return signToken(
    {
      userId,
      email,
      role,
      sid: sessionId,
    },
    env.JWT_REFRESH_SECRET,
    expiresIn,
  );
};

export const verifyAccessToken = (token: string) => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
      sid?: string;
    };
  } catch (error) {
    throw new Error("Invalid token");
  }
};

export const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as {
      userId: string;
      email: string;
      role: string;
      sid?: string;
    };
  } catch (error) {
    throw new Error("Invalid refresh token");
  }
};

// Backward-compatible aliases used across existing code paths.
export const generateToken = generateAccessToken;
export const verifyToken = verifyAccessToken;

export default {
  generateToken,
  verifyToken,
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
};
