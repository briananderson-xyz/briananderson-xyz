<script lang="ts">
  import ResumeViewSwiper from "$lib/components/ResumeViewSwiper.svelte";

  export let data: {
    resume: any;
    variants: string[];
    allResumes: { variant: string; resume: any }[];
    currentIndex: number;
  };

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
  <link rel="canonical" href="/resume/">
  {@html `<script type="application/ld+json">${JSON.stringify(jsonLd, null, 2)}</script>`}
</svelte:head>

<ResumeViewSwiper resumes={data.allResumes} currentIndex={data.currentIndex} />
