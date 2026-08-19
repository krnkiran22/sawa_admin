<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Sawa Admin — Agent & Developer Guidelines

> Last verified: 2026-08-19 against `main` `e5167fe` (Next.js 16.2, React 19.2,
> Tailwind 4). **Living document**: if your change makes a line here false,
> update it in the same commit.

## 1. What this is

The admin panel for the Sawa couples app: moderation, communities, prompts,
blocks, dashboards. Small and clean — keep it that way.

## 2. Non-negotiables

- **The block above is law.** Next 16 broke things your training data believes.
  Check `node_modules/next/dist/docs/` for the feature you're touching before
  writing Next-specific code. React is 19.2 — same caution applies.
- App Router at the repo root: routes in `app/<segment>/`, shared UI in
  `app/components/`, utilities in `app/lib/`. Follow the existing segment
  pattern; no `pages/` directory, no `src/`.
- Tailwind 4 for styling — match existing utility patterns; no new CSS
  frameworks, no styled-components.
- Auth and error handling were deliberately hardened (`e5167fe`): every new
  route participates in the existing auth checks and error-boundary structure
  (`app/error.tsx`, `app/loading.tsx`, `app/not-found.tsx`). Don't bypass
  them, don't roll your own.
- This panel talks to the sawa_server API — respect its response envelope
  (`{ success, data, message }`) and never hardcode secrets or base URLs
  outside env config.

## 3. Gates before any commit

1. `npm run build` — must pass (Next 16's build catches what dev mode won't).
2. `npm run lint` — no new issues.
3. Stage by named file paths; Conventional Commits (`feat(scope): …`).
4. Work on a branch, PR to `main` — no direct pushes.

## 4. Keeping this file true

Any commit changing the stack, structure, or rules above must update this file
in the same commit and bump the "Last verified" line. The fenced
`nextjs-agent-rules` block is tool-managed — never edit inside its markers.
