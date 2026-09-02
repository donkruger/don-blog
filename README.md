# Don Kruger Blog

Personal essay site with subtle GSAP scroll animations. Built with Vite + TypeScript. Deploys to [don-kruger-blog.netlify.app](https://don-kruger-blog.netlify.app).

## Develop

```bash
npm install
npm run dev
```

`predev` / `prebuild` run `scripts/build-posts.mjs`, which turns Markdown in `content/posts/` into HTML under `posts/<slug>/` and refreshes the home index list.

## Add a post

1. Add `content/posts/your-slug.md` with frontmatter:

```yaml
---
title: Your title
slug: your-slug
date: "2026-09-15"
description: One-sentence summary for the index and OG tags.
thumbnail: /images/posts/your-slug.png
ogImage: /images/og/your-slug.jpg
tags: [essay]
---
```

Quote the `date` as a string so YAML does not parse it as a Date object.

2. Put the in-page thumbnail at `public/images/posts/your-slug.png`.
3. Add a **1200×630** JPEG share image at `public/images/og/your-slug.jpg` (Facebook/LinkedIn/X best practice). Keep it under ~300KB.
4. Write the body in Markdown (`##` for section headings).
5. Run `npm run dev` or `npm run build`.

Home and posts ship Open Graph + Twitter `summary_large_image` tags with absolute image URLs, width/height, and alt text.

## Build & preview

```bash
npm run build
npm run preview
```

Output lands in `dist/` for Netlify.

## Deploy (Netlify)

1. Connect this repo to Netlify.
2. Site name: `don-kruger-blog` (URL: `don-kruger-blog.netlify.app`).
3. Build settings come from `netlify.toml` (`npm run build` → publish `dist`).
4. Push to `main`.

Pipeline mirrors the Sarah Mason canvas pattern (headers, short HTML cache, clean post URLs) with a real Vite build step.

## Motion notes

- GSAP + ScrollTrigger live in `src/lib/`.
- `gsap.matchMedia()` gates desktop scrub/parallax; mobile keeps light once-play fades.
- `prefers-reduced-motion: reduce` skips motion and shows final states.
