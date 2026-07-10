import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import yaml from "js-yaml";
import { parseContentMetadata } from "$lib/schemas/content";
import { parseProofLedger, type ProofClaim, type ProofVariant } from "$lib/schemas/proofLedger";

function normalizeEvidence(value: string): string {
  return value
    .replace(/[*_`#>]/g, "")
    .replace(/^\s*-\s*/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function validateProofSources(
  claims: ProofClaim[],
  contentRoot = path.resolve("content")
): ProofClaim[] {
  for (const claim of claims) {
    const sourceFile = path.resolve(contentRoot, claim.source.path);
    const relative = path.relative(contentRoot, sourceFile);
    if (relative.startsWith("..") || path.isAbsolute(relative) || !fs.existsSync(sourceFile)) {
      throw new Error(`proof-ledger.yaml:${claim.id}: source does not exist: ${claim.source.path}`);
    }

    const parsed = matter(fs.readFileSync(sourceFile, "utf8"));
    const metadata = parseContentMetadata(parsed.data, claim.source.path);
    const normalizedSource = normalizeEvidence(parsed.content);
    const normalizedExcerpt = normalizeEvidence(claim.source.excerpt);
    if (!normalizedSource.includes(normalizedExcerpt)) {
      throw new Error(
        `proof-ledger.yaml:${claim.id}: excerpt is not present in ${claim.source.path}`
      );
    }

    const sourceFreshness = metadata.updated ?? metadata.date;
    if (claim.freshness.reviewedAt < sourceFreshness) {
      throw new Error(
        `proof-ledger.yaml:${claim.id}: reviewedAt predates source freshness ${sourceFreshness}`
      );
    }
  }
  return claims;
}

export function loadProofLedger(): ProofClaim[] {
  const contentRoot = path.resolve("content");
  const ledgerPath = path.join(contentRoot, "proof-ledger.yaml");
  const claims = parseProofLedger(yaml.load(fs.readFileSync(ledgerPath, "utf8")));
  return validateProofSources(claims, contentRoot);
}

export function getHomepageProofClaims(variant: ProofVariant): ProofClaim[] {
  return loadProofLedger()
    .filter((claim) => claim.homepageOrder[variant] !== undefined)
    .sort((a, b) => a.homepageOrder[variant]! - b.homepageOrder[variant]!);
}
