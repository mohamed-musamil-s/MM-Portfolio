# Screen: Studio Pulse (`/studio/analytics`), Business Spec

The studio's analytics module: the portfolio's traffic from Vercel Web Analytics.

## 1. Business purpose

See who visits the portfolio, how much, and from where:

- visitors and page views over time;
- the top pages, referrers, countries and devices.

All of it without leaving the studio.

## 2. Data and environments

- **Collection:** `@vercel/analytics` (`<Analytics />`) runs on the public pages only, never in the studio. Web Analytics must be enabled for the Vercel project. Local development sends nothing.
- **Source:** the Vercel Web Analytics API, `GET https://api.vercel.com/v1/query/web-analytics/visits/aggregate` ([docs](https://vercel.com/docs/analytics/web-analytics-api)), read on the server only. The token never reaches the browser, and responses are cached for 60 s.
- **Environment rule:**
  - **Production deployment** (`VERCEL_ENV=production`): production data only (`filter=environment eq 'production'`).
  - **Everywhere else** (local and the dev/preview deployment): preview data (`filter=environment eq 'preview'`).
  - The screen says which one it shows.
- **Configuration (environment variables, set by the owner; never in code):**
  - `VERCEL_ANALYTICS_TOKEN`: a Vercel access token.
  - `VERCEL_ANALYTICS_PROJECT`: the project id or name.
  - `VERCEL_ANALYTICS_TEAM` (optional): the team id or slug.
  - When the token or project is missing, the screen shows a setup card that names these variables.
- **Queries per view** (one range: 7 or 30 days, `?range=`):
  - totals (`by=environment`);
  - the same totals for the previous range, for the change;
  - visitors and page views per day (`by=day`);
  - top pages (`by=requestPath`), referrers (`by=referrerHostname`), countries (`by=country`) and devices (`by=deviceType`), 8 each.

## 3. Layout

- **Page header:**
  - the module title and description;
  - an environment badge: "Preview data" or "Production data", with a one-line explanation;
  - a range switch: 7 / 30 days (Vercel Hobby keeps 31 days of data, so there is no 90-day range).
- **Stat cards:**
  - Visitors and Page views, each with the change against the previous range;
  - Views per visitor.
- **Chart:** visitors per day as an area with a line, and page views as a lighter line. The axis shows dates; hovering a day shows its numbers.
- **Breakdowns:** four lists (pages, referrers, countries, devices). Each row has its label, its visitors and a bar showing its share of the top row.
- **States:**
  - **No data yet:** "No visits recorded for this range yet."
  - **Missing configuration:** the setup card.
  - **API error:** a message that matches the cause: bad token, no permission, plan, Web Analytics turned off for the project (Vercel's `web_analytics_not_enabled`), or other. The plan's data window (Hobby keeps the latest 31 days) shows as the plan message for any range past it; when only the comparison range is past it (30 days), the change reads "No earlier data to compare".

## 4. Content (`site_screens/studio-shell`, `pulse`)

Every label, hint, state message and the setup card's text.

## 5. Accessibility and motion

- The chart has a text alternative: a summary sentence, plus a visually hidden table of the daily numbers.
- The range switch is a set of links (the server renders each range), with `aria-current` on the active one.
- Cards rise in once; nothing loops.
