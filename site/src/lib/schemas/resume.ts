import { z } from 'zod';

export const ResumeSchema = z.object({
    name: z.string(),
    title: z.string().optional(),
    jobTitles: z.array(z.string()),
    tagline: z.string().optional(),
    mission: z.string().optional(),
    email: z.string().email().optional(),
    location: z.string().optional(),
    summary: z.string().optional(),

    meta: z.object({
        order: z.number().int().optional(),
        schema_version: z.string().optional(),
    }).optional(),

    skills: z.record(
        z.string(), // Category name (e.g., "Cloud & Orchestration")
        z.array(
            z.union([
                z.string(),
                z.object({
                    name: z.string(),
                    url: z.string().url().optional(),
                })
            ])
        ).optional()
    ).optional(),

    experience: z.array(
        z.object({
            role: z.string(),
            company: z.string(),
            location: z.string().optional(),
            description: z.string().optional(),
            highlights: z.array(z.string()).optional(),
            start_date: z.string().optional(),
            end_date: z.string().optional(),
        })
    ).optional(),

    'early-career': z.array(
        z.object({
            role: z.string(),
            company: z.string(),
            location: z.string().optional(),
            start_date: z.string().optional(),
            end_date: z.string().optional(),
        })
    ).optional(),

    education: z.array(
        z.object({
            school: z.string(),
            degree: z.string(),
            location: z.string().optional(),
            start_date: z.string().optional(),
            end_date: z.string().optional(),
        })
    ).optional(),

    certificates: z.array(
        z.object({
            name: z.string(),
            url: z.string().url().optional(),
            start_date: z.string().optional(),
            end_date: z.string().optional(),
        })
    ).optional(),
});

export type Resume = z.infer<typeof ResumeSchema>;
