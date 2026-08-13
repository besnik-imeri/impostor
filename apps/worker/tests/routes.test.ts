import { describe, expect, it } from "vitest";
import worker from "../src/index";
import type { Env } from "../src/protocol";

describe("worker routes", () => {
  it("reports readiness without accessing runtime bindings", async () => {
    const response = await worker.fetch(
      new Request("https://impostor.localhost/api/health"),
      {} as Env
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual({ status: "ok" });
  });
});
