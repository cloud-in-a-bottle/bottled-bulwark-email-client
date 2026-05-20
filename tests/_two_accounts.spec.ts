import { test, expect } from "@playwright/test";
import * as crypto from "crypto";

const TOKEN = "xF3AcicsEB3HMWlilmF5YQZJ9R5fb_iKAvQIcnipHXY";
const SESSION_SECRET = "openhost-bulwark-session-secret-key-do-not-share";

test.use({
  extraHTTPHeaders: { Authorization: `Bearer ${TOKEN}` },
});

function decryptCookie(b64: string) {
  const key = crypto.createHash("sha256").update(SESSION_SECRET).digest();
  const buf = Buffer.from(b64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, buf.subarray(0, 12));
  decipher.setAuthTag(buf.subarray(12, 28));
  const plain = Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString("utf8");
  return JSON.parse(plain);
}

test("auto-login seeds owner@ + me@ in both cookies and registry", async ({ page }) => {
  await page.goto("https://webmail.host.zackpolizzi.com/owner-login");
  await page.waitForURL(/\/en/, { timeout: 15000 });

  const cookies = await page.context().cookies();
  const byName = Object.fromEntries(cookies.map(c => [c.name, c.value]));
  expect(Object.keys(byName).sort()).toEqual(expect.arrayContaining([
    "jmap_session", "jmap_session_1", "jmap_stalwart_ctx", "jmap_stalwart_ctx_1",
  ]));

  const slot0 = decryptCookie(byName["jmap_session"]);
  const slot1 = decryptCookie(byName["jmap_session_1"]);
  expect(slot0.username).toBe("owner");
  expect(slot1.username).toBe("me");
  expect(slot0.serverUrl).toBe("https://webmail.host.zackpolizzi.com/jmap-proxy");
  expect(slot1.serverUrl).toBe("https://webmail.host.zackpolizzi.com/jmap-proxy");

  const registry = JSON.parse(await page.evaluate(() => localStorage.getItem("account-registry")));
  const users = registry.state.accounts.map((a: any) => a.username).sort();
  expect(users).toEqual(["me", "owner"]);

  // Make sure the inbox still loads for the default (slot 0 / owner) account
  await expect(page.getByText("Folders")).toBeVisible({ timeout: 20000 });
});
