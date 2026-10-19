import { describe, expect, it } from "vitest";
import { tokenBulletLook } from "@/lib/contrast/token-bullet";

describe("tokenBulletLook", () => {
  it("puts a white glyph on dark fills and a black glyph on light ones", () => {
    expect(tokenBulletLook("#2F5BD3").glyph).toBe("light");
    expect(tokenBulletLook("#E8B931").glyph).toBe("dark");
  });

  it("rings fills within 1.1:1 of a white page", () => {
    expect(tokenBulletLook("#FFFFFF").ring).toBe("near-white");
    expect(tokenBulletLook("#FBFAF6").ring).toBe("near-white");
  });

  it("rings fills within 1.1:1 of a black page", () => {
    expect(tokenBulletLook("#0B0B0B").ring).toBe("near-black");
    expect(tokenBulletLook("#121212").ring).toBe("near-black");
  });

  it("leaves everything else unringed", () => {
    expect(tokenBulletLook("#2F5BD3").ring).toBeNull();
    expect(tokenBulletLook("#1A1A1A").ring).toBeNull();
    expect(tokenBulletLook("#EDEDED").ring).toBeNull();
  });
});
