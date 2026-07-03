<script lang="ts">
  import { page } from "$app/state";
  import SEO from "$lib/components/SEO.svelte";
  import ImageGallery from "$lib/components/ImageGallery.svelte";
  import VisualArchive from "$lib/components/VisualArchive.svelte";
  import ProjectLinks from "$lib/components/ProjectLinks.svelte";
  import { reveal } from "$lib/actions/reveal";
  import type { ContentMetadata } from "$lib/utils/content-loader";

  interface Props {
    data: { html: string | null; metadata: ContentMetadata };
  }

  let { data }: Props = $props();

  const siteUrl = "https://briananderson.xyz";

  // CreativeWork + BreadcrumbList JSON-LD, sourced from content frontmatter
  // (data.metadata) via the existing projects loader. Built as a `<script>`
  // string (not a Svelte block) to avoid ESLint/Svelte parser confusion,
  // matching the pattern in Homepage.svelte / ResumePage.svelte.
  let jsonLdTag = $derived.by(() => {
    if (!data?.html || !data?.metadata) return "";

    const canonicalUrl = `${siteUrl}/projects/${page.params.slug}/`;
    const keywordsList = [
      ...(data.metadata.tags || []),
      ...(data.metadata.keywords || [])
    ];

    const creativeWorkJsonLd = {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: data.metadata.title,
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
        { "@type": "ListItem", position: 2, name: "Projects", item: `${siteUrl}/projects/` },
        { "@type": "ListItem", position: 3, name: data.metadata.title, item: canonicalUrl }
      ]
    };

    return `<${"script"} type="application/ld+json">${JSON.stringify([creativeWorkJsonLd, breadcrumbJsonLd], null, 2)}</${"script"}>`;
  });
</script>

<svelte:head>
  {@html jsonLdTag}
</svelte:head>

{#if data?.html}
  <SEO
    title="{data.metadata.title} | Projects"
    description={data.metadata.summary || data.metadata.title}
    tags={data.metadata.tags}
    keywords={data.metadata.keywords}
    image={data.metadata.featuredImage}
  />

  <article class="mx-auto max-w-4xl px-4">
    <header class="mb-8 pb-6 border-b border-skin-border">
      <h1
        class="text-3xl md:text-4xl font-bold font-mono tracking-tight text-skin-base"
        style:view-transition-name={"pt-" + page.params.slug}
      >
        {data.metadata.title}
      </h1>
      <p class="mt-2 font-mono text-sm text-skin-muted">
        {data.metadata.period ?? new Date(data.metadata.date).getFullYear()}
      </p>
      {#if data.metadata.summary}
        <p class="mt-3 text-skin-muted leading-relaxed max-w-2xl">
          {data.metadata.summary}
        </p>
      {/if}
    </header>

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

    {#if data.metadata.visualArchive?.images?.length}
      <!-- Not wrapped in use:reveal: VisualArchive renders a position:fixed
           image lightbox, and a transforming/will-change ancestor would become
           its containing block and offset the overlay. -->
      <VisualArchive images={data.metadata.visualArchive.images} />
    {/if}
  </article>
{:else}
  <div class="max-w-3xl mx-auto px-4 py-16 font-mono text-skin-muted">
    Error 404: Project not found.
  </div>
{/if}
