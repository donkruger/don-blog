import { mkdirSync, readdirSync, readFileSync, writeFileSync, cpSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { marked } from "marked";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const contentDir = join(root, "content/posts");
const postsOutDir = join(root, "posts");
const generatedDir = join(root, "src/generated");
const postTemplatePath = join(root, "src/templates/post.html");
const homeTemplatePath = join(root, "src/templates/home.html");
const indexPath = join(root, "index.html");
const siteUrl = "https://don-kruger-blog.netlify.app";

marked.setOptions({ gfm: true, breaks: false });

/**
 * @typedef {{
 *   title: string;
 *   slug: string;
 *   date: string;
 *   description: string;
 *   thumbnail: string;
 *   ogImage?: string;
 *   tags?: string[];
 * }} PostMeta
 */

function formatDate(iso) {
  const normalized =
    iso instanceof Date
      ? iso.toISOString().slice(0, 10)
      : String(iso).slice(0, 10);
  const d = new Date(`${normalized}T12:00:00`);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function loadPosts() {
  if (!existsSync(contentDir)) return [];

  /** @type {Array<PostMeta & { html: string; body: string }>} */
  const posts = [];

  for (const file of readdirSync(contentDir)) {
    if (!file.endsWith(".md")) continue;
    const raw = readFileSync(join(contentDir, file), "utf8");
    const { data, content } = matter(raw);
    const slug = data.slug || file.replace(/\.md$/, "");
    const parsed = marked.parse(content);
    const html = typeof parsed === "string" ? parsed : String(parsed);

    posts.push({
      title: String(data.title ?? slug),
      slug: String(slug),
      date:
        data.date instanceof Date
          ? data.date.toISOString().slice(0, 10)
          : String(data.date ?? ""),
      description: String(data.description ?? ""),
      thumbnail: String(data.thumbnail ?? ""),
      ogImage: data.ogImage ? String(data.ogImage) : undefined,
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      html,
      body: content,
    });
  }

  posts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return posts;
}

function absoluteUrl(pathOrUrl) {
  if (!pathOrUrl) return `${siteUrl}/images/og/default.jpg`;
  if (pathOrUrl.startsWith("http")) return pathOrUrl;
  return `${siteUrl}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

function renderPost(template, post) {
  const ogUrl = `${siteUrl}/posts/${post.slug}/`;
  // Cache-bust OG image so WhatsApp/Facebook rescrape picks up fresh previews.
  const ogImage = `${absoluteUrl(post.ogImage || post.thumbnail)}?v=3`;
  const ogDate = post.date ? `${post.date}T12:00:00+02:00` : "";
  const ogModified = new Date().toISOString();

  return template
    .replaceAll("<!-- TITLE -->", escapeHtml(post.title))
    .replaceAll("<!-- DESCRIPTION -->", escapeHtml(post.description))
    .replaceAll("<!-- THUMBNAIL -->", escapeAttr(post.thumbnail))
    .replaceAll("<!-- DATE -->", escapeHtml(formatDate(post.date)))
    .replaceAll("<!-- CONTENT -->", post.html)
    .replaceAll("<!-- OG_IMAGE -->", escapeAttr(ogImage))
    .replaceAll("<!-- OG_URL -->", escapeAttr(ogUrl))
    .replaceAll("<!-- OG_DATE -->", escapeAttr(ogDate))
    .replaceAll("<!-- OG_MODIFIED -->", escapeAttr(ogModified));
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

function renderPostCard(post) {
  return `
          <li>
            <a class="post-card" href="/posts/${escapeAttr(post.slug)}/">
              <div class="post-card__media">
                <img src="${escapeAttr(post.thumbnail)}" alt="" loading="lazy" />
              </div>
              <div class="post-card__body">
                <p class="post-card__meta">${escapeHtml(formatDate(post.date))}</p>
                <h3 class="post-card__title">${escapeHtml(post.title)}</h3>
                <p class="post-card__excerpt">${escapeHtml(post.description)}</p>
              </div>
            </a>
          </li>`.trim();
}

function updateIndex(posts) {
  let indexHtml = readFileSync(homeTemplatePath, "utf8");
  const latest = posts[0];
  const heroImage = latest
    ? `<img src="${escapeAttr(latest.thumbnail)}" alt="" />`
    : "";

  indexHtml = indexHtml.replace(
    /<!-- HERO_IMAGE -->[\s\S]*?(?=<div class="home-hero__veil")/,
    `<!-- HERO_IMAGE -->\n          ${heroImage}\n          `,
  );

  const list = posts.map(renderPostCard).join("\n          ");
  indexHtml = indexHtml.replace(
    /(<ul class="post-list">)[\s\S]*?(<\/ul>)/,
    `$1\n          ${list}\n        $2`,
  );

  writeFileSync(indexPath, indexHtml);
}

function writePosts(posts, template) {
  mkdirSync(postsOutDir, { recursive: true });

  // Clear previous generated post folders that no longer exist
  if (existsSync(postsOutDir)) {
    for (const slug of readdirSync(postsOutDir)) {
      // leave as-is; overwrite per post below
      void slug;
    }
  }

  for (const post of posts) {
    const dir = join(postsOutDir, post.slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), renderPost(template, post));
  }
}

function writeManifest(posts) {
  mkdirSync(generatedDir, { recursive: true });
  const manifest = posts.map(({ title, slug, date, description, thumbnail, tags }) => ({
    title,
    slug,
    date,
    description,
    thumbnail,
    tags,
  }));
  writeFileSync(join(generatedDir, "posts.json"), JSON.stringify(manifest, null, 2));
}

function ensurePublicImage() {
  const destDir = join(root, "public/images/posts");
  const dest = join(destDir, "closing-out-my-20s.png");
  if (existsSync(dest)) return;

  const candidates = [
    join(root, "closing-out-my-20s.png"),
    join(root, "content/source/closing-out-my-20s.png"),
  ];

  for (const src of candidates) {
    if (existsSync(src)) {
      mkdirSync(destDir, { recursive: true });
      cpSync(src, dest);
      return;
    }
  }
}

const posts = loadPosts();
const postTemplate = readFileSync(postTemplatePath, "utf8");

ensurePublicImage();
writePosts(posts, postTemplate);
writeManifest(posts);
updateIndex(posts);

console.log(`Built ${posts.length} post(s): ${posts.map((p) => p.slug).join(", ")}`);
