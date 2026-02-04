import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { formatJobTitles } from "../../src/lib/utils/formatters.js";

interface Resume {
  name: string;
  title?: string;
  jobTitles: string[];
  tagline: string;
  mission: string;
  email: string;
  location: string;
  summary: string;
  skills: Record<string, { name: string; url?: string }[]>;
  experience: Array<{
    role: string;
    company: string;
    location: string;
    description: string;
    highlights: string[];
    start_date: string;
    end_date?: string;
  }>;
  early_career: Array<{
    role: string;
    company: string;
    location: string;
    start_date: string;
    end_date?: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    location: string;
    start_date: string;
    end_date: string;
  }>;
  certificates: Array<{
    name: string;
    url?: string;
    start_date: string;
    end_date?: string;
  }>;
}

export function loadResume(variant: string = "default"): Resume {
  const fileName =
    variant === "default" ? "resume.yaml" : `resume-${variant}.yaml`;
  const filePath = path.resolve("content", fileName);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Resume file not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, "utf-8");

  // Parse YAML
  const resume = yaml.load(content) as Resume;

  return resume;
}

export function getExpectedContent(variant: string): {
  title: string;
  skillCategory: string;
} {
  const resume = loadResume(variant);

  // Extract first skill category name
  const skillCategories = Object.keys(resume.skills);
  const firstSkillCategory = skillCategories[0] || "";

  // Use title if present, otherwise format jobTitles
  const title = resume.title || formatJobTitles(resume.jobTitles);

  return {
    title,
    skillCategory: firstSkillCategory,
  };
}
