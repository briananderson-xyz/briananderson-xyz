<script lang="ts">
    import { dev } from "$app/environment";
    import { page } from "$app/stores";
    // import { PUBLIC_ENV } from "$env/static/public";

    export let title: string;
    export let description: string =
        "Brian Anderson - Systems Engineer & Full Stack Developer";
    export let type: string = "website";
    export let image: string | undefined = undefined;
    export let canonical: string | undefined = undefined;

    // $: isDev = dev || PUBLIC_ENV === "dev";
    $: finalTitle = dev ? `[dev] ${title}` : title;

    // Default canonical to current URL if not provided, but remove query params for clean canonical
    $: finalCanonical =
        canonical ||
        ($page.url ? `${$page.url.origin}${$page.url.pathname}` : undefined);

    // Construct absolute image URL if provided
    $: finalImage = image
        ? image.startsWith("http")
            ? image
            : `${$page.url.origin}${image}`
        : undefined;
</script>

<svelte:head>
    <title>{finalTitle}</title>
    <meta name="description" content={description} />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content={type} />
    <meta property="og:url" content={finalCanonical} />
    <meta property="og:title" content={finalTitle} />
    <meta property="og:description" content={description} />
    {#if finalImage}
        <meta property="og:image" content={finalImage} />
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
