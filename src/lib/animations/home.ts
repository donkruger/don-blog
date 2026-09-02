import { gsap, ScrollTrigger } from "../gsap";
import {
  createMotionMedia,
  motionQueries,
  revealImmediately,
  type MotionContext,
} from "./reduced-motion";

export function initHomeAnimations(root: HTMLElement = document.body) {
  const mm = createMotionMedia();

  mm.add(motionQueries, (context: MotionContext) => {
    const { isDesktop, reduceMotion } = context.conditions ?? {};

    const brand = root.querySelector(".home-brand");
    const headline = root.querySelector(".home-headline");
    const lede = root.querySelector(".home-lede");
    const cta = root.querySelector(".home-cta");
    const heroImg = root.querySelector(".home-hero__atmosphere img");
    const cards = gsap.utils.toArray<HTMLElement>(
      root.querySelectorAll(".post-card"),
    );
    const cardImgs = gsap.utils.toArray<HTMLElement>(
      root.querySelectorAll(".post-card__media img"),
    );

    // Never leave content unreadable / unclickable.
    revealImmediately([brand, headline, lede, cta, ...cards].filter(Boolean));

    if (reduceMotion) return;

    const intro = gsap.timeline({ defaults: { ease: "power2.out" } });
    intro
      .from(
        brand,
        { autoAlpha: 0, y: 28, duration: 1, immediateRender: false },
        0,
      )
      .from(
        headline,
        { autoAlpha: 0, y: 22, duration: 0.9, immediateRender: false },
        "-=0.55",
      )
      .from(
        lede,
        { autoAlpha: 0, y: 16, duration: 0.8, immediateRender: false },
        "-=0.5",
      )
      .from(
        cta,
        { autoAlpha: 0, y: 12, duration: 0.7, immediateRender: false },
        "-=0.45",
      );

    if (isDesktop && heroImg) {
      gsap.to(heroImg, {
        yPercent: 4,
        ease: "none",
        scrollTrigger: {
          trigger: ".home-hero",
          start: "top top",
          end: "bottom top",
          scrub: 1.2,
        },
      });
    }

    if (cards.length) {
      gsap.from(cards, {
        autoAlpha: 0,
        y: 36,
        duration: 0.9,
        stagger: 0.12,
        immediateRender: false,
        scrollTrigger: {
          trigger: ".post-list",
          start: "top 88%",
          once: true,
          toggleActions: "play none none none",
        },
      });
    }

    if (isDesktop && cardImgs.length) {
      cardImgs.forEach((img) => {
        gsap.fromTo(
          img,
          { scale: 1.06 },
          {
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: img.closest(".post-card"),
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
            },
          },
        );
      });
    }

    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);

    return () => {
      window.removeEventListener("load", onLoad);
    };
  }, root);

  return () => mm.revert();
}
