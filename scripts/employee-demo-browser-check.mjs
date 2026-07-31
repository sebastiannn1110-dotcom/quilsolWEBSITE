import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import WebSocket from "ws";

const baseUrl = process.env.EMPLOYEE_DEMO_BASE_URL || "http://127.0.0.1:3111";
const password = process.env.EMPLOYEE_DEMO_PASSWORD;
const browserCandidates = [
  process.env.BROWSER_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);
const browserPath = browserCandidates.find((candidate) => existsSync(candidate));

if (!password) {
  throw new Error("EMPLOYEE_DEMO_PASSWORD is required.");
}
if (!browserPath) {
  throw new Error("Chrome or Edge was not found.");
}

const profileDirectory = await mkdtemp(
  path.join(os.tmpdir(), "quiksol-demo-browser-"),
);
const artifactsDirectory = await mkdtemp(
  path.join(os.tmpdir(), "quiksol-demo-artifacts-"),
);
const debugPort = 9223;
const browserProcess = spawn(
  browserPath,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profileDirectory}`,
    "--window-size=768,1024",
    "about:blank",
  ],
  { stdio: "ignore", windowsHide: true },
);

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitForJson(url, attempts = 50) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {
      // Browser startup can take a few seconds.
    }
    await sleep(200);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

let socket;
try {
  await waitForJson(`http://127.0.0.1:${debugPort}/json/version`);
  const targetResponse = await fetch(
    `http://127.0.0.1:${debugPort}/json/new?${encodeURIComponent(
      `${baseUrl}/es/employee/login`,
    )}`,
    { method: "PUT" },
  );
  const target = await targetResponse.json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.once("open", resolve);
    socket.once("error", reject);
  });

  let commandId = 0;
  const pending = new Map();
  const browserErrors = [];
  const browserConsole = [];
  socket.on("message", (rawMessage) => {
    const message = JSON.parse(rawMessage.toString());
    if (message.id && pending.has(message.id)) {
      const request = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message));
      else request.resolve(message.result);
    }
    if (message.method === "Runtime.exceptionThrown") {
      browserErrors.push(
        message.params?.exceptionDetails?.text || "Runtime exception",
      );
    }
    if (message.method === "Runtime.consoleAPICalled") {
      browserConsole.push({
        type: message.params?.type,
        values: (message.params?.args || []).map(
          (argument) => argument.value ?? argument.description ?? "",
        ),
      });
    }
  });

  function send(method, params = {}) {
    commandId += 1;
    return new Promise((resolve, reject) => {
      pending.set(commandId, { resolve, reject });
      socket.send(JSON.stringify({ id: commandId, method, params }));
    });
  }

  async function evaluate(expression) {
    const result = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text || "Evaluation failed.");
    }
    return result.result?.value;
  }

  async function waitFor(expression, description, attempts = 100) {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      if (await evaluate(expression)) return;
      await sleep(150);
    }
    const context = await evaluate(`({
      url: location.origin + location.pathname,
      text: document.body?.innerText?.slice(-1200) || "",
      email: document.querySelector('input[name=email]')?.value || "",
      hasPassword: Boolean(document.querySelector('input[name=password]')?.value),
      scripts: [...document.scripts].map((script) => script.src).filter(Boolean),
      resources: performance
        .getEntriesByType("resource")
        .filter((entry) => entry.name.includes("/_next/"))
        .slice(-10)
        .map((entry) => ({ name: entry.name, duration: entry.duration }))
    })`);
    throw new Error(
      `Timed out waiting for ${description}: ${JSON.stringify({
        ...context,
        browserErrors,
      })}`,
    );
  }

  async function capture(name) {
    const screenshot = await send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: false,
    });
    const destination = path.join(artifactsDirectory, name);
    await writeFile(destination, Buffer.from(screenshot.data, "base64"));
    return destination;
  }

  await Promise.all([
    send("Page.enable"),
    send("Runtime.enable"),
    send("Network.enable"),
  ]);
  await send("Emulation.setDeviceMetricsOverride", {
    width: 768,
    height: 1024,
    deviceScaleFactor: 1,
    mobile: true,
    screenWidth: 768,
    screenHeight: 1024,
  });
  await waitFor(
    "document.readyState === 'complete' && !!document.querySelector('input[name=email]')",
    "employee login",
  );

  const loginView = await evaluate(`({
    banner: document.body.innerText.includes("MODO DEMOSTRACIÓN"),
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    viewport: [window.innerWidth, window.innerHeight],
    url: location.href,
    text: document.body.innerText.slice(0, 600)
  })`);
  if (!loginView.banner || loginView.overflow) {
    throw new Error(
      `Login demo banner or portrait layout validation failed: ${JSON.stringify(
        loginView,
      )}`,
    );
  }

  let loginHydrated = false;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    loginHydrated = await evaluate(`(() => {
      const input = document.querySelector('input[name=password]');
      const button = input?.parentElement?.querySelector('button[type="button"]');
      if (!input || !button) return false;
      button.click();
      return input.type === "text";
    })()`);
    if (loginHydrated) break;
    await sleep(150);
  }
  if (!loginHydrated) {
    const hydrationContext = await evaluate(`({
      reactKeys: [...document.querySelectorAll("form, form *")]
        .flatMap((element) => Object.getOwnPropertyNames(element))
        .filter((key) => key.toLowerCase().includes("react"))
        .slice(0, 20),
      nextFrames: Array.isArray(window.__next_f) ? window.__next_f.length : -1
    })`);
    throw new Error(
      `Timed out waiting for interactive login hydration: ${JSON.stringify({
        hydrationContext,
        browserErrors,
        browserConsole: browserConsole.slice(-20),
      })}`,
    );
  }
  await evaluate(
    `document.querySelector('input[name=password]').parentElement.querySelector('button[type="button"]').click()`,
  );
  await evaluate(`(() => {
    const setValue = (element, value) => {
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      ).set;
      setter.call(element, value);
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    };
    setValue(document.querySelector('input[name=email]'), "empleado1@quiksol.local");
    setValue(document.querySelector('input[name=password]'), ${JSON.stringify(
      password,
    )});
    document.querySelector('button[type=submit]').click();
    return true;
  })()`);
  await waitFor(
    "location.pathname === '/es/employee'",
    "employee dashboard after login",
  );
  await waitFor(
    "document.body.innerText.toLocaleLowerCase().includes('panel del vendedor')",
    "dashboard content",
  );
  const dashboardScreenshot = await capture("ipad-portrait-dashboard.png");

  await evaluate(`(() => {
    const link = document.querySelector('a[href="/es/employee/catalog"]');
    if (!link) throw new Error("Catalog link not found");
    link.click();
    return true;
  })()`);
  await waitFor(
    "location.pathname === '/es/employee/catalog' && document.body.innerText.includes('48 productos sintéticos')",
    "catalog with 48 products",
  );
  const catalogSummary = await evaluate(`(() => {
    const articles = [...document.querySelectorAll("article")];
    const addButtons = [...document.querySelectorAll("button")].filter(
      (button) => button.textContent.trim() === "Agregar" && !button.disabled
    );
    const selected = addButtons.slice(0, 3).map((button) => {
      const text = button.closest("article").innerText;
      const mpn = text.match(/QKS-\\d{4}-[A-E]/)?.[0];
      button.click();
      return mpn;
    });
    return {
      articles: articles.length,
      selected,
      allHaveMpn: articles.every((article) => /QKS-\\d{4}-[A-E]/.test(article.innerText)),
      search: !!document.querySelector('input[placeholder*="Buscar MPN"]'),
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1
    };
  })()`);
  if (
    catalogSummary.articles < 3 ||
    catalogSummary.selected.length !== 3 ||
    catalogSummary.selected.some((item) => !item) ||
    !catalogSummary.allHaveMpn ||
    !catalogSummary.search ||
    catalogSummary.overflow
  ) {
    throw new Error("Catalog interface validation failed.");
  }

  await sleep(300);
  await evaluate(`(() => {
    const link = document.querySelector('a[href="/es/employee/customers"]');
    if (!link) throw new Error("Customers link not found");
    link.click();
    return true;
  })()`);
  await waitFor(
    "location.pathname === '/es/employee/customers' && document.body.innerText.includes('Directorio comercial')",
    "customer directory",
  );
  await evaluate(`(() => {
    const links = [...document.querySelectorAll("a")].filter(
      (link) => link.textContent.trim() === "Cotizar"
    );
    if (!links.length) throw new Error("Customer quote action not found");
    links[0].click();
    return true;
  })()`);
  await waitFor(
    "location.pathname === '/es/employee/quotes/new'",
    "quote builder",
  );
  await waitFor(
    "document.querySelectorAll('input[aria-label^=\"Cantidad\"]').length === 3",
    "three selected quote products",
  );

  const quoteBuilderSummary = await evaluate(`(() => {
    const setInput = (element, value) => {
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      ).set;
      setter.call(element, String(value));
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    };
    const quantities = [...document.querySelectorAll('input[aria-label^="Cantidad"]')];
    [2, 3, 4].forEach((value, index) => setInput(quantities[index], value));
    return {
      items: quantities.length,
      customer: document.querySelector("form select")?.value || "",
      warning: document.body.innerText.includes(
        "Esta cotización no garantiza disponibilidad"
      ),
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1
    };
  })()`);
  if (
    quoteBuilderSummary.items !== 3 ||
    !quoteBuilderSummary.customer ||
    !quoteBuilderSummary.warning ||
    quoteBuilderSummary.overflow
  ) {
    throw new Error("Quote builder interface validation failed.");
  }
  await sleep(300);
  await evaluate(`(() => {
    const button = [...document.querySelectorAll("button")].find(
      (item) => item.textContent.includes("Guardar borrador")
    );
    if (!button) throw new Error("Save quote button not found");
    button.click();
    return true;
  })()`);
  await waitFor(
    "location.pathname.includes('/es/employee/quotes/demo-quote-') && document.body.innerText.includes('Apartar productos')",
    "saved quote detail",
  );

  const quoteDetail = await evaluate(`(() => {
    const text = document.body.innerText;
    const pdfLink = document.querySelector('a[href*="/api/employee/quotes/"][href$="/pdf"]');
    return Promise.resolve(fetch(pdfLink.href)).then(async (response) => ({
      selectedPresent: ${JSON.stringify(
        catalogSummary.selected,
      )}.every((mpn) => text.includes(mpn)),
      pdfStatus: response.status,
      pdfType: response.headers.get("content-type"),
      pdfSize: (await response.arrayBuffer()).byteLength,
      quoteNumber: text.match(/COT-DEMO-\\d{4}/)?.[0] || ""
    }));
  })()`);
  if (
    !quoteDetail.selectedPresent ||
    quoteDetail.pdfStatus !== 200 ||
    quoteDetail.pdfType !== "application/pdf" ||
    quoteDetail.pdfSize < 1000
  ) {
    throw new Error("Quote PDF or selected product validation failed.");
  }

  await evaluate(`(() => {
    const button = [...document.querySelectorAll("button")].find(
      (item) => item.textContent.includes("Apartar productos")
    );
    if (!button) throw new Error("Reserve button not found");
    button.click();
    return true;
  })()`);
  await waitFor(
    "location.pathname.includes('/es/employee/reservations/demo-reservation-') && document.body.innerText.includes('Confirmar pedido demo')",
    "active demo reservation",
  );
  const reservationSummary = await evaluate(`({
    number: document.body.innerText.match(/RES-DEMO-\\d{4}/)?.[0] || "",
    expiry: document.body.innerText.includes("vence"),
    selectedPresent: ${JSON.stringify(
      catalogSummary.selected,
    )}.every((mpn) => document.body.innerText.includes(mpn))
  })`);
  if (
    !reservationSummary.number ||
    !reservationSummary.expiry ||
    !reservationSummary.selectedPresent
  ) {
    throw new Error("Reservation interface validation failed.");
  }

  await evaluate(`(() => {
    const button = [...document.querySelectorAll("button")].find(
      (item) => item.textContent.includes("Confirmar pedido demo")
    );
    if (!button) throw new Error("Confirm demo order button not found");
    button.click();
    return true;
  })()`);
  await waitFor(
    "location.pathname.includes('/es/employee/orders/demo-order-') && document.body.innerText.includes('Descargar recibo PDF')",
    "confirmed demo order",
  );
  const orderSummary = await evaluate(`({
    number: document.body.innerText.match(/PED-DEMO-\\d{4}/)?.[0] || "",
    selectedPresent: ${JSON.stringify(
      catalogSummary.selected,
    )}.every((mpn) => document.body.innerText.includes(mpn))
  })`);
  if (!orderSummary.number || !orderSummary.selectedPresent) {
    throw new Error("Order interface validation failed.");
  }

  await send("Emulation.setDeviceMetricsOverride", {
    width: 1024,
    height: 768,
    deviceScaleFactor: 1,
    mobile: true,
    screenWidth: 1024,
    screenHeight: 768,
  });
  await evaluate(`(() => {
    const link = [...document.querySelectorAll("a")].find(
      (item) => item.textContent.includes("Ver recibo")
    );
    if (!link) throw new Error("Receipt link not found");
    link.click();
    return true;
  })()`);
  await waitFor(
    "location.pathname.includes('/es/employee/receipts/demo-receipt-') && document.body.innerText.includes('DOCUMENTO DE PRUEBA')",
    "demo receipt",
  );
  const receiptSummary = await evaluate(`(() => {
    const text = document.body.innerText;
    const pdfLink = document.querySelector('a[href*="/api/employee/orders/"][href$="/receipt"]');
    return Promise.resolve(fetch(pdfLink.href)).then(async (response) => ({
      receiptNumber: text.match(/REC-DEMO-\\d{4}/)?.[0] || "",
      quoteNumber: text.match(/COT-DEMO-\\d{4}/)?.[0] || "",
      mark: text.includes("DOCUMENTO DE PRUEBA — SIN VALIDEZ COMERCIAL"),
      banner: text.includes("MODO DEMOSTRACIÓN — Datos sintéticos"),
      resetVisible: text.includes("Reiniciar datos de demostración"),
      orderConfirmed: text.includes("confirmed"),
      pdfStatus: response.status,
      pdfType: response.headers.get("content-type"),
      pdfSize: (await response.arrayBuffer()).byteLength,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1
    }));
  })()`);
  if (
    !receiptSummary.receiptNumber ||
    receiptSummary.quoteNumber !== quoteDetail.quoteNumber ||
    !receiptSummary.mark ||
    !receiptSummary.banner ||
    !receiptSummary.resetVisible ||
    !receiptSummary.orderConfirmed ||
    receiptSummary.pdfStatus !== 200 ||
    receiptSummary.pdfType !== "application/pdf" ||
    receiptSummary.pdfSize < 1000 ||
    receiptSummary.overflow
  ) {
    throw new Error(
      `Receipt or landscape layout validation failed: ${JSON.stringify({
        receiptSummary,
        quoteDetail,
      })}`,
    );
  }
  const receiptScreenshot = await capture("ipad-landscape-receipt.png");

  const finalSummary = {
    login: loginView,
    catalog: catalogSummary,
    quote: quoteDetail,
    reservation: reservationSummary,
    order: orderSummary,
    receipt: receiptSummary,
    screenshots: {
      dashboard: dashboardScreenshot,
      receipt: receiptScreenshot,
    },
    browserErrors,
  };
  console.log(JSON.stringify(finalSummary, null, 2));
} finally {
  if (socket?.readyState === WebSocket.OPEN) socket.close();
  browserProcess.kill();
  await sleep(300);
  await rm(profileDirectory, { recursive: true, force: true }).catch(
    () => undefined,
  );
}
