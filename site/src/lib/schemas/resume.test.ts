import { describe, it, expect } from "vitest";
import { ResumeSchema } from "./resume";
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const validResume = {
  name: "Brian Anderson",
  jobTitles: ["Engineering Leader", "Builder"],
  tagline: "Builds things that prove their work.",
  email: "brian@example.com",
  location: "Chicago, IL",
  summary: "A summary.",
  skills: {
    "Cloud & Infrastructure": [{ name: "AWS", url: "https://aws.amazon.com/" }, { name: "GCP" }]
  },
  experience: [
    {
      role: "Principal Engineer",
      company: "Acme",
      location: "Remote",
      start_date: "January 2020",
      highlights: ["Did a thing", { text: "Linked thing", link: "/x" }]
    }
  ],
  education: [
    { school: "State U", degree: "BS", location: "Anytown", start_date: "September 2010" }
  ],
  certificates: [
    { name: "AWS SA", url: "https://aws.amazon.com/certification/", start_date: "January 2021" }
  ]
};

describe("ResumeSchema", () => {
  it("accepts a well-formed resume", () => {
    const result = ResumeSchema.safeParse(validResume);
    expect(result.success).toBe(true);
  });

  it("rejects a resume missing a required field", () => {
    const missingName: Partial<typeof validResume> = { ...validResume };
    delete missingName.name;
    const result = ResumeSchema.safeParse(missingName);
    expect(result.success).toBe(false);
  });

  it("rejects a malformed skill entry", () => {
    const bad = { ...validResume, skills: { Cloud: [{ url: "https://x.example" }] } };
    const result = ResumeSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it.each(["resume.yaml", "resume-ops.yaml", "resume-builder.yaml"])(
    "validates the complete %s variant",
    (filename) => {
      const value = yaml.load(fs.readFileSync(path.resolve("content", filename), "utf8"));
      expect(ResumeSchema.safeParse(value).success).toBe(true);
    }
  );

  it.each(["resume.yaml", "resume-ops.yaml", "resume-builder.yaml"])(
    "rejects a blank identity in the %s variant fixture",
    (filename) => {
      const value = yaml.load(fs.readFileSync(path.resolve("content", filename), "utf8")) as Record<
        string,
        unknown
      >;
      expect(ResumeSchema.safeParse({ ...value, name: "   " }).success).toBe(false);
    }
  );

  it.each([
    ["blank identity", { ...validResume, name: "   " }],
    ["empty job titles", { ...validResume, jobTitles: [] }],
    ["empty skills", { ...validResume, skills: {} }],
    ["empty skill category", { ...validResume, skills: { Cloud: [] } }],
    ["empty experience", { ...validResume, experience: [] }],
    ["empty education", { ...validResume, education: [] }],
    ["empty certificates", { ...validResume, certificates: [] }],
    [
      "duplicate stable skill ids",
      {
        ...validResume,
        skills: {
          Cloud: [
            { id: "aws", name: "AWS" },
            { id: "aws", name: "Another AWS" }
          ]
        }
      }
    ],
    [
      "blank highlight",
      {
        ...validResume,
        experience: [{ ...validResume.experience[0], highlights: ["  "] }]
      }
    ]
  ])("rejects unsafe fixture: %s", (_name, value) => {
    expect(ResumeSchema.safeParse(value).success).toBe(false);
  });
});
