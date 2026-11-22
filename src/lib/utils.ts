/**
 * shadcn/ui's conventional utils path (components.json "utils"). The CLI
 * mis-resolves custom paths, so this re-export keeps `shadcn add` working;
 * the implementation lives in lib/shared/cn.ts.
 */
export { cn } from "./shared/cn";
