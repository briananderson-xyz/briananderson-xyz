import { describe, expect, it } from "vitest";
import type { ContentMetadata } from "$lib/types";
import {
  filterProjects,
  projectSkills,
  projectVariants,
  readProjectQuery,
  writeProjectQuery,
  type ProjectCatalogItem
} from "./projectCatalog";

function project(
  slug: string,
  metadata: Partial<ContentMetadata> & Pick<ContentMetadata, "tags">
): ProjectCatalogItem {
  const complete: ContentMetadata = {
    title: slug,
    date: "2026-01-01",
    summary: `${slug} summary`,
    keywords: [slug],
    ...metadata
  };
  return {
    metadata: complete,
    route: `/projects/${slug}`,
    slug,
    variants: projectVariants(complete),
    skills: projectSkills(complete)
  };
}

describe("project catalog", () => {
  const projects = [
    project("agent-tool", {
      tags: ["Rust", "AgenticAI", "Builder", "OpenSource"],
      outcome: "Developer productivity",
      projectType: "Open-source tool"
    }),
    project("enterprise", {
      tags: ["GCP", "PlatformEngineering", "Leader", "Ops"],
      outcome: "Platform modernization",
      projectType: "Enterprise transformation"
    })
  ];

  it("combines variant, exact skill/topic, outcome, and type filters", () => {
    expect(
      filterProjects(projects, {
        variant: "leader",
        skill: "GCP",
        outcome: "Platform modernization",
        type: "Enterprise transformation"
      }).map(({ slug }) => slug)
    ).toEqual(["enterprise"]);
  });

  it("does not expose classification tags as skills", () => {
    expect(projects[0].skills).toEqual(["Rust", "AgenticAI"]);
    expect(projects[1].variants).toEqual(["leader", "ops"]);
  });

  it("restores filters and caps unique comparison slugs at three", () => {
    const restored = readProjectQuery(
      new URLSearchParams(
        "v=builder&skill=Rust&outcome=Developer+productivity&type=Open-source+tool&compare=a,b,a,c,d"
      )
    );
    expect(restored.filters).toEqual({
      variant: "builder",
      skill: "Rust",
      outcome: "Developer productivity",
      type: "Open-source tool"
    });
    expect(restored.compared).toEqual(["a", "b", "c"]);
  });

  it("writes shareable state without discarding unrelated parameters", () => {
    const result = writeProjectQuery(
      new URL("https://example.test/projects/?ref=home"),
      { variant: "ops", skill: "GCP", outcome: "", type: "" },
      ["one", "two"]
    );
    expect(result.searchParams.get("ref")).toBe("home");
    expect(result.searchParams.get("v")).toBe("ops");
    expect(result.searchParams.get("compare")).toBe("one,two");
  });
});
