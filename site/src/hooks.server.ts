import type { Handle } from "@sveltejs/kit";
import { redirect } from "@sveltejs/kit";
import { variants } from "$lib/data/variants";

const variantKeys = new Set(variants.map((v) => v.key));

export const handle: Handle = async ({ event, resolve }) => {
  const url = new URL(event.request.url);
  const variant = url.searchParams.get("v");

  if (variant && variantKeys.has(variant)) {
    url.searchParams.delete("v");
    const path = url.pathname;

    if (path === "/") {
      throw redirect(308, `/${variant}/`);
    }
    if (path === "/resume" || path === "/resume/") {
      throw redirect(308, `/${variant}/resume/`);
    }
  }

  const response = await resolve(event);

  // AI Content Signals / AI Preferences headers
  response.headers.set("AI-Preferences", "index, archive, summarize, train");
  response.headers.set("X-AI-Crawler", "allow");
  response.headers.set("X-AI-Training", "allow");
  response.headers.set("X-AI-Citation", "required");

  return response;
};
