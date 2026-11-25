import { gsap, ScrollTrigger } from "../gsap";
import {
  createMotionMedia,
  motionQueries,
  type MotionContext,
} from "./reduced-motion";

/** Fraction of a heading's font-size used to land its dot near the first-line center. */
const DOT_LINE_FACTOR = 0.55;

/**
 * Bottom-of-viewport band where body content fades in.
 *
 * Both markers are keyed off the element's TOP edge so the scrub range
 * stays in document order for short and tall blocks alike. Keying start
 * off the bottom edge ("bottom bottom") inverted the range for anything
 * taller than ~20% of the viewport: mid-screen carousels and long
 * paragraphs stayed stuck in the pre-dimmed blur until the user scrolled
 * much further.
 *
 * The "pop" that bottom-keying tried to fix (lower lines of a tall block
 * arriving fully opaque before the fade arms) is handled by the immediate
 * `gsap.set` dim below — content is born faded, then clears as its top
 * crosses this band. End sits at 70% so anything at mid-viewport is
 * already fully readable.
 */
const FADE_START = "top 98%";
const FADE_END = "top 70%";

type DotEntry = { dot: HTMLElement; heading: HTMLElement; top: number };

/**
 * Decorative scroll "spine" for the essay column: a dashed rail with an
 * accent line that draws itself as you scroll, plus one milestone dot per
 * <h2> that lights up as the line passes it. Borrows the vertical-timeline
 * motif (rail + traveling line + lit nodes) without any dates or labels —
 * it's ambient scroll furniture, not a real timeline.
 *
 * Also drives the essay body's reveal: every direct child of
 * `.post-article__inner` sits at partial opacity/blur by default and clears
 * to fully visible while its top crosses the bottom band of the viewport
 * (`top 98%` → `top 70%`) — everything above that band is always fully
 * opaque, so the animation never fights reading. No-JS and reduced-motion
 * readers always see fully readable, fully lit content.
 */
export function initPostSpine(root: HTMLElement = document.body) {
  const mm = createMotionMedia();

  mm.add(
    motionQueries,
    (context: MotionContext) => {
      const { isDesktop, reduceMotion } = context.conditions ?? {};

      const inner = root.querySelector<HTMLElement>(".post-article__inner");
      if (!inner) return;

      // Defensive: drop any spine left behind by a stale run (e.g. HMR).
      inner.querySelector(".spine")?.remove();

      const contentChildren = Array.from(inner.children).filter(
        (el): el is HTMLElement => el instanceof HTMLElement,
      );
      const headings = contentChildren.filter((el) => el.tagName === "H2");

      let spineEl: HTMLElement | null = null;
      let progressEl: HTMLElement | null = null;
      let dotEntries: DotEntry[] = [];

      if (isDesktop && headings.length) {
        const spine = document.createElement("div");
        spine.className = "spine";
        spine.setAttribute("aria-hidden", "true");

        const progress = document.createElement("div");
        progress.className = "spine__progress";
        spine.appendChild(progress);

        dotEntries = headings.map((heading) => {
          const dot = document.createElement("span");
          dot.className = "spine__dot";
          spine.appendChild(dot);
          return { dot, heading, top: 0 };
        });

        gsap.set(
          dotEntries.map((entry) => entry.dot),
          { xPercent: -50, yPercent: -50, scale: 0 },
        );

        inner.insertBefore(spine, inner.firstChild);
        spineEl = spine;
        progressEl = progress;
      }

      let innerHeight = 0;

      function layoutSpine() {
        innerHeight = inner!.offsetHeight;
        dotEntries.forEach((entry) => {
          const fontSize =
            parseFloat(getComputedStyle(entry.heading).fontSize) || 16;
          entry.top = entry.heading.offsetTop + fontSize * DOT_LINE_FACTOR;
          entry.dot.style.top = `${entry.top}px`;
        });
      }

      layoutSpine();

      function setDotLit(entry: DotEntry, lit: boolean) {
        if (entry.dot.classList.contains("is-lit") === lit) return;
        entry.dot.classList.toggle("is-lit", lit);
        if (lit) {
          gsap.fromTo(
            entry.dot,
            { scale: 0 },
            {
              scale: 1,
              duration: 0.45,
              ease: "back.out(2.5)",
              overwrite: "auto",
            },
          );
        } else {
          // Softer un-light: no bounce, just settle — color fades via CSS.
          gsap.set(entry.dot, { scale: 1, overwrite: true });
        }
      }

      function updateDots(progress: number) {
        const tipY = progress * innerHeight;
        dotEntries.forEach((entry) => setDotLit(entry, entry.top <= tipY));
      }

      const onRefresh = () => layoutSpine();
      ScrollTrigger.addEventListener("refresh", onRefresh);

      if (reduceMotion) {
        // Present the finished state: rail fully drawn, every dot lit, no
        // scroll-linked motion, body fully legible.
        if (progressEl) gsap.set(progressEl, { scaleY: 1 });
        dotEntries.forEach((entry) => {
          entry.dot.classList.add("is-lit");
          gsap.set(entry.dot, { scale: 1 });
        });
        gsap.set(contentChildren, {
          autoAlpha: 1,
          y: 0,
          filter: "none",
          clearProps: "transform,filter",
        });
      } else {
        if (progressEl) {
          let lineTween: ReturnType<typeof gsap.to> | undefined;
          lineTween = gsap.to(progressEl, {
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
              trigger: inner,
              start: "top bottom",
              end: "bottom bottom",
              scrub: 0.4,
            },
            onUpdate: () => {
              if (lineTween) updateDots(lineTween.progress());
            },
          });
        }

        contentChildren.forEach((el) => {
          // Pre-apply the dimmed state immediately so the element is BORN
          // faded — with immediateRender:false the tween would otherwise
          // leave it at its natural (fully opaque) CSS state until the
          // ScrollTrigger first activates, producing a one-frame crisp
          // flash as text enters before the fade catches it.
          gsap.set(el, { autoAlpha: 0.28, y: 12, filter: "blur(4px)" });
          gsap.to(el, {
            autoAlpha: 1,
            y: 0,
            filter: "blur(0px)",
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: FADE_START,
              end: FADE_END,
              // Exact (unsmoothed) scrub: the fade must always match the
              // element's real viewport position, even on a fast/flick
              // scroll — a lagged catch-up could let dimmed text bleed
              // above the intended bottom band.
              scrub: true,
            },
          });
        });
      }

      const onLoad = () => ScrollTrigger.refresh();
      window.addEventListener("load", onLoad);
      root.querySelectorAll("img").forEach((img) => {
        if (!img.complete) img.addEventListener("load", onLoad, { once: true });
      });
      document.fonts.ready.then(() => ScrollTrigger.refresh());

      return () => {
        window.removeEventListener("load", onLoad);
        ScrollTrigger.removeEventListener("refresh", onRefresh);
        spineEl?.remove();
      };
    },
    root,
  );

  return () => mm.revert();
}
