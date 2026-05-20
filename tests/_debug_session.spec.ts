import { test } from "@playwright/test";

const TOKEN = "xF3AcicsEB3HMWlilmF5YQZJ9R5fb_iKAvQIcnipHXY";

test.use({ extraHTTPHeaders: { Authorization: `Bearer ${TOKEN}` } });

test("check session API after owner-login", async ({ page, request }) => {
  // Capture all responses including from sub-resources
  const sessionCalls: any[] = [];
  page.on("request", (req) => {
    if (req.url().includes("/api/") || req.url().includes("/jmap")) {
      console.log("REQ", req.method(), req.url(), JSON.stringify(req.postDataJSON?.() ?? {}).slice(0, 200));
    }
  });
  page.on("response", async (res) => {
    if (res.url().includes("/api/") || res.url().includes("/jmap")) {
      const body = await res.text().catch(() => "<bin>");
      sessionCalls.push({ method: res.request().method(), url: res.url(), status: res.status(), body: body.slice(0, 300) });
    }
  });

  await page.goto("https://webmail.host.zackpolizzi.com/owner-login");
  await page.waitForTimeout(5000);

  console.log("\nALL RESPONSES:");
  for (const c of sessionCalls) {
    console.log(c.method, c.status, c.url, "→", c.body);
  }

  console.log("\nFINAL URL:", page.url());

  // Now hit /api/auth/session with the cookies set by owner-login
  const resp = await page.request.get("https://webmail.host.zackpolizzi.com/api/auth/session");
  console.log("\nMANUAL /api/auth/session:", resp.status(), await resp.text());

  // Check cookies
  const cookies = await page.context().cookies();
  console.log("\nCOOKIES:");
  for (const c of cookies) {
    console.log(c.name, "=", c.value.slice(0, 40) + "...");
  }
});
