jest.mock("../../config/environment", () => ({
  env: {
    JWT_SECRET: "test_jwt_secret_32chars_minimum!!",
    JWT_EXPIRE: "7d",
    PORT: 3000,
    DATABASE_URL: "postgresql://test",
    REDIS_URL: "redis://localhost",
    MINIO_ENDPOINT: "localhost",
    MINIO_PORT: 9000,
    RAZORPAY_KEY_ID: "test_key",
    RAZORPAY_KEY_SECRET: "test_secret",
    MINIO_BUCKET_PREFIX: "airbnb",
  },
}));

import jwt from "jsonwebtoken";
import { generateToken, verifyToken } from "../../utils/jwt";

describe("jwt utils", () => {
  describe("generateToken", () => {
    it("should return a JWT string", () => {
      const token = generateToken("user-1", "test@example.com", "guest");
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3); // header.payload.signature
    });

    it("should encode userId, email, and role in payload", () => {
      const token = generateToken("user-1", "test@example.com", "host");
      const decoded = jwt.decode(token) as {
        userId: string;
        email: string;
        role: string;
      };

      expect(decoded.userId).toBe("user-1");
      expect(decoded.email).toBe("test@example.com");
      expect(decoded.role).toBe("host");
    });
  });

  describe("verifyToken", () => {
    it("should return the decoded payload for a valid token", () => {
      const token = generateToken("user-1", "test@example.com", "guest");
      const decoded = verifyToken(token);

      expect(decoded.userId).toBe("user-1");
      expect(decoded.email).toBe("test@example.com");
      expect(decoded.role).toBe("guest");
    });

    it("should throw when given an invalid token", () => {
      expect(() => verifyToken("invalid.token.string")).toThrow(
        "Invalid token",
      );
    });

    it("should throw when given an empty string", () => {
      expect(() => verifyToken("")).toThrow("Invalid token");
    });
  });
});
