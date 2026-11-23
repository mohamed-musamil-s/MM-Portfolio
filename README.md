# MM-Portfolio

Personal portfolio and admin studio, built with Next.js 16 (App Router), TypeScript and MongoDB Atlas.

The project currently contains only the foundation: routing, authentication, sessions, route protection, logging and docs. The public portfolio and the studio modules are placeholders.

## Getting started

```bash
npm install
cp .env.development.example .env.development   # then fill in the values (see docs/deployment.md)
npm run seed:screens         # one-time: default page content into MongoDB
npm run dev                  # http://localhost:3000
```

Generate `SESSION_SECRET` with `openssl rand -base64 48`.

| Command | Purpose |
| --- | --- |
| `npm run dev` | dev server |
| `npm run build` | production build |
| `npm start` | serve the production build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier (also sorts Tailwind classes) |
| `npm run seed:screens` | Insert default screen content into MongoDB (`-- --force` to replace) |

## Docs

- [Architecture](docs/architecture.md)
- [Authentication and security](docs/auth-security.md)
- [Logging and errors](docs/logging.md)
- [Features](docs/features.md)
- [Progress](docs/progress.md)
- [Public design system](docs/STYLE.md) (public portfolio only)
- [Studio design system](docs/ADMIN_STYLE.md) (placeholder, with provisional tokens)
- [Animation and interactive UI](docs/ANIMATION_UI.md) (motion stack, MagicIcon, ActionButton)
- Screen specs: [Maintenance](docs/screens/MAINTENANCE_BUSINESS.md)
