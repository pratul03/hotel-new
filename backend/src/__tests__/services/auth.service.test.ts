jest.mock("../../config/environment", () => ({
  env: {
    JWT_SECRET: "test_jwt_secret",
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

jest.mock("../../config/database", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("bcrypt", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock("../../utils/jwt", () => ({
  generateToken: jest.fn().mockReturnValue("mock_token"),
}));

import { authService } from "../../domains/auth/services/auth.service";
import { prisma } from "../../config/database";
import bcrypt from "bcrypt";
import { generateToken } from "../../utils/jwt";
import { AppError } from "../../utils";

const userFindUnique = prisma.user.findUnique as jest.Mock;
const userCreate = prisma.user.create as jest.Mock;
const userUpdate = prisma.user.update as jest.Mock;
const bcryptHash = bcrypt.hash as jest.Mock;
const bcryptCompare = bcrypt.compare as jest.Mock;
const mockGenerateToken = generateToken as jest.Mock;

const mockUser = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
  role: "guest",
  password: "hashed_password",
  verified: true,
  superhost: false,
  avatar: null,
  responseRate: null,
  createdAt: new Date(),
};

describe("authService", () => {
  describe("register", () => {
    it("should register a new user and return user with token", async () => {
      userFindUnique.mockResolvedValue(null);
      bcryptHash.mockResolvedValue("hashed_password");
      userCreate.mockResolvedValue(mockUser);
      mockGenerateToken.mockReturnValue("mock_token");

      const result = await authService.register(
        "test@example.com",
        "password123",
        "Test User",
      );

      expect(userFindUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
      expect(bcryptHash).toHaveBeenCalledWith("password123", 10);
      expect(userCreate).toHaveBeenCalledWith({
        data: {
          email: "test@example.com",
          password: "hashed_password",
          name: "Test User",
          role: "guest",
        },
      });
      expect(result).toEqual({
        user: {
          id: "user-1",
          email: "test@example.com",
          name: "Test User",
          role: "guest",
        },
        token: "mock_token",
      });
    });

    it("should throw AppError(400) if email already exists", async () => {
      userFindUnique.mockResolvedValue(mockUser);

      await expect(
        authService.register("test@example.com", "password123", "Test User"),
      ).rejects.toThrow(
        new AppError("User with this email already exists", 400),
      );

      expect(userCreate).not.toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("should return user and token on valid credentials", async () => {
      userFindUnique.mockResolvedValue(mockUser);
      bcryptCompare.mockResolvedValue(true);
      mockGenerateToken.mockReturnValue("mock_token");

      const result = await authService.login("test@example.com", "password123");

      expect(bcryptCompare).toHaveBeenCalledWith(
        "password123",
        mockUser.password,
      );
      expect(result.token).toBe("mock_token");
      expect(result.user.id).toBe("user-1");
    });

    it("should throw AppError(401) when user not found", async () => {
      userFindUnique.mockResolvedValue(null);

      await expect(
        authService.login("nobody@example.com", "pw"),
      ).rejects.toThrow(new AppError("Invalid email or password", 401));
    });

    it("should throw AppError(401) when password is wrong", async () => {
      userFindUnique.mockResolvedValue(mockUser);
      bcryptCompare.mockResolvedValue(false);

      await expect(
        authService.login("test@example.com", "wrong"),
      ).rejects.toThrow(new AppError("Invalid email or password", 401));
    });
  });

  describe("getCurrentUser", () => {
    it("should return the user when found", async () => {
      const safeUser = {
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
      };
      userFindUnique.mockResolvedValue(safeUser);

      const result = await authService.getCurrentUser("user-1");

      expect(userFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "user-1" } }),
      );
      expect(result).toEqual(safeUser);
    });

    it("should throw AppError(404) when user not found", async () => {
      userFindUnique.mockResolvedValue(null);

      await expect(authService.getCurrentUser("nonexistent")).rejects.toThrow(
        new AppError("User not found", 404),
      );
    });
  });

  describe("updateProfile", () => {
    it("should update and return the profile", async () => {
      const updated = {
        id: "user-1",
        name: "New Name",
        email: "test@example.com",
      };
      userUpdate.mockResolvedValue(updated);

      const result = await authService.updateProfile("user-1", {
        name: "New Name",
      });

      expect(userUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "user-1" } }),
      );
      expect(result).toEqual(updated);
    });
  });

  describe("verifyEmail", () => {
    it("should mark user as verified", async () => {
      const verified = { id: "user-1", verified: true };
      userUpdate.mockResolvedValue(verified);

      const result = await authService.verifyEmail("user-1");

      expect(userUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ data: { verified: true } }),
      );
      expect(result).toEqual(verified);
    });
  });

  describe("refreshToken", () => {
    it("should return a new token for a valid user", async () => {
      const user = { id: "user-1", email: "test@example.com", role: "guest" };
      userFindUnique.mockResolvedValue(user);
      mockGenerateToken.mockReturnValue("new_mock_token");

      const result = await authService.refreshToken("user-1");

      expect(mockGenerateToken).toHaveBeenCalledWith(
        user.id,
        user.email,
        user.role,
        expect.any(String),
      );
      expect(result).toEqual({ token: "new_mock_token" });
    });

    it("should throw AppError(404) when user not found", async () => {
      userFindUnique.mockResolvedValue(null);

      await expect(authService.refreshToken("nonexistent")).rejects.toThrow(
        new AppError("User not found", 404),
      );
    });
  });
});
