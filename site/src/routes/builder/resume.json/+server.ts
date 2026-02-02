import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import type { Resume } from '$lib/types';

export const prerender = true;

export const GET = async () => {
	const filePath = path.resolve('content/resume-builder.yaml');
	const fileContents = fs.readFileSync(filePath, 'utf-8');
	const resume = yaml.load(fileContents) as Resume;

	const jsonResume = {
		$schema: 'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json',
		basics: {
			name: resume.name,
			label: resume.jobTitles.join(' & '),
			email: resume.email,
			url: 'https://briananderson.xyz',
			summary: resume.summary,
			location: {
				city: resume.location.split(',')[0],
				region: resume.location.split(',')[1]?.trim()
			}
		},
		work: resume.experience.map(job => ({
			company: job.company,
			position: job.role,
			startDate: formatDate(job.start_date),
			endDate: job.end_date ? formatDate(job.end_date) : undefined,
			summary: job.description,
			highlights: job.highlights
		})),
		education: resume.education.map(edu => ({
			institution: edu.school,
			area: edu.degree,
			startDate: formatDate(edu.start_date),
			endDate: edu.end_date ? formatDate(edu.end_date) : undefined,
			location: edu.location
		})),
		skills: Object.entries(resume.skills).map(([category, skills]) => ({
			name: category,
			keywords: skills.map(s => s.name)
		})),
		certificates: resume.certificates.map(cert => ({
			name: cert.name,
			date: formatDate(cert.start_date),
			url: cert.url
		})),
		meta: {
			canonical: 'https://briananderson.xyz/builder/resume.json',
			version: '1.0.0',
			lastModified: new Date().toISOString(),
			tagline: resume.tagline,
			mission: resume.mission,
			earlyCareer: resume['early-career']
		}
	};

	return new Response(JSON.stringify(jsonResume, null, 2), {
		headers: {
			'Content-Type': 'application/json; charset=utf-8'
		}
	});
};

function formatDate(dateStr: string): string {
	const date = new Date(dateStr);
	return date.toISOString().split('T')[0];
}
