# AGENTS.md — Don Kruger Blog

Guidance for AI agents and contributors working in this repo. Keep changes consistent with the existing patterns below rather than introducing new ones.

## Stack

- Vite + TypeScript (multi-page app), GSAP 3 + ScrollTrigger for motion.
- Posts are Markdown in `content/posts/`, built to static HTML by `scripts/build-posts.mjs` (runs on `predev` / `prebuild`).
- Deploys to Netlify on push to `main` (`npm run build` → `dist`).

## Commands

- `npm run dev` — local dev server (rebuilds posts first).
- `npm run build` — type-check (`tsc`) + production bundle. Run this before pushing; a broken build breaks the Netlify deploy.
- `npm run preview` — serve the production build locally.

## Project layout

- `src/lib/gsap.ts` — registers the GSAP plugin once and sets global defaults. Import `gsap` / `ScrollTrigger` from here, never from `gsap` directly.
- `src/lib/animations/` — one module per page (`home.ts`, `post.ts`) plus feature modules (`post-spine.ts`). Each exports an `init*(root)` that returns a cleanup function.
- `src/lib/animations/reduced-motion.ts` — shared `gsap.matchMedia()` setup (`createMotionMedia`, `motionQueries`) and `revealImmediately`.
- `src/styles/` — `tokens.css` (design tokens) → `base.css` → page CSS. Use the `var(--*)` tokens; don't hardcode colors/spacing/easing.

## Motion conventions

Motion is decorative and must never fight reading. Follow these rules for any new animation:

1. **Register via `src/lib/gsap.ts`** — the plugin is registered there once; import from it, don't re-register.
2. **Gate with `gsap.matchMedia()`** using the shared `motionQueries` (`isDesktop` ≥ 800px, `isMobile`, `reduceMotion`). Heavy/pinned/scrubbed motion is desktop-only; mobile gets light once-play fades.
3. **Always handle `prefers-reduced-motion`** — render the final, fully-visible state with no motion. Never leave content hidden, dimmed, or mid-animation for reduced-motion users.
4. **No-JS must be readable** — set initial hidden/dimmed states from JS (e.g. `gsap.from` / `gsap.fromTo`), not from CSS. If scripts fail, content renders fully visible.
5. **Reader UX on body text** — scroll-driven reveals on article body content are confined to the **bottom ~18% of the viewport** (`start: "top 98%"` → `end: "top 80%"`) and use an **exact scrub (`scrub: true`)**, never a smoothed/lagged scrub, so dimmed text can't bleed above the band on fast scrolls. See `post-spine.ts` for the reference implementation and rationale.
6. **Decorative vs content motion** — ambient ornament (e.g. the spine rail/line) may use smoothed scrub (`scrub: 0.4`) for a catch-up feel; anything affecting legibility may not.
7. **Clean up** — every `init*` returns a cleanup that reverts `matchMedia` and removes any injected DOM. Wire cleanups into the page entry's `import.meta.hot.dispose` handler (see `src/post.ts`).
8. **Refresh triggers after layout shifts** — call `ScrollTrigger.refresh()` on window `load`, on image `load`, and on `document.fonts.ready` so trigger positions stay correct as fonts/images arrive.

## The scroll spine (post pages)

`src/lib/animations/post-spine.ts` renders a decorative vertical "spine" in the left gutter of `.post-article__inner`: a dashed rail, an accent line that draws on scroll, and one milestone dot per `h2` that lights as the line passes it. It borrows the vertical-timeline motif (rail + traveling line + lit nodes) with **no dates or labels** — it is ambient scroll furniture, not a real timeline. Keep it that way: don't attach metadata, links, or interactivity to the dots.

- Spine DOM is injected at runtime and marked `aria-hidden="true"`.
- Dots are laid out from each heading's `offsetTop` and re-laid-out on `ScrollTrigger` refresh.
- Desktop-only; below 800px there is no gutter to hold it.

## Styling conventions

- Use design tokens from `src/styles/tokens.css` (`--color-*`, `--space-*`, `--font-*`, `--ease-out`, `--measure`).
- Easing for entrances is `var(--ease-out)` / GSAP `power2.out`; scroll-linked tweens use `ease: "none"`.
- Keep animation CSS (keyframes, lit states) next to the page styles in `src/styles/`.

## Commits

- Short imperative subject line (see `git log`), wrapped body explaining the *why* when it's not obvious.
- Push to `main` only after `npm run build` passes locally.
