import { z } from "zod";

const nonEmpty = z.string().trim().min(1);
const internalOrAbsoluteUrl = nonEmpty.refine((value) => {
  if (value.startsWith("/") || value.startsWith("#")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" || url.protocol === "mailto:";
  } catch {
    return false;
  }
}, "must be an absolute HTTP(S)/mailto URL or a root-relative/fragment URL");

// Single source of truth for the resume shape. Types are inferred from these
// schemas (see the `z.infer` exports below) and re-exported through
// `$lib/types`, and the server loader validates every YAML variant against
// `ResumeSchema` at load time. There is deliberately no hand-written duplicate.

export const ResumeHighlightSchema = z.object({
  text: nonEmpty,
  link: internalOrAbsoluteUrl.optional()
});

export const SkillItemSchema = z.object({
  id: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be a stable kebab-case id")
    .optional(),
  name: nonEmpty,
  url: z.string().url().optional(),
  altName: nonEmpty.optional(),
  aliases: z.array(nonEmpty).optional(),
  resume: z.boolean().optional()
});

export const ResumeJobSchema = z.object({
  role: nonEmpty,
  company: nonEmpty,
  location: nonEmpty,
  description: nonEmpty.optional(),
  highlights: z.array(z.union([nonEmpty, ResumeHighlightSchema])).min(1),
  start_date: nonEmpty,
  end_date: nonEmpty.optional()
});

export const ResumeEducationSchema = z.object({
  school: nonEmpty,
  degree: nonEmpty,
  location: nonEmpty,
  start_date: nonEmpty,
  end_date: nonEmpty.optional()
});

export const ResumeCertificateSchema = z.object({
  name: nonEmpty,
  url: z.string().url().optional(),
  start_date: nonEmpty,
  end_date: nonEmpty.optional()
});

export const ResumeEarlyCareerSchema = z.object({
  role: nonEmpty,
  company: nonEmpty,
  location: nonEmpty,
  start_date: nonEmpty,
  end_date: nonEmpty.optional()
});

export const ResumeSchema = z
  .object({
    name: nonEmpty,
    title: nonEmpty.optional(),
    jobTitles: z.array(nonEmpty).min(1),
    tagline: nonEmpty,
    mission: nonEmpty.optional(),
    email: z.string().trim().email(),
    location: nonEmpty,
    summary: nonEmpty,

    meta: z
      .object({
        order: z.number().int().optional(),
        schema_version: nonEmpty.optional()
      })
      .optional(),

    skills: z
      .record(nonEmpty, z.array(SkillItemSchema).min(1))
      .refine(
        (skills) => Object.keys(skills).length > 0,
        "must include at least one skill category"
      ),
    experience: z.array(ResumeJobSchema).min(1),
    "early-career": z.array(ResumeEarlyCareerSchema).min(1).optional(),
    education: z.array(ResumeEducationSchema).min(1),
    certificates: z.array(ResumeCertificateSchema).min(1)
  })
  .superRefine((resume, ctx) => {
    const ids = new Map<string, string>();
    for (const [category, skills] of Object.entries(resume.skills)) {
      for (const [index, skill] of skills.entries()) {
        if (!skill.id) continue;
        const previous = ids.get(skill.id);
        if (previous) {
          ctx.addIssue({
            code: "custom",
            path: ["skills", category, index, "id"],
            message: `duplicates the stable id used by ${previous}`
          });
        } else {
          ids.set(skill.id, skill.name);
        }
      }
    }
  });

export type ResumeHighlight = z.infer<typeof ResumeHighlightSchema>;
export type SkillItem = z.infer<typeof SkillItemSchema>;
export type ResumeJob = z.infer<typeof ResumeJobSchema>;
export type ResumeEducation = z.infer<typeof ResumeEducationSchema>;
export type ResumeCertificate = z.infer<typeof ResumeCertificateSchema>;
export type ResumeEarlyCareer = z.infer<typeof ResumeEarlyCareerSchema>;
export type Resume = z.infer<typeof ResumeSchema>;
