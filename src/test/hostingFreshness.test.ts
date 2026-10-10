import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";

describe("Frontend release freshness", () => {
  it("bypasses the HTTP cache for app navigation without changing asset fetches", async () => {
    // Arrange
    const listeners = new Map<string, (event: unknown) => void>();
    const fetchMock = jest.fn().mockResolvedValue({ status: 503 });
    runInNewContext(readFileSync(join(process.cwd(), "public", "service-worker.js"), "utf8"), {
      self: { location: { origin: "https://accreditex.web.app" }, addEventListener: (name: string, listener: (event: unknown) => void) => listeners.set(name, listener) },
      URL, fetch: fetchMock, console,
    });
    const navigation = { url: "https://accreditex.web.app/risk", method: "GET", mode: "navigate" };
    const asset = { url: "https://accreditex.web.app/assets/app.js", method: "GET", mode: "cors" };
    const respondWith = jest.fn();
    // Act
    listeners.get("fetch")!({ request: navigation, respondWith });
    listeners.get("fetch")!({ request: asset, respondWith });
    await Promise.all(respondWith.mock.calls.map(call => call[0]));
    // Assert
    expect(fetchMock).toHaveBeenNthCalledWith(1, navigation, { cache: "no-store" });
    expect(fetchMock).toHaveBeenNthCalledWith(2, asset, {});
  });

  it("configures route revalidation with explicit asset and service-worker policies", () => {
    // Arrange
    const config = JSON.parse(readFileSync(join(process.cwd(), "firebase.json"), "utf8")) as {
      hosting: { headers: { source: string; headers: { key: string; value: string }[] }[] };
    };
    const rules = config.hosting.headers;
    const cacheValue = (source: string) => rules.find(rule => rule.source === source)?.headers.find(header => header.key === "Cache-Control")?.value;
    // Assert
    expect(cacheValue("**")).toBe("no-cache, no-store, must-revalidate");
    expect(cacheValue("**/*.@(js|css)")).toBe("max-age=31536000");
    expect(cacheValue("/service-worker.js")).toBe("no-cache, no-store, must-revalidate");
    expect(rules.findIndex(rule => rule.source === "/service-worker.js"))
      .toBeGreaterThan(rules.findIndex(rule => rule.source === "**/*.@(js|css)"));
  });
});
