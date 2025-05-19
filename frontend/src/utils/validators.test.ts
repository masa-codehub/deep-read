import { describe, it, expect } from "vitest";
import { validateEmail, validatePassword } from "./validators";

describe("Validator Utils", () => {
  it("validateEmail should be a function", () => {
    expect(typeof validateEmail).toBe("function");
  });
  it("should validate correct email", () => {
    expect(validateEmail("test@example.com")).toBe(true);
  });
  it("should invalidate incorrect email", () => {
    expect(validateEmail("invalid-email")).toBe(false);
  });
  it("should validate strong password", () => {
    expect(validatePassword("Password1")).toBe(true);
  });
  it("should invalidate weak password", () => {
    expect(validatePassword("pass")).toBe(false);
  });
});
