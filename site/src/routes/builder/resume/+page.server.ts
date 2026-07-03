import { loadResume } from '$lib/server/loadResume';

export const prerender = true;

export const load = async () => {
  return { resume: loadResume('resume-builder.yaml') };
};
