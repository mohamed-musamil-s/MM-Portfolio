/**
 * Vercel "Ignored Build Step" (vercel.json `ignoreCommand`), the second guard
 * behind `git.deploymentEnabled`. See docs/deployment.md.
 *
 * Vercel's convention: exit 1 = build, exit 0 = skip.
 *
 *   go-live -> Production only
 *   develop -> Preview only
 *   anything else (feature branches, manual deploys of other refs) -> skipped
 */
const RULES = { "go-live": "production", develop: "preview" };

const branch = process.env.VERCEL_GIT_COMMIT_REF ?? "";
const target = process.env.VERCEL_ENV ?? "";
const expected = RULES[branch];

if (expected && expected === target) {
  console.log(`Building ${branch} for ${target}.`);
  process.exit(1);
}
console.log(
  expected
    ? `Skipping: ${branch} deploys to ${expected}, not ${target || "an unknown environment"}.`
    : `Skipping: "${branch || "unknown"}" is not a deployment branch (only develop and go-live deploy).`,
);
process.exit(0);
