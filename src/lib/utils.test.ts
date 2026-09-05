import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("mantém classes e ignora valores falsy", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });

  it("resolve conflito de classes Tailwind (a última vence)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
