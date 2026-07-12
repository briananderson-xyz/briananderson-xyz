import { z } from "zod";

const nonEmpty = z.string().trim().min(1);
const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
const mdsvexSerializedDate = /^(\d{4}-\d{2}-\d{2})T00:00:00\.000Z$/;
const authoredDateLiteral = /^(["']?)(\d{4}-\d{2}-\d{2})\1(?:\s+#.*)?$/;

/**
 * Check the raw YAML scalar before js-yaml turns timestamps and offsets into
 * indistinguishable Date objects. Surrounding YAML spacing is ignored; the
 * scalar itself must be an optionally quoted YYYY-MM-DD value.
 */
export function isExactAuthoredDateLiteral(value: string): boolean {
  return authoredDateLiteral.test(value.trim());
}

function normalizeDate(value: unknown): unknown {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  // mdsvex serializes a YAML date-only value as midnight UTC before exposing
  // module metadata. Accept that one exact representation, not JavaScript's
  // permissive date-string grammar.
  if (typeof value === "string") {
    const match = mdsvexSerializedDate.exec(value);
    if (match) return match[1];
  }
  return value;
}

export const ContentDateSchema = z.preprocess(
  normalizeDate,
  z
    .string()
    .min(1)
    .regex(dateOnly, "must use YYYY-MM-DD")
    .refine((value) => {
      const parsed = new Date(`${value}T00:00:00.000Z`);
      return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
    }, "must be a real calendar date")
);

const ContentUrlSchema = nonEmpty.refine((value) => {
  if (value.startsWith("/") || value.startsWith("#")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" || url.protocol === "mailto:";
  } catch {
    return false;
  }
}, "must be an absolute HTTP(S)/mailto URL or a root-relative/fragment URL");

export const ProjectLinkSchema = z.object({
  label: nonEmpty,
  url: ContentUrlSchema,
  type: z.enum(["case-study", "github", "live", "article", "docs", "website"]).optional()
});

export const VisualArchiveImageSchema = z.object({
  path: ContentUrlSchema,
  alt: nonEmpty,
  caption: nonEmpty.optional()
});

export const ContentMetadataSchema = z
  .object({
    title: nonEmpty,
    date: ContentDateSchema,
    updated: ContentDateSchema.optional(),
    projectDate: ContentDateSchema.optional(),
    eventPeriod: nonEmpty.optional(),
    period: nonEmpty.optional(),
    summary: nonEmpty,
    tags: z.array(nonEmpty).min(1),
    keywords: z.array(nonEmpty).min(1),
    featuredImage: ContentUrlSchema.optional(),
    featuredImageAlt: nonEmpty.optional(),
    featuredImageCaption: nonEmpty.optional(),
    readingTime: nonEmpty.optional(),
    showTableOfContents: z.boolean().optional(),
    visualArchive: z.object({ images: z.array(VisualArchiveImageSchema).min(1) }).optional(),
    links: z.array(ProjectLinkSchema).min(1).optional(),
    // Explicit canonical skill ids are preferred. Exact aliases in tags/keywords
    // remain supported for older content; the index never performs substrings.
    skills: z.array(nonEmpty).min(1).optional(),
    proof: z.array(nonEmpty).min(1).optional(),
    variant: z.enum(["leader", "ops", "builder"]).optional(),
    outcome: nonEmpty.optional(),
    projectType: nonEmpty.optional()
  })
  .superRefine((metadata, ctx) => {
    if (metadata.featuredImage && !metadata.featuredImageAlt) {
      ctx.addIssue({
        code: "custom",
        path: ["featuredImageAlt"],
        message: "is required when featuredImage is set"
      });
    }
    if (metadata.updated && metadata.updated < metadata.date) {
      ctx.addIssue({
        code: "custom",
        path: ["updated"],
        message: "must not be earlier than date"
      });
    }
    if (metadata.projectDate && metadata.eventPeriod) {
      ctx.addIssue({
        code: "custom",
        path: ["eventPeriod"],
        message: "cannot be combined with projectDate; use the most honest available precision"
      });
    }
  });

export type ProjectLink = z.infer<typeof ProjectLinkSchema>;
export type VisualArchiveImage = z.infer<typeof VisualArchiveImageSchema>;
export type ContentMetadata = z.infer<typeof ContentMetadataSchema>;

export function formatZodIssues(error: z.ZodError, file: string): string {
  return error.issues
    .map((issue) => `${file}:${issue.path.join(".") || "frontmatter"}: ${issue.message}`)
    .join("\n");
}

export function parseContentMetadata(value: unknown, file: string): ContentMetadata {
  const result = ContentMetadataSchema.safeParse(value);
  if (!result.success) throw new Error(formatZodIssues(result.error, file));
  return result.data;
}
