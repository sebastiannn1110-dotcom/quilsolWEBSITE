import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "../../app/manifest";

describe("PWA comercial para iPad", () => {
  it("declara modo standalone, iconos y orientación adaptable", () => {
    const value = manifest();
    expect(value.display).toBe("standalone");
    expect(value.orientation).toBe("any");
    expect(value.icons).toHaveLength(3);
  });

  it("mantiene controles táctiles de al menos 44px", () => {
    const css = readFileSync(
      path.join(process.cwd(), "src", "app", "globals.css"),
      "utf8",
    );
    expect(css).toContain("@media (pointer: coarse)");
    expect(css).toContain("min-height: 44px");
  });

  it("nunca almacena en caché rutas de API", () => {
    const serviceWorker = readFileSync(
      path.join(process.cwd(), "public", "sw.js"),
      "utf8",
    );
    expect(serviceWorker).toContain('url.pathname.startsWith("/api/")');
    expect(serviceWorker).toContain('caches.match("/employee-offline.html")');
  });
});
