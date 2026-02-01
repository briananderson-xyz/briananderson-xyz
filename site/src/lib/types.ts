export interface ResumeJob {
  role: string;
  company: string;
  location: string;
  start_date: string;
  end_date?: string;
  description?: string;
  highlights: string[];
}

export interface SkillItem {
  name: string;
  resume?: boolean;
  url?: string;
  altName?: string;
}

export type SkillsCategory = Record<string, SkillItem[]>;

export interface ResumeSkillCategory {
  [category: string]: SkillItem[];
}

export interface ResumeEducation {
  school: string;
  degree: string;
  start_date: string;
  end_date?: string;
  location: string;
}

export interface ResumeCertificate {
  name: string;
  start_date: string;
  end_date?: string;
  url?: string;
}

export interface ResumeEarlyCareer {
  role: string;
  company: string;
  start_date: string;
  end_date?: string;
  location: string;
}

export interface Resume {
  name: string;
  title?: string;
  jobTitles: string[];
  tagline: string;
  mission?: string;
  email: string;
  location: string;
  summary: string;
  skills: ResumeSkillCategory;
  experience: ResumeJob[];
  education: ResumeEducation[];
  certificates: ResumeCertificate[];
  'early-career'?: ResumeEarlyCareer[];
}
