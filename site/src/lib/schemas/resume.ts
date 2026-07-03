import { z } from 'zod';

// Single source of truth for the resume shape. Types are inferred from these
// schemas (see the `z.infer` exports below) and re-exported through
// `$lib/types`, and the server loader validates every YAML variant against
// `ResumeSchema` at load time. There is deliberately no hand-written duplicate.

export const ResumeHighlightSchema = z.object({
	text: z.string(),
	link: z.string().optional()
});

export const SkillItemSchema = z.object({
	name: z.string(),
	url: z.string().url().optional(),
	altName: z.string().optional(),
	resume: z.boolean().optional()
});

export const ResumeJobSchema = z.object({
	role: z.string(),
	company: z.string(),
	location: z.string(),
	description: z.string().optional(),
	highlights: z.array(z.union([z.string(), ResumeHighlightSchema])).default([]),
	start_date: z.string(),
	end_date: z.string().optional()
});

export const ResumeEducationSchema = z.object({
	school: z.string(),
	degree: z.string(),
	location: z.string(),
	start_date: z.string(),
	end_date: z.string().optional()
});

export const ResumeCertificateSchema = z.object({
	name: z.string(),
	url: z.string().url().optional(),
	start_date: z.string(),
	end_date: z.string().optional()
});

export const ResumeEarlyCareerSchema = z.object({
	role: z.string(),
	company: z.string(),
	location: z.string(),
	start_date: z.string(),
	end_date: z.string().optional()
});

export const ResumeSchema = z.object({
	name: z.string(),
	title: z.string().optional(),
	jobTitles: z.array(z.string()),
	tagline: z.string(),
	mission: z.string().optional(),
	email: z.string(),
	location: z.string(),
	summary: z.string(),

	meta: z
		.object({
			order: z.number().int().optional(),
			schema_version: z.string().optional()
		})
		.optional(),

	skills: z.record(z.string(), z.array(SkillItemSchema)),
	experience: z.array(ResumeJobSchema),
	'early-career': z.array(ResumeEarlyCareerSchema).optional(),
	education: z.array(ResumeEducationSchema),
	certificates: z.array(ResumeCertificateSchema)
});

export type ResumeHighlight = z.infer<typeof ResumeHighlightSchema>;
export type SkillItem = z.infer<typeof SkillItemSchema>;
export type ResumeJob = z.infer<typeof ResumeJobSchema>;
export type ResumeEducation = z.infer<typeof ResumeEducationSchema>;
export type ResumeCertificate = z.infer<typeof ResumeCertificateSchema>;
export type ResumeEarlyCareer = z.infer<typeof ResumeEarlyCareerSchema>;
export type Resume = z.infer<typeof ResumeSchema>;
