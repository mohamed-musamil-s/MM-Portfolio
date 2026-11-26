# Deployment (Vercel)

How code gets from a laptop to the live site: two long-lived branches, two Vercel environments, two sets of environment variables. Security of the deployed app is in [auth-security.md](auth-security.md).

## 1. Branches

| Branch                                       | Role                                  | Deploys to            |
| -------------------------------------------- | ------------------------------------- | --------------------- |
| `develop`                                    | Latest finished work, ready to review | Vercel **Preview**    |
| `go-live`                                    | What visitors see                     | Vercel **Production** |
| anything else (`feature/…`, `fix/…`, `main`) | Day-to-day work                       | **Nothing**           |

### Workflow

1. Branch off `develop` for every change: `git switch develop && git pull && git switch -c feature/<name>`.
2. Work and commit on that branch. Pushing it deploys nothing.
3. Merge into `develop` (pull request). Vercel builds a Preview deployment; check it.
4. When the preview is right, merge `develop` into `go-live` (pull request). Vercel builds Production.
5. Hotfix: branch off `go-live`, merge back into `go-live`, then merge `go-live` into `develop` so `develop` never falls behind.

Rules:

- Never commit directly to `develop` or `go-live`; always merge through a pull request.
- `go-live` only ever receives merges from `develop` (or a hotfix branch).
- Recommended on GitHub (Settings → Branches): make `develop` the default branch, and protect `develop` and `go-live` (require a pull request, block force pushes and deletion).

## 2. How deployments are restricted to the two branches

Two guards, both in the repository:

1. **`vercel.json` → `git.deploymentEnabled`**: `"*": false` turns automatic deployments off for every branch; `develop` and `go-live` turn them back on (Vercel deploys a branch when any rule matching it is `true`).
2. **`vercel.json` → `ignoreCommand`** runs `scripts/vercel-ignore-build.mjs` before each build. It builds only `go-live` → Production and `develop` → Preview, and skips everything else, including a manual redeploy of another branch or a branch sent to the wrong environment. (Exit 1 = build, exit 0 = skip; test it with `VERCEL_GIT_COMMIT_REF=develop VERCEL_ENV=preview node scripts/vercel-ignore-build.mjs`.)

## 3. One-time Vercel setup (dashboard)

1. **Import** the GitHub repository as a new project (framework: Next.js; build and install commands: defaults).
2. **Settings → Environments → Production → Branch Tracking**: set the production branch to **`go-live`**. Vercel starts with the GitHub default branch (here `develop`); until this is changed, `develop` is treated as production and the build guard skips it, so nothing deploys.
3. **Settings → Environment Variables**: add the variables from section 4 twice:
   - **Production**: production values.
   - **Preview**: development/preview values. Optionally scope them to the `develop` branch only.
   - Leave **Development** empty unless you use `vercel env pull`.
   - Mark `MONGODB_URI`, `ADMIN_ACCESS_CODE` and `SESSION_SECRET` as **Sensitive**.
4. **MongoDB Atlas → Network Access**: allow Vercel to connect. On the free tier that means `0.0.0.0/0`, so keep the database user's password strong and its rights limited to the two databases.
5. **Seed the production database once** (from a laptop, with `.env.production` filled in): `npm run seed:screens:prod`. Then set the real owner name and any content through the studio.
6. Optional: **Settings → Deployment Protection** → Vercel Authentication for Preview, so only your Vercel account can open preview URLs.

## 4. Environment variables

### Where each value lives

| Where                                 | File / place                                          | Read by                                            | Committed?               |
| ------------------------------------- | ----------------------------------------------------- | -------------------------------------------------- | ------------------------ |
| Laptop, `npm run dev`                 | `.env.development`                                    | Next dev server, `npm run seed:screens`            | **No** (gitignored)      |
| Laptop, `npm run build` / `npm start` | `.env.production`                                     | Next build and server, `npm run seed:screens:prod` | **No** (gitignored)      |
| Vercel Preview (`develop`)            | Dashboard → Environment Variables → Preview           | Vercel build and functions                         | n/a (stored in Vercel)   |
| Vercel Production (`go-live`)         | Dashboard → Environment Variables → Production        | Vercel build and functions                         | n/a (stored in Vercel)   |
| Templates                             | `.env.development.example`, `.env.production.example` | People                                             | **Yes** (no real values) |

The two local files and the two Vercel environments are separate on purpose: **Vercel never reads `.env.development` or `.env.production`** (they are not in the repository), and the laptop never reads Vercel's values. Each place gets its own copy.

Next.js picks the local file by command: `next dev` loads `.env.development`, `next build` / `next start` load `.env.production`. A `.env.local` file, if present, overrides both and should not be used in this project; delete it if one exists.

### Variables

| Variable               | Development / Preview | Production                                   | Notes                                                                                                                |
| ---------------------- | --------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `MONGODB_URI`          | Atlas URI             | Atlas URI (ideally a separate database user) | Secret. Never logged (the logger redacts it).                                                                        |
| `MONGODB_DB`           | `mm-portfolio`        | `mm-portfolio-prod`                          | Separate databases: preview edits never touch the live site.                                                         |
| `ADMIN_EMAIL`          | admin email           | admin email                                  |                                                                                                                      |
| `ADMIN_ACCESS_CODE`    | any 4+ characters     | **16+ characters**                           | Secret.                                                                                                              |
| `SESSION_SECRET`       | random, 32+ chars     | **different** random, 32+ chars              | Secret. `openssl rand -base64 48`. Different per environment, so a preview session cookie never works on production. |
| `LOG_LEVEL`            | `debug` / `info`      | `info`                                       |                                                                                                                      |
| `CORS_ALLOWED_ORIGINS` | empty                 | empty                                        | Optional. Other origins allowed to read public GET APIs.                                                             |

### Never committed

- `.gitignore` ignores `.env*` and only lets `.env*.example` through.
- Secrets are read lazily on the server (`src/lib/server/env.ts`); nothing is prefixed `NEXT_PUBLIC_`, so no value reaches the browser bundle.
- Before every commit: `git status` must not list any `.env.*` file other than the two templates.

### Pulse (Vercel Web Analytics)

1. In the Vercel project, open **Analytics** and enable **Web Analytics**. The public pages already include `<Analytics />`.
2. Create an access token (Vercel **Account Settings → Tokens**) that can read the project.
3. Add `VERCEL_ANALYTICS_TOKEN`, `VERCEL_ANALYTICS_PROJECT` (project id or name, e.g. the project's name) and `VERCEL_ANALYTICS_TEAM` (team id or slug) to `.env.development` and `.env.production`, and to Vercel **Preview** and **Production**.
4. Pulse shows preview data locally and on the dev deployment, and production data only on production.

## 5. Checklist before the first production deploy

- [ ] `develop` and `go-live` pushed to GitHub (`git push -u origin develop go-live`).
- [ ] Vercel production branch = `go-live`.
- [ ] Preview and Production variables set (section 4), production access code long, secrets different.
- [ ] Production database seeded; owner name set in the studio.
- [ ] Atlas network access allows Vercel.
- [ ] A test push to a feature branch shows **no** deployment; a merge into `develop` shows a Preview; a merge into `go-live` shows Production.
- [ ] `https://<production-domain>/api/health` returns `{"ok":true,…}`.
