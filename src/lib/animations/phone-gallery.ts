/**
 * Progressive enhancement for `.post-phone-gallery` carousels.
 * Core browsing works with CSS scroll-snap alone; this wires prev/next
 * buttons and syncs the dot indicators to the nearest slide.
 */
export function initPhoneGallery(root: HTMLElement = document.body) {
  const galleries = Array.from(
    root.querySelectorAll<HTMLElement>(".post-phone-gallery"),
  );
  if (!galleries.length) return () => {};

  const cleanups = galleries.map((gallery) => enhanceGallery(gallery));
  return () => cleanups.forEach((fn) => fn());
}

function enhanceGallery(gallery: HTMLElement) {
  const scroller = gallery.querySelector<HTMLElement>(
    ".post-phone-gallery__scroller",
  );
  const slides = Array.from(
    gallery.querySelectorAll<HTMLElement>(".post-phone-gallery__slide"),
  );
  const prevBtn = gallery.querySelector<HTMLButtonElement>(
    "[data-phone-gallery-prev]",
  );
  const nextBtn = gallery.querySelector<HTMLButtonElement>(
    "[data-phone-gallery-next]",
  );
  const dotsRoot = gallery.querySelector<HTMLElement>(
    "[data-phone-gallery-dots]",
  );

  if (!scroller || slides.length === 0) return () => {};

  const dots = slides.map((_, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "post-phone-gallery__dot";
    button.setAttribute("aria-label", `Show screen ${index + 1}`);
    button.addEventListener("click", () => scrollToIndex(index));
    dotsRoot?.appendChild(button);
    return button;
  });

  let activeIndex = -1;
  let frame = 0;

  const sync = () => {
    const nextIndex = nearestIndex();
    if (nextIndex === activeIndex) return;
    activeIndex = nextIndex;
    dots.forEach((dot, index) => {
      const isActive = index === activeIndex;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-current", isActive ? "true" : "false");
    });
    if (prevBtn) prevBtn.disabled = activeIndex === 0;
    if (nextBtn) nextBtn.disabled = activeIndex === slides.length - 1;
  };

  const nearestIndex = () => {
    const left = scroller.scrollLeft;
    let best = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    slides.forEach((slide, index) => {
      const dist = Math.abs(slide.offsetLeft - left);
      if (dist < bestDist) {
        bestDist = dist;
        best = index;
      }
    });
    return best;
  };

  const scrollToIndex = (index: number) => {
    const slide = slides[Math.max(0, Math.min(index, slides.length - 1))];
    if (!slide) return;
    scroller.scrollTo({ left: slide.offsetLeft, behavior: "smooth" });
  };

  const onScroll = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(sync);
  };

  const onPrev = () => scrollToIndex(activeIndex - 1);
  const onNext = () => scrollToIndex(activeIndex + 1);

  scroller.addEventListener("scroll", onScroll, { passive: true });
  prevBtn?.addEventListener("click", onPrev);
  nextBtn?.addEventListener("click", onNext);

  sync();

  return () => {
    cancelAnimationFrame(frame);
    scroller.removeEventListener("scroll", onScroll);
    prevBtn?.removeEventListener("click", onPrev);
    nextBtn?.removeEventListener("click", onNext);
    dots.forEach((dot) => dot.remove());
  };
}
