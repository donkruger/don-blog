import "./styles/home.css";
import { initHomeAnimations } from "./lib/animations/home";

const cleanup = initHomeAnimations(document.body);

if (import.meta.hot) {
  import.meta.hot.dispose(() => cleanup());
}
