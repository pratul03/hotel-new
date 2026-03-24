import { AppError } from "../../utils/appError";

describe("AppError", () => {
  it("should be an instance of Error", () => {
    const err = new AppError("Something went wrong", 400);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AppError);
  });

  it("should set message correctly", () => {
    const err = new AppError("Not found", 404);
    expect(err.message).toBe("Not found");
  });

  it("should set statusCode correctly", () => {
    const err = new AppError("Unauthorized", 403);
    expect(err.statusCode).toBe(403);
  });

  it("should set isOperational to true", () => {
    const err = new AppError("Bad request", 400);
    expect(err.isOperational).toBe(true);
  });

  it("should capture stack trace", () => {
    const err = new AppError("Internal error", 500);
    expect(err.stack).toBeDefined();
    expect(err.stack).toContain("appError.test.ts");
  });

  it("should work with various status codes", () => {
    const codes = [400, 401, 403, 404, 409, 422, 500];
    codes.forEach((code) => {
      const err = new AppError(`Error ${code}`, code);
      expect(err.statusCode).toBe(code);
    });
  });
});
