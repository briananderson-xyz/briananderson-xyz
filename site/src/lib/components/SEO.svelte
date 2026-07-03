<script lang="ts">
    import { dev } from "$app/environment";
    import { page } from "$app/stores";
    // import { PUBLIC_ENV } from "$env/static/public";

    interface Props {
        title: string;
        description: string;
        type?: string;
        image?: string | undefined;
        canonical?: string | undefined;
        keywords?: string[] | undefined;
        tags?: string[] | undefined;
    }

    let {
        title,
        description,
        type = "website",
        image = undefined,
        canonical = undefined,
        keywords = undefined,
        tags = undefined
    }: Props = $props();

    const finalTitle = $derived(dev ? `[dev] ${title}` : title);

    // Default canonical to current URL if not provided, but remove query params for clean canonical
    const finalCanonical = $derived(
        canonical || ($page.url ? `${$page.url.origin}${$page.url.pathname}` : undefined)
    );

    // Construct absolute image URL if provided; fall back to the default
    // social image (headshot) so every page emits og:image / twitter:image.
    const defaultImage = "/headshot.jpg";
    const finalImage = $derived(
        image
            ? image.startsWith("http")
                ? image
                : `${$page.url.origin}${image}`
            : `${$page.url.origin}${defaultImage}`
    );

    // Combine tags and keywords for meta keywords
    const metaKeywords = $derived([...(tags || []), ...(keywords || [])].join(", "));
</script>

<svelte:head>
    <title>{finalTitle}</title>
    <meta name="description" content={description} />
    {#if metaKeywords}
        <meta name="keywords" content={metaKeywords} />
    {/if}

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content={type} />
    <meta property="og:url" content={finalCanonical} />
    <meta property="og:title" content={finalTitle} />
    <meta property="og:description" content={description} />
    {#if finalImage}
        <meta property="og:image" content={finalImage} />
    {/if}
    {#if tags && tags.length > 0}
        {#each tags as tag}
            <meta property="article:tag" content={tag} />
        {/each}
    {/if}

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content={finalCanonical} />
    <meta property="twitter:title" content={finalTitle} />
    <meta property="twitter:description" content={description} />
    {#if finalImage}
        <meta property="twitter:image" content={finalImage} />
    {/if}

    {#if finalCanonical}
        <link rel="canonical" href={finalCanonical} />
    {/if}
</svelte:head>
