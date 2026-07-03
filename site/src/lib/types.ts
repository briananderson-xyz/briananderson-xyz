export interface ProjectLink {
  label: string;
  url: string;
  type?: "case-study" | "github" | "live" | "article" | "docs";
}

export interface VisualArchiveImage {
  path: string;
  alt: string;
  caption?: string;
}

export interface ContentMetadata {
  title: string;
  date: string;
  period?: string;
  summary?: string;
  tags?: string[];
  keywords?: string[];
  featuredImage?: string;
  featuredImageAlt?: string;
  featuredImageCaption?: string;
  readingTime?: string;
  visualArchive?: {
    images: VisualArchiveImage[];
  };
  links?: ProjectLink[];
}

export interface ContentItem {
  metadata: ContentMetadata;
  route: string;
}

// Resume types are inferred from the zod schema (the single source of truth)
// and re-exported here so existing `$lib/types` imports keep working.
export type {
  Resume,
  ResumeJob,
  ResumeHighlight,
  SkillItem,
  ResumeEducation,
  ResumeCertificate,
  ResumeEarlyCareer
} from '$lib/schemas/resume';

export interface QuickAction {
  id: string;
  title: string;
  description?: string;
  category: "page" | "blog" | "project" | "variant" | "action";
  url?: string;
  handler?: () => void;
  keywords?: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface FitAnalysis {
  fitScore: number;
  fitLevel: "good" | "maybe" | "not";
  confidence: "high" | "medium" | "low";
  matchingSkills: Array<{
    name: string;
    url?: string;
    context?: string;
  }>;
  matchingExperience: Array<{
    role: string;
    company: string;
    dateRange: string;
    url?: string;
    relevance: string;
  }>;
  gaps: string[];
  analysis: string;
  resumeVariantRecommendation: "leader" | "ops" | "builder";
  cta: {
    text: string;
    link: string;
  };
}
