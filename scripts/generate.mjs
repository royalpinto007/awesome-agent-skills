#!/usr/bin/env node
// Single source of truth (data/tools.json) -> README catalog + site/index.html.
// Refreshes star counts when GITHUB_TOKEN is set (used by the weekly Action).
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const cfg = JSON.parse(readFileSync(join(ROOT, "config.json"), "utf8"));
const tools = JSON.parse(readFileSync(join(ROOT, "data/tools.json"), "utf8"));
const starsPath = join(ROOT, "data/stars.json");
let stars = existsSync(starsPath) ? JSON.parse(readFileSync(starsPath, "utf8")) : { _updated: null };

const token = process.env.GITHUB_TOKEN;
if (token) {
  for (const t of tools) {
    if (!t.repo) continue;
    try {
      const r = await fetch(`https://api.github.com/repos/${t.repo}`, {
        headers: { Authorization: `Bearer ${token}`, "User-Agent": cfg.name },
      });
      if (r.ok) { const j = await r.json(); stars[t.repo] = j.stargazers_count; }
    } catch { /* keep cached value */ }
  }
  stars._updated = new Date().toISOString().slice(0, 10);
  writeFileSync(starsPath, JSON.stringify(stars, null, 2) + "\n");
  console.log(`refreshed stars @ ${stars._updated}`);
}

const starOf = (t) => (t.repo && stars[t.repo] != null ? stars[t.repo] : null);
const kfmt = (n) => (n == null ? "" : n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : "" + n);
const star = (t) => { const s = starOf(t); return s == null ? "" : ` \`* ${kfmt(s)}\``; };
const CATS = cfg.cats;

let lists = "";
for (const [cat, title] of Object.entries(CATS)) {
  const items = tools.filter((t) => t.category === cat).sort((a, b) => (starOf(b) || 0) - (starOf(a) || 0));
  if (!items.length) continue;
  lists += `\n### ${title}\n\n`;
  for (const t of items) lists += `- [${t.name}](${t.url})${star(t)}: ${t.desc}\n`;
}

const updated = stars._updated ? ` Star counts updated **${stars._updated}**.` : "";
const generated =
  `**${tools.length} entries**, auto-refreshed weekly.${updated} ` +
  `Browse the filterable version at **[${cfg.siteHost}](https://${cfg.siteHost})**.\n${lists}`;

const readmePath = join(ROOT, "README.md");
let readme = readFileSync(readmePath, "utf8");
readme = readme.replace(/<!-- LIST:START -->[\s\S]*<!-- LIST:END -->/, `<!-- LIST:START -->\n${generated}\n<!-- LIST:END -->`);
writeFileSync(readmePath, readme);

const data = tools.map((t) => ({ ...t, stars: starOf(t) }));
const siteDir = join(ROOT, "site");
if (!existsSync(siteDir)) mkdirSync(siteDir, { recursive: true });
let html = readFileSync(join(ROOT, "templates/site.html"), "utf8");
html = html.replaceAll("{{TITLE}}", cfg.title).replaceAll("{{TAGLINE}}", cfg.tagline)
           .replaceAll("{{GH}}", cfg.ghUrl).replaceAll("{{HOST}}", cfg.siteHost)
           .replace("/*CATS*/", JSON.stringify(CATS))
           .replace("/*DATA*/", JSON.stringify(data)).replace("/*UPDATED*/", stars._updated || "");
writeFileSync(join(siteDir, "index.html"), html);
console.log(`generated README + site for ${tools.length} entries`);
