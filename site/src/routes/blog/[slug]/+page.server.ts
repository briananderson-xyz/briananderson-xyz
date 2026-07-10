import { render } from "svelte/server";
import type { Component } from "svelte";
import type { ContentMetadata } from "$lib/types";
import { parseContentMetadata } from "$lib/schemas/content";

export const prerender = true;

export const load = async ({ params }) => {
  // Use relative path to ensure correct resolution
  const modules = import.meta.glob("../../../../content/blog/**/*.md");
  const match = Object.keys(modules).find((p) => p.endsWith(`/${params.slug}.md`));

  if (!match) {
    return { html: null, metadata: null };
  }

  const mod = (await modules[match]()) as { default: Component; metadata: ContentMetadata };
  const metadata = parseContentMetadata(mod.metadata, match);
  const { html } = render(mod.default, { props: { metadata } });

  return { html, metadata };
};
