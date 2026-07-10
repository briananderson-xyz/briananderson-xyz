import type { Handle } from "@sveltejs/kit";
import { redirect } from "@sveltejs/kit";
import { variants } from "$lib/data/variants";
import { securityHeaders } from "$lib/security-policy";

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

  // This protects dev/preview and dynamic responses. Production is static on
  // GCS, so the checked Cloudflare policy generated from the same source must
  // be activated at the edge before these headers are considered live.
  for (const [name, value] of Object.entries(securityHeaders)) {
    response.headers.set(name, value);
  }

  return response;
};
