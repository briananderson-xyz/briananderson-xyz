import { z } from "zod";
import { ContentDateSchema } from "$lib/schemas/content";

export const ProofVariantSchema = z.enum(["leader", "ops", "builder"]);

const nonEmpty = z.string().trim().min(1);

export const ProofClaimSchema = z.object({
  id: nonEmpty.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be a stable kebab-case id"),
  homepageOrder: z.partialRecord(ProofVariantSchema, z.number().int().positive()),
  text: nonEmpty,
  caseStudyRoute: nonEmpty.regex(/^\/projects\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/),
  source: z.object({
    path: nonEmpty.regex(/^projects\/[a-z0-9]+(?:-[a-z0-9]+)*\.md$/),
    excerpt: nonEmpty
  }),
  evidenceState: z.enum(["documented", "externally-corroborated", "self-reported"]),
  freshness: z.object({ reviewedAt: ContentDateSchema })
});

export const ProofLedgerSchema = z
  .array(ProofClaimSchema)
  .min(1)
  .superRefine((claims, ctx) => {
    const ids = new Set<string>();
    for (const [index, claim] of claims.entries()) {
      if (ids.has(claim.id)) {
        ctx.addIssue({ code: "custom", path: [index, "id"], message: "must be unique" });
      }
      ids.add(claim.id);

      const sourceRoute = `/${claim.source.path.replace(/\.md$/, "/")}`;
      if (sourceRoute !== claim.caseStudyRoute) {
        ctx.addIssue({
          code: "custom",
          path: [index, "source", "path"],
          message: `must identify the case study at ${claim.caseStudyRoute}`
        });
      }
    }

    for (const variant of ProofVariantSchema.options) {
      const orders = claims
        .map((claim, index) => ({ index, order: claim.homepageOrder[variant] }))
        .filter((entry): entry is { index: number; order: number } => entry.order !== undefined);
      if (orders.length !== 4) {
        ctx.addIssue({
          code: "custom",
          path: [],
          message: `${variant} must select exactly four homepage claims`
        });
      }
      const uniqueOrders = new Set(orders.map(({ order }) => order));
      if (
        uniqueOrders.size !== orders.length ||
        !orders.every(({ order }) => order <= orders.length)
      ) {
        ctx.addIssue({
          code: "custom",
          path: [],
          message: `${variant} homepageOrder values must be unique and contiguous from 1`
        });
      }
    }
  });

export type ProofClaim = z.infer<typeof ProofClaimSchema>;
export type ProofVariant = z.infer<typeof ProofVariantSchema>;

export function parseProofLedger(value: unknown): ProofClaim[] {
  return ProofLedgerSchema.parse(value);
}
