import type { ContentMetadata } from "$lib/types";

export const PROJECT_VARIANTS = ["leader", "ops", "builder"] as const;
export const MAX_COMPARED_PROJECTS = 3;

export type ProjectVariant = (typeof PROJECT_VARIANTS)[number];
export type ProjectCatalogItem = {
  metadata: ContentMetadata;
  route: string;
  slug: string;
  variants: ProjectVariant[];
  skills: string[];
};

export type ProjectFilters = {
  variant: string;
  skill: string;
  outcome: string;
  type: string;
};

export const EMPTY_PROJECT_FILTERS: ProjectFilters = {
  variant: "",
  skill: "",
  outcome: "",
  type: ""
};

const classificationTags = new Set([
  ...PROJECT_VARIANTS,
  "sideproject",
  "opensource",
  "consulting"
]);

export function projectVariants(metadata: ContentMetadata): ProjectVariant[] {
  const values = new Set<ProjectVariant>();
  if (metadata.variant) values.add(metadata.variant);
  for (const tag of metadata.tags) {
    const normalized = tag.toLocaleLowerCase("en-US");
    if (PROJECT_VARIANTS.includes(normalized as ProjectVariant)) {
      values.add(normalized as ProjectVariant);
    }
  }
  return [...values];
}

export function projectSkills(metadata: ContentMetadata): string[] {
  return metadata.tags.filter((tag) => !classificationTags.has(tag.toLocaleLowerCase("en-US")));
}

export function filterProjects(
  projects: ProjectCatalogItem[],
  filters: ProjectFilters
): ProjectCatalogItem[] {
  const skill = filters.skill.toLocaleLowerCase("en-US");
  return projects.filter((project) => {
    if (filters.variant && !project.variants.includes(filters.variant as ProjectVariant))
      return false;
    if (skill && !project.skills.some((value) => value.toLocaleLowerCase("en-US") === skill)) {
      return false;
    }
    if (filters.outcome && project.metadata.outcome !== filters.outcome) return false;
    if (filters.type && project.metadata.projectType !== filters.type) return false;
    return true;
  });
}

export function readProjectQuery(searchParams: URLSearchParams): {
  filters: ProjectFilters;
  compared: string[];
} {
  return {
    filters: {
      variant: searchParams.get("v") ?? "",
      skill: searchParams.get("skill") ?? "",
      outcome: searchParams.get("outcome") ?? "",
      type: searchParams.get("type") ?? ""
    },
    compared: (searchParams.get("compare") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .filter((value, index, values) => values.indexOf(value) === index)
      .slice(0, MAX_COMPARED_PROJECTS)
  };
}

export function writeProjectQuery(url: URL, filters: ProjectFilters, compared: string[]): URL {
  const next = new URL(url);
  const values: Array<[string, string]> = [
    ["v", filters.variant],
    ["skill", filters.skill],
    ["outcome", filters.outcome],
    ["type", filters.type]
  ];
  for (const [key, value] of values) {
    if (value) next.searchParams.set(key, value);
    else next.searchParams.delete(key);
  }
  const uniqueCompared = [...new Set(compared)].slice(0, MAX_COMPARED_PROJECTS);
  if (uniqueCompared.length) next.searchParams.set("compare", uniqueCompared.join(","));
  else next.searchParams.delete("compare");
  return next;
}
