import type { Resume } from '$lib/types';
import { loadResume as loadResumeVariant } from './loadResume';

/** Load and validate the default resume variant. */
export function loadResume(): Resume {
	return loadResumeVariant('resume.yaml');
}

export function buildResumeMarkdown(resume: Resume): string {
	const jobTitle = resume.jobTitles.join(' & ');

	const experience = resume.experience
		.map((job) => {
			const highlights = job.highlights
				.map((h) => {
					const text = typeof h === 'string' ? h : h.text;
					const link = typeof h === 'string' ? undefined : h.link;
					return `- ${text}${link ? ` (${link})` : ''}`;
				})
				.join('\n');
			return `### ${job.role} — ${job.company}
*${job.start_date} – ${job.end_date ?? 'Present'}* | ${job.location}

${job.description ?? ''}

${highlights}`;
		})
		.join('\n\n');

	const earlyCareerEntries = resume['early-career'] ?? [];
	const earlyCareer = earlyCareerEntries
		.map(
			(career) =>
				`### ${career.role} — ${career.company}
*${career.start_date} – ${career.end_date ?? 'Present'}* | ${career.location}`
		)
		.join('\n\n');

	const skills = Object.entries(resume.skills)
		.map(([category, items]) => `**${category}:** ${items.map((s) => s.name).join(', ')}`)
		.join('\n');

	const education = resume.education
		.map(
			(edu) =>
				`- **${edu.school}** — ${edu.degree} (${edu.start_date} – ${edu.end_date ?? 'Present'}), ${edu.location}`
		)
		.join('\n');

	const certificates = resume.certificates
		.map(
			(cert) =>
				`- ${cert.name} (${cert.start_date}${cert.end_date ? ` – ${cert.end_date}` : ''})${cert.url ? ` — ${cert.url}` : ''}`
		)
		.join('\n');

	const contactParts = [resume.location, resume.email].filter(
		(part): part is string => Boolean(part)
	);
	const contactLine = contactParts.length > 0 ? `\n\n${contactParts.join(' | ')}` : '';

	const header = `# ${resume.name}

**${jobTitle}**

> ${resume.tagline}${contactLine}`;

	const summarySection = `## Summary

${resume.summary}`;

	const missionSection = resume.mission
		? `## Mission

${resume.mission}`
		: null;

	const experienceSection = `## Experience

${experience}`;

	const earlyCareerSection = earlyCareerEntries.length > 0
		? `## Early Career

${earlyCareer}`
		: null;

	const skillsSection = `## Skills

${skills}`;

	const educationSection = `## Education

${education}`;

	const certificatesSection = `## Certificates

${certificates}`;

	const sections = [
		header,
		summarySection,
		missionSection,
		experienceSection,
		earlyCareerSection,
		skillsSection,
		educationSection,
		certificatesSection
	].filter((section): section is string => Boolean(section));

	return `${sections.join('\n\n')}\n`;
}
