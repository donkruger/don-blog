import { defineConfig } from "vite";
import { readdirSync, existsSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

function postInputs(): Record<string, string> {
  const postsDir = resolve(root, "posts");
  const inputs: Record<string, string> = {};

  if (!existsSync(postsDir)) return inputs;

  for (const slug of readdirSync(postsDir)) {
    const html = join(postsDir, slug, "index.html");
    if (existsSync(html)) {
      inputs[`post-${slug}`] = html;
    }
  }

  return inputs;
}

export default defineConfig({
  appType: "mpa",
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, "index.html"),
        notFound: resolve(root, "404.html"),
        ...postInputs(),
      },
    },
  },
});
