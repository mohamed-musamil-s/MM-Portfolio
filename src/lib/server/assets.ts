import "server-only";
import { existsSync } from "node:fs";
import path from "node:path";

const PUBLIC_DIR = path.join(process.cwd(), "public");

/**
 * Whether a /public asset referenced from database content exists on disk.
 * Checked per request, so dropping a file into public/ needs no code change.
 * Paths are already schema-validated (/images/..., no dots); the prefix check
 * is a second guard against traversal.
 */
export const publicAssetExists = (src: string): boolean => {
  const resolved = path.join(PUBLIC_DIR, src);
  return resolved.startsWith(`${PUBLIC_DIR}${path.sep}`) && existsSync(resolved);
};
