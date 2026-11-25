import "./styles/post.css";
import { initPostAnimations } from "./lib/animations/post";
import { initPostSpine } from "./lib/animations/post-spine";
import { initPhoneGallery } from "./lib/animations/phone-gallery";

const cleanupAnimations = initPostAnimations(document.body);
const cleanupSpine = initPostSpine(document.body);
const cleanupPhoneGallery = initPhoneGallery(document.body);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cleanupAnimations();
    cleanupSpine();
    cleanupPhoneGallery();
  });
}
