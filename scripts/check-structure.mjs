import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const required = [
  "package.json",
  "apps/web/package.json",
  "apps/web/server.mjs",
  "apps/web/vite.config.ts",
  "apps/web/react-router.config.ts",
  "apps/web/src/root.tsx",
  "apps/web/src/entry.client.tsx",
  "apps/web/src/entry.server.tsx",
  "apps/web/src/routes.ts",
  "apps/web/src/routes/login.tsx",
  "apps/web/src/routes/crm.tsx",
  "apps/web/src/routes/sign.tsx",
  "apps/web/src/routes/api.public-inquiry.ts",
  "apps/web/public/index.html",
  "apps/pocketbase/pb_hooks/password-reset-email.pb.js"
];

const missing = required.filter(file => !existsSync(join(root, file)));
if (missing.length) {
  console.error("Required application files are missing:");
  for (const file of missing) console.error(`- ${file}`);
  process.exit(1);
}

const rootPackage = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const webPackage = JSON.parse(readFileSync(join(root, "apps/web/package.json"), "utf8"));
if (!rootPackage.workspaces?.includes("apps/*")) {
  console.error('Root package.json must declare the "apps/*" workspace.');
  process.exit(1);
}
if (webPackage.scripts?.start !== "node server.mjs" || webPackage.scripts?.build !== "react-router build") {
  console.error("Web workspace scripts must build React Router and start the existing server.mjs.");
  process.exit(1);
}
console.log("Canonical React Router application structure checks passed.");
