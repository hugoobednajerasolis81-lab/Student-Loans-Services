import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const required = [
  "package.json",
  "apps/web/package.json",
  "apps/pocketbase/package.json"
];

const missing = required.filter((file) => !existsSync(join(root, file)));

if (missing.length > 0) {
  console.error("Repository structure is incomplete.");
  console.error("Missing:");
  for (const file of missing) console.error(`- ${file}`);
  console.error("\nThe copied Hostinger source still needs to be recovered into apps/web and apps/pocketbase.");
  process.exitCode = 1;
  process.exit();
}

const rootPackage = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const workspaces = rootPackage.workspaces ?? [];

if (!workspaces.includes("apps/*")) {
  console.error("Root package.json must declare the apps/* workspace.");
  process.exitCode = 1;
  process.exit();
}

console.log("Monorepo structure is present.");
