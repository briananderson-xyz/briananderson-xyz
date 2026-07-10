import { loadProofLedger } from "$lib/server/loadProofLedger";

export const prerender = true;

export const load = () => ({
  claims: loadProofLedger()
});
