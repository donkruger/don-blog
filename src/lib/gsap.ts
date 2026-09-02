import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

gsap.defaults({
  duration: 0.85,
  ease: "power2.out",
});

export { gsap, ScrollTrigger };
