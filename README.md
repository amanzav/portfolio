# Aman Zaveri - portfolio

A static Next.js portfolio with a pencil-rendered robotic arm, responsive work summaries, and standalone engineering articles.

## Develop

Use Node.js 22.13 or newer.

```sh
npm ci
npm run dev
```

The development command builds the arm bundle before starting Next.js.
After editing `portfolio/runtime/`, run `npm run build:portfolio` to refresh that bundle.

## Verify and preview production

```sh
npm run lint
npm run build
npm test
npm start
```

Open http://127.0.0.1:3000/ to review the exact static files that will be deployed.
Tests include the arm geometry and carries, article links, exported routes, and publishing metadata.

## Structure

- `app/(sketch)/` contains the new homepage and article routes.
- `portfolio/runtime/` contains the approved arm model, pencil renderer, interaction logic, and geometry tests.
- `components/portfolio/` bridges the isolated animation runtime into React and supplies readable fallback content.
- `content/articles/` contains the reviewed article markup, rendered on the server at build time.
- `app/(legacy)/` preserves existing project and experience URLs in their original layout.

The homepage renders readable work and contact links before JavaScript runs.
The 3D code loads only on the homepage, retains the fixed phone arm, respects reduced motion, and releases resources when unmounted.
If the renderer fails or loses its context, the readable summaries remain available.

The articles remain directly accessible at `/vooma/`, `/boomerang/`, `/ford/`, `/autopark/`, `/autopark/ppo/`, and `/multibot/`.
They are intentionally not linked from the homepage summaries.

## Deployment

GitHub Actions runs lint, builds the static export, and tests it when `main` is pushed.
Vercel handles production publishing through the repository’s existing integration.
The custom domain is `www.azaveri.com`.
Generated bundles in `public/portfolio/` and local design studies in `prototypes/` are excluded from Git.
