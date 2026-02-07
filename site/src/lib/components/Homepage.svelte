<script lang="ts">
  import Button from "$lib/components/ui/button.svelte";
  import { slide } from "svelte/transition";
  import type { Resume } from "$lib/types";
  import ExperienceItem from "$lib/components/ExperienceItem.svelte";
  import { formatJobTitles } from "$lib/utils/formatters";
  import { addVariant } from "$lib/utils/variantLink";

  export let resume: Resume;
  export let variant: string | null = null;
  export let links: Record<string, string> | null = null;

  const currentJob = resume.experience[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": resume.name,
    "description": resume.tagline,
    "url": "https://briananderson.xyz",
    "sameAs": [
      "https://github.com/briananderson1222",
      "https://www.linkedin.com/in/brian--anderson/"
    ],
    "address": {
      "@type": "PostalAddress",
      "addressLocality": resume.location.split(", ")[0],
      "addressRegion": resume.location.split(", ")[1]
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "email": resume.email,
      "contactType": "work"
    },
    "worksFor": {
      "@type": "Organization",
      "name": currentJob.company
    },
    "hasOccupation": {
      "@type": "Occupation",
      "name": currentJob.role,
      "description": currentJob.description
    }
  };

  $: generatedLinks = links || {
    resume: addVariant('/resume/', variant),
    projects: addVariant('/projects/', variant),
    blog: addVariant('/blog/', variant)
  };

  let openCategories: Record<string, boolean> = {};
  let showAllExperience = false;

  function toggleCategory(category: string) {
    openCategories = {
      ...openCategories,
      [category]: !openCategories[category],
    };
  }

  $: formattedTitle = formatJobTitles(resume.jobTitles);

  // Build JSON-LD tag to avoid ESLint parser confusion with <script> in templates
  const jsonLdTag = `<${"script"} type="application/ld+json">${JSON.stringify(jsonLd, null, 2)}</${"script"}>`;
</script>

<svelte:head>
  {@html jsonLdTag}
</svelte:head>

<section id="about" class="py-12 md:py-20 px-4">
  <div class="max-w-4xl mx-auto">
    <article>
      <!-- Terminal Window -->
      <div
        class="bg-terminal-black border border-zinc-700 shadow-2xl overflow-hidden rounded-t-lg"
      >
        <!-- Window Header -->
        <div
          class="bg-zinc-800 px-4 py-2 flex items-center gap-2 border-b border-zinc-700"
        >
          <div class="w-3 h-3 rounded-full bg-red-500"></div>
          <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div class="w-3 h-3 rounded-full bg-green-500"></div>
          <span class="ml-2 text-xs text-zinc-300 font-mono"
            >user@briananderson: ~ (zsh)</span
          >
        </div>

        <!-- Window Content -->
        <div
          class="p-6 md:p-8 font-mono text-sm md:text-base leading-relaxed text-zinc-300 min-h-[300px] flex flex-col md:flex-row gap-8"
        >
          <div class="flex-1">
          <div class="mb-4 text-terminal-green">$ whoami</div>
          <h1 class="text-2xl md:text-3xl font-bold text-white mb-4 block">
            {formattedTitle}
          </h1>
            <p class="mb-6 opacity-80">
              {resume.tagline}
            </p>

            <div class="mb-4 text-terminal-green">$ cat mission.txt</div>
            <p class="mb-6 border-l-2 border-zinc-700 pl-4 italic opacity-80">
              "{resume.mission}"
            </p>

            <div class="mb-4 text-terminal-green">$ list-actions</div>
            <div class="flex flex-wrap gap-4 mt-2">
              <Button
                href={generatedLinks.resume}
                class="bg-terminal-green text-terminal-black border-terminal-green hover:bg-terminal-green/90 shadow-[0_0_10px_rgba(var(--color-terminal-accent),0.3)]"
                >./view_resume.pdf</Button
              >
              <Button
                href={generatedLinks.projects}
                variant="outline"
                class="text-terminal-green border-terminal-green hover:bg-terminal-green hover:text-terminal-black"
                >./view_projects.sh</Button
              >
              <Button
                href={generatedLinks.blog}
                variant="outline"
                class="text-terminal-green border-terminal-green hover:bg-terminal-green hover:text-terminal-black"
                >./read_blog.md</Button
              >
            </div>
          </div>

          <!-- Headshot -->
          <div
            class="flex-shrink-0 flex flex-col items-center justify-start pt-2"
          >
            <div class="relative group w-32 h-32 md:w-48 md:h-48">
              <!-- Decorative Corners -->
              <div
                class="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-terminal-green"
              ></div>
              <div
                class="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-terminal-green"
              ></div>
              <div
                class="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-terminal-green"
              ></div>
              <div
                class="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-terminal-green"
              ></div>

              <!-- Image Container -->
              <div
                class="w-full h-full overflow-hidden border border-zinc-700 bg-zinc-800 grayscale group-hover:grayscale-0 transition-all duration-500"
              >
                <img
                  src="/headshot.jpg"
                  alt="Brian Anderson"
                  class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
                <!-- Scanline Overlay -->
                <div
                  class="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none bg-[length:100%_4px]"
                ></div>
              </div>
            </div>
            <span class="mt-3 text-xs text-skin-muted font-mono"
              >[IMG_ID: B_ANDERSON]</span
            >
          </div>
        </div>
      </div>
    </article>
  </div>
</section>

<!-- System Modules (Skills) -->
<section id="skills" class="py-12 border-t border-dashed border-skin-border">
  <div class="max-w-4xl mx-auto px-4">
    <article>
      <div class="flex items-center gap-2 mb-6 text-skin-accent font-mono">
        <span>></span>
        <h2 class="text-xl font-bold">SYSTEM_MODULES_LOADED</h2>
      </div>

      <div
        class="grid grid-cols-1 md:grid-cols-2 gap-4 items-start font-mono text-sm"
      >
        {#each Object.entries(resume.skills) as [category, items]}
          <div
            class="group bg-skin-page border border-skin-border rounded shadow-sm overflow-hidden"
          >
            <button
              type="button"
              class="w-full cursor-pointer p-3 font-bold text-skin-muted uppercase text-xs tracking-wider hover:text-skin-accent flex justify-between items-center select-none text-left"
              on:click={() => toggleCategory(category)}
            >
              {category}
              <span
                class="text-skin-muted transition-transform {openCategories[
                  category
                ]
                  ? 'rotate-180'
                  : ''}">▼</span
              >
            </button>

            {#if openCategories[category]}
              <div transition:slide|local class="border-t border-skin-border">
                <div class="p-3 grid grid-cols-1 gap-2">
                  {#each items as skill}
                    <div class="flex items-center gap-2 text-skin-muted">
                      <span class="text-skin-accent">[OK]</span>
                      {typeof skill === "string"
                        ? skill
                        : skill.altName || skill.name}
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </article>
  </div>
</section>

<!-- Work History Log -->
<section
  id="experience"
  class="py-12 border-t border-dashed border-skin-border"
>
  <div class="max-w-4xl mx-auto px-4">
    <div class="flex items-center gap-2 mb-6 text-skin-accent font-mono">
      <span>></span>
      <h2 class="text-xl font-bold">WORK_HISTORY_LOG</h2>
    </div>

    <div
      class="space-y-6 font-mono border-l-2 border-skin-border ml-2 pl-6 relative hover:z-10"
    >
      {#each showAllExperience ? resume.experience : resume.experience.slice(0, 3) as job}
        <ExperienceItem {job} />
      {/each}
      <div class="pt-4 space-y-3">
        {#if resume.experience.length > 3}
          <button
            on:click={() => (showAllExperience = !showAllExperience)}
            class="text-sm text-skin-accent hover:underline font-mono"
          >
            {showAllExperience
              ? "Show less"
              : `Show ${resume.experience.length - 3} more`} ->
          </button>
        {/if}
        <a
          href={generatedLinks.resume}
          class="text-sm text-skin-accent hover:underline block font-mono"
          >View full details in resume -></a
        >
      </div>
    </div>
  </div>
</section>

<!-- Contact/Footer Section -->
<section id="contact" class="py-12 border-t border-dashed border-skin-border">
  <div class="max-w-4xl mx-auto px-4">
    <div class="flex items-center gap-2 mb-6 text-skin-accent font-mono">
      <span>></span>
      <h2 class="text-xl font-bold">INITIATE_CONTACT</h2>
    </div>
    <p class="text-skin-base font-mono text-sm">
      To establish connection, please route traffic to:
    </p>
    <a
      href="mailto:brian@briananderson.xyz"
      class="text-skin-accent hover:underline decoration-dashed underline-offset-4 font-mono text-sm"
    >
      brian@briananderson.xyz
    </a>
  </div>
</section>
