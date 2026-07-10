import adapter from "@sveltejs/adapter-static";
import { mdsvex } from "mdsvex";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { fileURLToPath } from "node:url";
import { dirname, resolve as pathResolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const postLayoutAbsPath = pathResolve(__dirname, "src/lib/layouts/PostLayout.svelte");

const mdsvexConfig = {
  extensions: [".md", ".svx"],
  // Use absolute path so mdsvex (fs) and Vite (import) can both resolve it
  layout: { _: postLayoutAbsPath }
};

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: [".svelte", ".md", ".svx"],
  preprocess: [vitePreprocess(), mdsvex(mdsvexConfig)],
  kit: {
    adapter: adapter({ pages: "build", assets: "build", strict: false, trailingSlash: "always" }),
    paths: {
      relative: false // Required for PostHog session replay to work correctly
    },
    // SvelteKit otherwise defaults to Date.now(), changing every client chunk hash per build.
    version: {
      name: process.env.GITHUB_SHA ?? process.env.SOURCE_DATE_EPOCH ?? "local"
    },
    // Crawl all pages, but ignore 404s for the Decap CMS admin which is served from static/admin/
    prerender: {
      entries: ["*"],
      handleMissingId: "warn",
      origin: "https://briananderson.xyz"
    },
    alias: {
      $lib: "src/lib"
    }
  }
};
export default config;
