import "./styles/post.css";
import { initPostAnimations } from "./lib/animations/post";
import { initPostSpine } from "./lib/animations/post-spine";

const cleanupAnimations = initPostAnimations(document.body);
const cleanupSpine = initPostSpine(document.body);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cleanupAnimations();
    cleanupSpine();
  });
}
