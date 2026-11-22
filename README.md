# MM-Portfolio

Personal portfolio and admin studio, built with Next.js 16 (App Router), TypeScript and MongoDB Atlas.

The project currently contains only the foundation: routing, authentication, sessions, route protection, logging and docs. The public portfolio and the studio modules are placeholders.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

Generate `SESSION_SECRET` with `openssl rand -base64 48`.

| Command | Purpose |
| --- | --- |
| `npm run dev` | dev server |
| `npm run build` | production build |
| `npm start` | serve the production build |
| `npm run lint` | ESLint |

## Docs

- [Architecture](docs/architecture.md)
- [Authentication and security](docs/auth-security.md)
- [Logging and errors](docs/logging.md)
- [Features](docs/features.md)
- [Progress](docs/progress.md)
