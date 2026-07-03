<script lang="ts">
  import { page } from "$app/state";
  import SEO from "$lib/components/SEO.svelte";
  import ImageGallery from "$lib/components/ImageGallery.svelte";
  import ProjectLinks from "$lib/components/ProjectLinks.svelte";
  import { reveal } from "$lib/actions/reveal";
  import type { ContentMetadata } from "$lib/utils/content-loader";

  interface Props {
    data: { html: string | null; metadata: ContentMetadata };
  }

  let { data }: Props = $props();

  const siteUrl = "https://briananderson.xyz";

  // BlogPosting + BreadcrumbList JSON-LD, sourced from content frontmatter
  // (data.metadata) via the existing blog loader. Built as a `<script>` string
  // (not a Svelte block) to avoid ESLint/Svelte parser confusion, matching the
  // pattern in Homepage.svelte / ResumePage.svelte.
  let jsonLdTag = $derived.by(() => {
    if (!data?.html || !data?.metadata) return "";

    const canonicalUrl = `${siteUrl}/blog/${page.params.slug}/`;
    const keywordsList = [
      ...(data.metadata.tags || []),
      ...(data.metadata.keywords || [])
    ];

    const blogPostingJsonLd = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: data.metadata.title,
      description: data.metadata.summary || data.metadata.title,
      datePublished: data.metadata.date,
      author: {
        "@type": "Person",
        name: "Brian Anderson",
        url: siteUrl
      },
      url: canonicalUrl,
      mainEntityOfPage: canonicalUrl,
      ...(keywordsList.length ? { keywords: keywordsList.join(", ") } : {})
    };

    const breadcrumbJsonLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${siteUrl}/blog/` },
        { "@type": "ListItem", position: 3, name: data.metadata.title, item: canonicalUrl }
      ]
    };

    return `<${"script"} type="application/ld+json">${JSON.stringify([blogPostingJsonLd, breadcrumbJsonLd], null, 2)}</${"script"}>`;
  });
</script>

<svelte:head>
  {@html jsonLdTag}
</svelte:head>

{#if data?.html}
  <SEO
    title="{data.metadata.title} | Blog"
    description={data.metadata.summary || data.metadata.title}
    tags={data.metadata.tags}
    keywords={data.metadata.keywords}
    image={data.metadata.featuredImage}
    type="article"
  />

  <article class="mx-auto max-w-4xl px-4">
    <ImageGallery>
      <div class="prose prose-lg max-w-none prose-headings:font-mono">
        {@html data.html}
      </div>
    </ImageGallery>

    {#if data.metadata.links?.length}
      <div use:reveal>
        <ProjectLinks links={data.metadata.links} />
      </div>
    {/if}
  </article>
{:else}
  <div class="max-w-3xl mx-auto px-4 py-16 font-mono text-skin-muted">
    Error 404: Post not found.
  </div>
{/if}
