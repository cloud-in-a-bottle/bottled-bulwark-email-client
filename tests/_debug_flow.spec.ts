import { test } from "@playwright/test";

const TOKEN = "xF3AcicsEB3HMWlilmF5YQZJ9R5fb_iKAvQIcnipHXY";

test.use({ extraHTTPHeaders: { Authorization: `Bearer ${TOKEN}` } });

test("trace login flow", async ({ page }) => {
  page.on("request", (req) => {
    console.log("REQ", req.method(), req.url());
  });
  page.on("response", async (res) => {
    const url = res.url();
    const status = res.status();
    const loc = res.headers()["location"];
    console.log("RES", status, url, loc ? `→ ${loc}` : "");
  });
  page.on("console", (msg) => {
    console.log("CON", msg.type(), msg.text());
  });

  await page.goto("https://webmail.host.zackpolizzi.com/owner-login");
  await page.waitForTimeout(8000);
  console.log("FINAL URL:", page.url());
});
