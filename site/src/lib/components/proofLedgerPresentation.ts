import type { ProofClaim } from "$lib/schemas/proofLedger";

export const evidenceStatePresentation = {
  documented: {
    label: "Documented",
    explanation:
      "The quoted statement appears in the linked, author-maintained case study. That is traceability, not independent verification."
  },
  "externally-corroborated": {
    label: "Externally corroborated",
    explanation:
      "The ledger records outside corroboration. Follow the destination and its references to evaluate the underlying evidence."
  },
  "self-reported": {
    label: "Self-reported",
    explanation:
      "The statement is attributed to Brian and is not presented here as independently verified."
  }
} as const satisfies Record<ProofClaim["evidenceState"], { label: string; explanation: string }>;

export type EvidenceStateFilter = "all" | ProofClaim["evidenceState"];

export function filterProofClaims(
  claims: ProofClaim[],
  evidenceState: EvidenceStateFilter
): ProofClaim[] {
  return evidenceState === "all"
    ? claims
    : claims.filter((claim) => claim.evidenceState === evidenceState);
}

export function formatReviewDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeZone: "UTC"
  }).format(new Date(`${value}T00:00:00.000Z`));
}
