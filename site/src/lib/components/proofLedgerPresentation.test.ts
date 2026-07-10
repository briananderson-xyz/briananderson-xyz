import { describe, expect, it } from "vitest";
import type { ProofClaim } from "$lib/schemas/proofLedger";
import {
  evidenceStatePresentation,
  filterProofClaims,
  formatReviewDate
} from "$lib/components/proofLedgerPresentation";

const claim = (id: string, evidenceState: ProofClaim["evidenceState"]): ProofClaim => ({
  id,
  homepageOrder: {},
  text: `Claim ${id}`,
  caseStudyRoute: `/projects/${id}/`,
  source: { path: `projects/${id}.md`, excerpt: `Excerpt ${id}` },
  evidenceState,
  freshness: { reviewedAt: "2026-07-09" }
});

describe("proof ledger presentation", () => {
  const claims = [claim("one", "documented"), claim("two", "self-reported")];

  it("keeps every claim in the all view and filters by evidence state", () => {
    expect(filterProofClaims(claims, "all")).toEqual(claims);
    expect(filterProofClaims(claims, "self-reported").map(({ id }) => id)).toEqual(["two"]);
    expect(filterProofClaims(claims, "externally-corroborated")).toEqual([]);
  });

  it("describes documented evidence as traceability rather than verification", () => {
    expect(evidenceStatePresentation.documented.explanation).toMatch(
      /not independent verification/i
    );
    expect(evidenceStatePresentation["self-reported"].explanation).toMatch(
      /not presented here as independently verified/i
    );
  });

  it("formats date-only freshness without a local-time shift", () => {
    expect(formatReviewDate("2026-07-09")).toBe("Jul 9, 2026");
  });
});
