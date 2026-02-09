<script lang="ts">
    import ResumeContent from "$lib/components/ResumeContent.svelte";
    import SEO from "$lib/components/SEO.svelte";
    import type { Resume, SkillItem } from "$lib/types";

    export let resume: Resume;
    export let variant: string | null = null;
    export let title: string;
    export let description: string;
    export let canonical: string;

    const formatSkillsAsDefinedTerms = (skills: Record<string, SkillItem[]>) => {
        const definedTerms: { "@type": string; name: string; url?: string; inDefinedTermSet: string }[] = [];
        for (const [category, items] of Object.entries(skills)) {
            for (const skill of items) {
                definedTerms.push({
                    "@type": "DefinedTerm",
                    name: skill.altName || skill.name,
                    url: skill.url,
                    inDefinedTermSet: category,
                });
            }
        }
        return definedTerms;
    };

    $: jsonLd = {
        "@context": "https://schema.org",
        "@type": "Person",
        name: resume.name,
        email: resume.email,
        address: {
            "@type": "PostalAddress",
            addressLocality: resume.location.split(", ")[0],
            addressRegion: resume.location.split(", ")[1],
        },
        description: resume.summary,
        url: "https://briananderson.xyz",
        sameAs: [
            "https://github.com/briananderson1222",
            "https://www.linkedin.com/in/brian--anderson/",
        ],
        alumniOf: resume.education.map((edu) => ({
            "@type": "CollegeOrUniversity",
            name: edu.school,
            address: {
                "@type": "PostalAddress",
                addressLocality: edu.location.split(", ")[0] || edu.location,
            },
        })),
        hasCredential: resume.certificates.map((cert) => ({
            "@type": "EducationalOccupationalCredential",
            name: cert.name,
            url: cert.url,
            credentialCategory: "certification",
        })),
        hasOccupation: resume.experience.map((job) => ({
            "@type": "Occupation",
            name: job.role,
            startDate: job.start_date,
            endDate: job.end_date,
            hiringOrganization: {
                "@type": "Organization",
                name: job.company,
            },
            description: job.description,
        })),
        knowsAbout: formatSkillsAsDefinedTerms(resume.skills),
    };

    // Build JSON-LD tag to avoid ESLint parser confusion with <script> in templates
    $: jsonLdTag = `<${"script"} type="application/ld+json">${JSON.stringify(jsonLd, null, 2)}</${"script"}>`;
</script>

<SEO {title} {description} {canonical} />

<svelte:head>
    {@html jsonLdTag}
</svelte:head>

<div class="max-w-6xl mx-auto mb-8 print:hidden">
    <div class="flex justify-end">
        <button
            class="px-4 py-2 bg-skin-accent text-skin-accent-contrast text-sm font-bold uppercase tracking-wider hover:opacity-90 transition-opacity rounded-md"
            on:click={() => window.print()}
        >
            Print / Save as PDF
        </button>
    </div>
</div>

<ResumeContent {resume} {variant} />
