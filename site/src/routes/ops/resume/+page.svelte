<script lang="ts">
  import { getCanonicalUrl } from '$lib/utils/variantLink';
  import ResumeContent from '$lib/components/ResumeContent.svelte';
  import { page } from '$app/stores';

  export let data;
  const resume = data.resume;

  const formatSkillsAsDefinedTerms = (skills: Record<string, any[]>) => {
    const definedTerms: any[] = [];
    for (const [category, items] of Object.entries(skills)) {
      for (const skill of items) {
        definedTerms.push({
          "@type": "DefinedTerm",
          "name": typeof skill === "string" ? skill : (skill.altName || skill.name),
          "url": typeof skill === "object" && skill.url ? skill.url : undefined,
          "inDefinedTermSet": category
        });
      }
    }
    return definedTerms;
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": resume.name,
    "email": resume.email,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": resume.location.split(", ")[0],
      "addressRegion": resume.location.split(", ")[1]
    },
    "description": resume.summary,
    "url": "https://briananderson.xyz",
    "sameAs": [
      "https://github.com/briananderson1222",
      "https://www.linkedin.com/in/brian--anderson/"
    ],
    "alumniOf": resume.education.map((edu: any) => ({
      "@type": "CollegeOrUniversity",
      "name": edu.school,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": edu.location.split(", ")[0] || edu.location
      }
    })),
    "hasCredential": resume.certificates.map((cert: any) => ({
      "@type": "EducationalOccupationalCredential",
      "name": cert.name,
      "url": cert.url,
      "credentialCategory": "certification"
    })),
    "hasOccupation": resume.experience.map((job: any) => ({
      "@type": "Occupation",
      "name": job.role,
      "startDate": job.start_date,
      "endDate": job.end_date,
      "hiringOrganization": {
        "@type": "Organization",
        "name": job.company
      },
      "description": job.description
    })),
    "knowsAbout": formatSkillsAsDefinedTerms(resume.skills)
  };
</script>

<svelte:head>
  <link rel="canonical" href={getCanonicalUrl('/ops/resume/')} />
  {@html `<script type="application/ld+json">${JSON.stringify(jsonLd, null, 2)}</script>`}
</svelte:head>

<div class="max-w-6xl mx-auto mb-8 print:hidden">
  <div class="flex gap-4">
    <button
      class="px-4 py-2 bg-skin-accent text-skin-accent-contrast text-sm font-bold uppercase tracking-wider hover:opacity-90 transition-opacity rounded-md"
      on:click={() => window.print()}
    >
      Print / Save as PDF
    </button>
    <a
      href="/ops/resume.json"
      download="brian-anderson-resume-ops.json"
      class="inline-flex items-center justify-center font-mono text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-skin-accent/50 disabled:opacity-50 disabled:pointer-events-none uppercase tracking-wider px-5 py-2.5 border border-skin-accent text-skin-accent hover:bg-skin-accent hover:text-skin-accent-contrast"
    >
      Download JSON Resume
    </a>
  </div>
</div>

<ResumeContent {resume} variant={$page.url.searchParams.get('v')} />
