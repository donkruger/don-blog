import { gsap, ScrollTrigger } from "../gsap";
import {
  createMotionMedia,
  motionQueries,
  revealImmediately,
  type MotionContext,
} from "./reduced-motion";

/**
 * Post motion stays off the essay body — reading first.
 * Only hero chrome + reading progress animate.
 */
export function initPostAnimations(root: HTMLElement = document.body) {
  const mm = createMotionMedia();

  mm.add(
    motionQueries,
    (context: MotionContext) => {
      const { isDesktop, reduceMotion } = context.conditions ?? {};

      const progress = root.querySelector<HTMLElement>(".reading-progress");
      const heroImg = root.querySelector(".post-hero__media img");
      const heroTitle = root.querySelector(".post-hero__title");
      const heroMeta = root.querySelector(".post-hero__meta");
      const heroDesc = root.querySelector(".post-hero__description");
      const article = root.querySelector(".post-article__inner");

      revealImmediately([heroTitle, heroMeta, heroDesc].filter(Boolean));

      if (reduceMotion) {
        if (progress) gsap.set(progress, { scaleX: 1 });
        return;
      }

      gsap
        .timeline({ defaults: { ease: "power2.out" } })
        .from(heroMeta, {
          autoAlpha: 0,
          y: 16,
          duration: 0.7,
          immediateRender: false,
        })
        .from(
          heroTitle,
          { autoAlpha: 0, y: 28, duration: 1, immediateRender: false },
          "-=0.4",
        )
        .from(
          heroDesc,
          { autoAlpha: 0, y: 18, duration: 0.8, immediateRender: false },
          "-=0.55",
        );

      if (progress && article) {
        gsap.to(progress, {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: article,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.35,
          },
        });
      }

      if (isDesktop && heroImg) {
        gsap.to(heroImg, {
          yPercent: 5,
          ease: "none",
          scrollTrigger: {
            trigger: ".post-hero",
            start: "top top",
            end: "bottom top",
            scrub: 1.1,
          },
        });
      }

      const refresh = () => ScrollTrigger.refresh();
      window.addEventListener("load", refresh);
      root.querySelectorAll("img").forEach((img) => {
        if (!img.complete) img.addEventListener("load", refresh, { once: true });
      });

      return () => {
        window.removeEventListener("load", refresh);
      };
    },
    root,
  );

  return () => mm.revert();
}
