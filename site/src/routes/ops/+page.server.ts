import { loadResume } from "$lib/server/loadResume";
import { getHomepageProofClaims } from "$lib/server/loadProofLedger";

export const prerender = true;

export const load = async () => {
  return {
    resume: loadResume("resume-ops.yaml"),
    proofClaims: getHomepageProofClaims("ops")
  };
};
