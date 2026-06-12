# Portfolio (Duolingo-style)

A single-page developer portfolio using the Duolingo Playground design tokens: Duo Green CTAs, 3D primary buttons, Feather-style headlines (Fredoka), and DIN Round body text (Nunito Sans).

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Design tokens

All tokens live in `src/styles/tokens.css`. Component styles are in `src/styles/main.css`.

| Token | Value |
|-------|-------|
| Primary CTA | `--color-duo-green` |
| Secondary / links | `--color-sky-blue` |
| Headlines | `--font-feather` (Fredoka) |
| UI / body | `--font-din-round` (Nunito Sans) |

## Customize

- Edit copy and links in `index.html`
- Replace placeholder projects, skills, and `nikita.dev` branding
- Swap SVG illustrations in `src/illustrations.js`
