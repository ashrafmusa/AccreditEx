import { webcrypto } from "node:crypto";
import { TextDecoder, TextEncoder } from "node:util";
import { SecurityService } from "@/services/securityService";

describe("SecurityService", () => {
  const service = SecurityService.getInstance();

  beforeAll(() => {
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: webcrypto,
    });
    Object.assign(globalThis, { TextDecoder, TextEncoder });
  });

  it("encrypts data with authenticated encryption and rejects a wrong key", async () => {
    // Arrange
    const secret = "sensitive audit payload";
    const key = "tenant-specific-key";

    // Act
    const encrypted = await service.encryptData(secret, key);
    const decrypted = await service.decryptData(encrypted, key);

    // Assert
    expect(encrypted).toMatch(/^v1\./);
    expect(encrypted).not.toContain(secret);
    expect(decrypted).toBe(secret);
    await expect(service.decryptData(encrypted, "wrong-key")).rejects.toThrow();
  });

  it("fails closed when two-factor authentication is not configured", async () => {
    await expect(service.verifyTwoFactorAuth("user-1", "123456")).rejects.toThrow(
      "Two-factor authentication is not configured",
    );
  });
});
