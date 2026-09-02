import { gsap } from "../gsap";

/** Shared media-query conditions for responsive / a11y motion. */
export const motionQueries = {
  isDesktop: "(min-width: 800px)",
  isMobile: "(max-width: 799px)",
  reduceMotion: "(prefers-reduced-motion: reduce)",
} as const;

export type MotionContext = {
  conditions?: {
    isDesktop?: boolean;
    isMobile?: boolean;
    reduceMotion?: boolean;
  };
};

export function createMotionMedia() {
  return gsap.matchMedia();
}

/** Instant visible state — used when reduced motion is preferred. */
export function revealImmediately(targets: gsap.DOMTarget) {
  gsap.set(targets, { autoAlpha: 1, y: 0, clearProps: "transform" });
}
