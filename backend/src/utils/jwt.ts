import jwt from "jsonwebtoken";
import { env } from "../config/environment";

export const generateToken = (
  userId: string,
  email: string,
  role: string,
  sessionId?: string,
) => {
  const expiresIn = env.JWT_EXPIRE as jwt.SignOptions["expiresIn"];

  return jwt.sign(
    {
      userId,
      email,
      role,
      sid: sessionId,
    },
    env.JWT_SECRET,
    {
      expiresIn,
      algorithm: "HS256",
    },
  );
};

export const verifyToken = (token: string) => {
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

export default { generateToken, verifyToken };
