import { describe, expect, it } from "vitest";
import {
  getHomepageProofClaims,
  loadProofLedger,
  validateProofSources
} from "$lib/server/loadProofLedger";
import { parseProofLedger } from "$lib/schemas/proofLedger";

describe("proof ledger", () => {
  it("loads claims whose routes, excerpts, and freshness match project sources", () => {
    const claims = loadProofLedger();

    expect(claims).toHaveLength(8);
    expect(
      claims.find((claim) => claim.id === "discover-platform-scale-and-savings")
    ).toMatchObject({
      caseStudyRoute: "/projects/discover-trident/"
    });
    expect(claims.find((claim) => claim.id === "discover-deployment-lead-time")).toMatchObject({
      caseStudyRoute: "/projects/discover-trident/"
    });
    expect(getHomepageProofClaims("leader").map((claim) => claim.homepageOrder.leader)).toEqual([
      1, 2, 3, 4
    ]);
    expect(getHomepageProofClaims("ops")).toHaveLength(4);
    expect(getHomepageProofClaims("builder")).toHaveLength(4);
  });

  it("rejects duplicate IDs and mismatched case-study sources", () => {
    const claims = loadProofLedger();
    expect(() => parseProofLedger([...claims, { ...claims[0], homepageOrder: {} }])).toThrow(
      /must be unique/
    );
    expect(() =>
      parseProofLedger(
        claims.map((claim, index) =>
          index === 0
            ? { ...claim, source: { ...claim.source, path: "projects/gfs-ordering-platform.md" } }
            : claim
        )
      )
    ).toThrow(/must identify the case study/);
  });

  it("rejects an excerpt that is not present in its source", () => {
    const claims = loadProofLedger();
    const invalid = claims.map((claim, index) =>
      index === 0
        ? { ...claim, source: { ...claim.source, excerpt: "A claim the case study never makes." } }
        : claim
    );

    expect(() => validateProofSources(invalid)).toThrow(/excerpt is not present/);
  });
});
