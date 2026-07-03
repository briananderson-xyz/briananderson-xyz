import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { ResumeSchema, type Resume } from '$lib/schemas/resume';

/**
 * Read and validate a resume YAML variant from the content directory.
 *
 * Parsing goes through `ResumeSchema`, so a missing file or a variant that does
 * not match the schema throws here and fails the prerender/build. That is
 * deliberate: a broken or half-populated resume should never ship silently as
 * an empty page.
 *
 * @param file - filename within `content/`, e.g. `resume.yaml` or `resume-ops.yaml`
 */
export function loadResume(file: string): Resume {
	const filePath = path.resolve('content', file);
	const raw = fs.readFileSync(filePath, 'utf8');
	return ResumeSchema.parse(yaml.load(raw));
}
