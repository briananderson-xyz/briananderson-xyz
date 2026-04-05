/**
 * TypeScript interfaces for Firebase Functions
 */

export interface ContentIndex {
  skills: SkillEntry[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  blog: BlogEntry[];
  resume: ResumeData;
  metadata: IndexMetadata;
}

export interface SkillEntry {
  name: string;
  category: string;
  projects: string[];
  blog: string[];
}

export interface ExperienceEntry {
  role: string;
  company: string;
  dateRange: string;
  location: string;
  description: string;
  highlights: string[];
}

export interface ProjectEntry {
  slug: string;
  title: string;
  url: string;
  summary: string;
  tags: string[];
  keywords: string[];
  date: string;
  contentExcerpt: string;
}

export interface BlogEntry {
  slug: string;
  title: string;
  url: string;
  summary: string;
  tags: string[];
  keywords: string[];
  date: string;
}

export interface ResumeData {
  name: string;
  title: string;
  tagline: string;
  summary: string;
  location: string;
  email: string;
  skillCategories: Record<string, string[]>;
  certificates: string[];
}

export interface IndexMetadata {
  buildDate: string;
  version: string;
  projectCount: number;
  blogCount: number;
  skillCount: number;
  experienceCount: number;
}

export interface ContentIndexPointer {
  filename: string;
  buildDate: string;
  hash: string;
}

export interface ChatRequest {
  message: string;
  history?: Array<{ role: string; content: string }>;
  variant?: 'leader' | 'ops' | 'builder';
}

export interface FitFinderRequest {
  jobDescription: string;
  variant?: 'leader' | 'ops' | 'builder';
}

export interface SkillResult {
  name: string;
  category: string;
  projects: string[];
  blog: string[];
  hasEvidence: boolean;
}

export interface ProjectResult {
  slug: string;
  title: string;
  url: string;
  summary: string;
  tags: string[];
  date: string;
}

export interface ExperienceResult {
  role: string;
  company: string;
  dateRange: string;
  location: string;
  description: string;
  highlights: string[];
}

export interface ResumeSummary {
  name: string;
  title: string;
  location: string;
  email: string;
  tagline: string;
  summary: string;
  skillCategories: string[];
  certificates: string[];
}

export interface ToolExecutionArgs {
  keywords?: string[];
  slug?: string;
  category?: string;
}
