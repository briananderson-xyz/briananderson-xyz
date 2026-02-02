import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import type { Resume } from '$lib/types';

export const prerender = true;

export const load = async () => {
  try {
    const filePath = path.resolve('content/resume-ops.yaml');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const resume = yaml.load(fileContents) as Resume;
    return { resume };
  } catch (e) {
    console.error('Error loading resume-ops.yaml:', e);
    return { resume: {} as Resume };
  }
};
