import { describe, expect, it } from "vitest";
import { ContentMetadataSchema, isExactAuthoredDateLiteral, parseContentMetadata } from "./content";

const valid = {
  title: "A useful case study",
  date: "2026-07-01",
  updated: "2026-07-09",
  summary: "What changed and why it matters.",
  tags: ["TypeScript"],
  keywords: ["content-validation"],
  featuredImage: "/projects/example.png",
  featuredImageAlt: "The example project dashboard"
};

describe("ContentMetadataSchema", () => {
  it("accepts complete metadata and normalizes YAML dates", () => {
    const result = ContentMetadataSchema.parse({
      ...valid,
      date: new Date("2026-07-01T00:00:00Z")
    });
    expect(result.date).toBe("2026-07-01");
  });

  it("normalizes the serialized dates exposed by mdsvex modules", () => {
    const result = ContentMetadataSchema.parse({
      ...valid,
      date: "2026-07-01T00:00:00.000Z"
    });
    expect(result.date).toBe("2026-07-01");
  });

  it("accepts and normalizes leap-day Date objects", () => {
    const result = ContentMetadataSchema.parse({
      ...valid,
      date: new Date("2024-02-29T12:30:00.000Z"),
      updated: undefined
    });
    expect(result.date).toBe("2024-02-29");
  });

  it.each([
    "July 9, 2026",
    "2026/07/09",
    "2026-7-9",
    " 2026-07-09",
    "2026-07-09 ",
    "2026-07-09T00:00:00Z",
    "2026-07-09T00:00:00.000+00:00",
    "2026-07-09T06:00:00.000Z",
    "2026-07-09T00:00:00.000-06:00",
    "2023-02-29",
    "2024-02-30"
  ])("rejects unsupported or invalid date form %s", (date) => {
    expect(ContentMetadataSchema.safeParse({ ...valid, date, updated: undefined }).success).toBe(
      false
    );
  });

  it("accepts a real leap day in exact author and mdsvex forms", () => {
    expect(
      ContentMetadataSchema.parse({ ...valid, date: "2024-02-29", updated: undefined }).date
    ).toBe("2024-02-29");
    expect(
      ContentMetadataSchema.parse({
        ...valid,
        date: "2024-02-29T00:00:00.000Z",
        updated: undefined
      }).date
    ).toBe("2024-02-29");
  });

  it("recognizes only exact raw YAML date literals before parser coercion", () => {
    expect(isExactAuthoredDateLiteral("2026-07-09")).toBe(true);
    expect(isExactAuthoredDateLiteral('"2026-07-09"')).toBe(true);
    expect(isExactAuthoredDateLiteral("2026-07-09 # reviewed")).toBe(true);
    expect(isExactAuthoredDateLiteral("2026-07-09T00:00:00.000Z")).toBe(false);
    expect(isExactAuthoredDateLiteral("2026-07-09T00:00:00.000-06:00")).toBe(false);
    expect(isExactAuthoredDateLiteral('" 2026-07-09 "')).toBe(false);
  });

  it.each([
    ["blank title", { ...valid, title: "  " }],
    ["missing tags", { ...valid, tags: [] }],
    ["bad date", { ...valid, date: "2026-02-30" }],
    ["bad link", { ...valid, links: [{ label: "bad", url: "javascript:alert(1)" }] }],
    ["missing image alt", { ...valid, featuredImageAlt: undefined }]
  ])("rejects %s", (_name, value) => {
    expect(ContentMetadataSchema.safeParse(value).success).toBe(false);
  });

  it("reports the source file and field", () => {
    expect(() =>
      parseContentMetadata({ ...valid, summary: "" }, "content/blog/example.md")
    ).toThrow(/content\/blog\/example\.md:summary/);
  });
});
