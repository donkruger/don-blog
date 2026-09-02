import "./styles/post.css";
import { initPostAnimations } from "./lib/animations/post";

const cleanup = initPostAnimations(document.body);

if (import.meta.hot) {
  import.meta.hot.dispose(() => cleanup());
}
