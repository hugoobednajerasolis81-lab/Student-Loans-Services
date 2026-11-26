import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";

async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Could not allocate a test port.");
  const port = address.port;
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return port;
}

test("production server serves public site and React Router routes", async t => {
  const port = await freePort();
  const child = spawn(process.execPath, ["server.mjs"], {
    cwd: new URL("../apps/web/", import.meta.url),
    env: { ...process.env, PORT: String(port), NODE_ENV: "production" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let logs = "";
  child.stdout.on("data", chunk => { logs += chunk.toString(); });
  child.stderr.on("data", chunk => { logs += chunk.toString(); });
  t.after(() => child.kill("SIGTERM"));

  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    try {
      const response = await fetch(`${base}/healthz`);
      if (response.ok) { ready = true; break; }
    } catch {}
    await delay(100);
  }
  assert.equal(ready, true, `production server did not start: ${logs}`);

  const home = await fetch(base);
  assert.equal(home.status, 200);
  assert.match(await home.text(), /Student Loans Solutions/);

  const login = await fetch(`${base}/login`);
  assert.equal(login.status, 200);
  assert.match(await login.text(), /Welcome back/);

  const crm = await fetch(`${base}/crm`);
  assert.equal(crm.status, 200);
  assert.match(await crm.text(), /Inquiry overview/);

  const advisorAlias = await fetch(`${base}/advisor.html`, { redirect: "manual" });
  assert.equal(advisorAlias.status, 302);
  assert.equal(advisorAlias.headers.get("location"), "/login");
});
