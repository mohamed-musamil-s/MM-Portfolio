/**
 * Adds shadcn/ui components to the studio and cleans up after the CLI.
 *
 *   npm run ui:add -- tooltip dialog
 *
 * The shadcn registry currently lists an npm package called `cn` as a
 * dependency and imports `cn` from it. That package is unrelated to the
 * project's helper, so after every add this script points the imports at
 * `@/lib/shared/cn` and uninstalls `cn` (docs/ADMIN_STYLE.md §5).
 */
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";

const UI_DIR = new URL("../src/components/studio/ui/", import.meta.url);
const components = process.argv.slice(2);
if (components.length === 0) {
  console.error("Usage: npm run ui:add -- <component> [...]");
  process.exit(1);
}

execFileSync("npx", ["--yes", "shadcn@latest", "add", ...components, "--yes"], { stdio: "inherit" });

let fixed = 0;
for (const name of readdirSync(UI_DIR).filter((file) => file.endsWith(".tsx"))) {
  const url = new URL(name, UI_DIR);
  const source = readFileSync(url, "utf8");
  const next = source.replace(/from "cn"/g, 'from "@/lib/shared/cn"');
  if (next !== source) {
    writeFileSync(url, next);
    fixed += 1;
  }
}

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
if (pkg.dependencies?.cn) {
  execFileSync("npm", ["uninstall", "cn"], { stdio: "inherit" });
}
console.log(`shadcn-add: fixed cn imports in ${fixed} file(s); stray "cn" package removed if present.`);
