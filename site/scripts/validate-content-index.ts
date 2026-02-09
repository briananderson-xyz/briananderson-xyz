#!/usr/bin/env tsx
/**
 * Validates the content index structure and relationships
 * Ensures build-content-index.ts produces valid output
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ContentIndex {
  skills: SkillEntry[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  blog: BlogEntry[];
  resume: ResumeData;
  metadata: {
    buildDate: string;
    version: string;
  };
}

interface SkillEntry {
  name: string;
  category: string;
  projects: string[];
  blog: string[];
}

interface ProjectEntry {
  slug: string;
  title: string;
  url: string;
  summary: string;
  tags: string[];
  skills?: string[];
}

interface BlogEntry {
  slug: string;
  title: string;
  url: string;
  summary: string;
  tags: string[];
  date: string;
}

interface ExperienceEntry {
  role: string;
  company: string;
  dateRange: string;
  description: string;
  highlights: string[];
}

interface ResumeData {
  name: string;
  title: string;
  location: string;
  summary: string;
}

let errorCount = 0;
let warningCount = 0;

function error(message: string): void {
  console.error(`❌ ERROR: ${message}`);
  errorCount++;
}

function warn(message: string): void {
  console.warn(`⚠️  WARNING: ${message}`);
  warningCount++;
}

function success(message: string): void {
  console.log(`✓ ${message}`);
}

async function validateContentIndex(): Promise<void> {
  console.log('\n🔍 Validating Content Index...\n');

  // Check if content index exists
  const indexPath = path.join(__dirname, '../static/content-index.json');

  if (!fs.existsSync(indexPath)) {
    error('Content index not found at static/content-index.json');
    error('Run `pnpm run build-content-index` first');
    return;
  }

  // Read and parse index
  let index: ContentIndex;
  try {
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    index = JSON.parse(indexContent);
    success('Content index JSON is valid');
  } catch (err) {
    error(`Failed to parse content index: ${err}`);
    return;
  }

  // Validate structure
  validateStructure(index);

  // Validate skills
  validateSkills(index);

  // Validate projects
  validateProjects(index);

  // Validate blog posts
  validateBlog(index);

  // Validate experience
  validateExperience(index);

  // Validate resume
  validateResume(index);

  // Validate metadata
  validateMetadata(index);

  // Validate relationships
  validateRelationships(index);

  // Summary
  console.log('\n' + '='.repeat(50));
  if (errorCount === 0 && warningCount === 0) {
    console.log('✅ Content index validation passed!');
    console.log(`   - ${index.skills.length} skills`);
    console.log(`   - ${index.projects.length} projects`);
    console.log(`   - ${index.blog.length} blog posts`);
    console.log(`   - ${index.experience.length} experience entries`);
  } else {
    console.log(`\n⚠️  Validation completed with issues:`);
    console.log(`   - ${errorCount} errors`);
    console.log(`   - ${warningCount} warnings`);
    if (errorCount > 0) {
      process.exit(1);
    }
  }
  console.log('='.repeat(50) + '\n');
}

function validateStructure(index: ContentIndex): void {
  if (!index.skills || !Array.isArray(index.skills)) {
    error('Missing or invalid skills array');
  }
  if (!index.projects || !Array.isArray(index.projects)) {
    error('Missing or invalid projects array');
  }
  if (!index.blog || !Array.isArray(index.blog)) {
    error('Missing or invalid blog array');
  }
  if (!index.experience || !Array.isArray(index.experience)) {
    error('Missing or invalid experience array');
  }
  if (!index.resume || typeof index.resume !== 'object') {
    error('Missing or invalid resume object');
  }
  if (!index.metadata || typeof index.metadata !== 'object') {
    error('Missing or invalid metadata object');
  }

  if (errorCount === 0) {
    success('Content index structure is valid');
  }
}

function validateSkills(index: ContentIndex): void {
  if (!index.skills) return;

  let skillErrors = 0;

  index.skills.forEach((skill, i) => {
    if (!skill.name) {
      error(`Skill ${i} is missing name`);
      skillErrors++;
    }
    if (!skill.category) {
      error(`Skill "${skill.name || i}" is missing category`);
      skillErrors++;
    }
    if (!Array.isArray(skill.projects)) {
      error(`Skill "${skill.name || i}" has invalid projects array`);
      skillErrors++;
    }
    if (!Array.isArray(skill.blog)) {
      error(`Skill "${skill.name || i}" has invalid blog array`);
      skillErrors++;
    }
  });

  if (skillErrors === 0) {
    success(`All ${index.skills.length} skills are valid`);
  }

  // Check for skills with evidence
  const skillsWithEvidence = index.skills.filter(
    s => s.projects.length > 0 || s.blog.length > 0
  );
  success(`${skillsWithEvidence.length} skills have documented evidence`);

  if (skillsWithEvidence.length === 0) {
    warn('No skills have project or blog evidence');
  }
}

function validateProjects(index: ContentIndex): void {
  if (!index.projects) return;

  let projectErrors = 0;

  index.projects.forEach((project, i) => {
    if (!project.slug) {
      error(`Project ${i} is missing slug`);
      projectErrors++;
    }
    if (!project.title) {
      error(`Project "${project.slug || i}" is missing title`);
      projectErrors++;
    }
    if (!project.url) {
      error(`Project "${project.slug || i}" is missing url`);
      projectErrors++;
    }
    if (project.url && !project.url.includes('/projects/')) {
      error(`Project "${project.slug}" has invalid URL: ${project.url}`);
      projectErrors++;
    }
    if (!project.summary) {
      warn(`Project "${project.slug || i}" is missing summary`);
    }
    if (!Array.isArray(project.tags)) {
      error(`Project "${project.slug || i}" has invalid tags array`);
      projectErrors++;
    }
  });

  if (projectErrors === 0) {
    success(`All ${index.projects.length} projects are valid`);
  }
}

function validateBlog(index: ContentIndex): void {
  if (!index.blog) return;

  let blogErrors = 0;

  index.blog.forEach((post, i) => {
    if (!post.slug) {
      error(`Blog post ${i} is missing slug`);
      blogErrors++;
    }
    if (!post.title) {
      error(`Blog post "${post.slug || i}" is missing title`);
      blogErrors++;
    }
    if (!post.url) {
      error(`Blog post "${post.slug || i}" is missing url`);
      blogErrors++;
    }
    if (post.url && !post.url.includes('/blog/')) {
      error(`Blog post "${post.slug}" has invalid URL: ${post.url}`);
      blogErrors++;
    }
    if (!post.date) {
      warn(`Blog post "${post.slug || i}" is missing date`);
    }
    if (!Array.isArray(post.tags)) {
      error(`Blog post "${post.slug || i}" has invalid tags array`);
      blogErrors++;
    }
  });

  if (blogErrors === 0) {
    success(`All ${index.blog.length} blog posts are valid`);
  }
}

function validateExperience(index: ContentIndex): void {
  if (!index.experience) return;

  let expErrors = 0;

  index.experience.forEach((exp, i) => {
    if (!exp.role) {
      error(`Experience ${i} is missing role`);
      expErrors++;
    }
    if (!exp.company) {
      error(`Experience ${i} (${exp.role || 'unknown'}) is missing company`);
      expErrors++;
    }
    if (!exp.dateRange) {
      error(`Experience ${i} (${exp.role || 'unknown'}) is missing dateRange`);
      expErrors++;
    }
    if (!exp.description) {
      warn(`Experience "${exp.role} at ${exp.company}" is missing description`);
    }
    if (!Array.isArray(exp.highlights)) {
      error(`Experience "${exp.role} at ${exp.company}" has invalid highlights array`);
      expErrors++;
    }
  });

  if (expErrors === 0) {
    success(`All ${index.experience.length} experience entries are valid`);
  }
}

function validateResume(index: ContentIndex): void {
  if (!index.resume) return;

  if (!index.resume.name) {
    error('Resume is missing name');
  }
  if (!index.resume.title) {
    error('Resume is missing title');
  }
  if (!index.resume.location) {
    warn('Resume is missing location');
  }
  if (!index.resume.summary) {
    warn('Resume is missing summary');
  }

  if (index.resume.name && index.resume.title) {
    success('Resume data is valid');
  }
}

function validateMetadata(index: ContentIndex): void {
  if (!index.metadata) return;

  if (!index.metadata.buildDate) {
    error('Metadata is missing buildDate');
  }
  if (!index.metadata.version) {
    error('Metadata is missing version');
  }

  if (index.metadata.buildDate && index.metadata.version) {
    success(`Metadata is valid (version: ${index.metadata.version})`);

    // Check if build is fresh
    const buildDate = new Date(index.metadata.buildDate);
    const ageMinutes = (Date.now() - buildDate.getTime()) / 60000;

    if (ageMinutes > 60) {
      warn(`Content index is ${Math.round(ageMinutes)} minutes old - consider rebuilding`);
    } else {
      success(`Content index is ${Math.round(ageMinutes)} minutes old`);
    }
  }
}

function validateRelationships(index: ContentIndex): void {
  if (!index.skills || !index.projects) return;

  let relationshipErrors = 0;

  // Validate skill -> project references
  const projectSlugs = new Set(index.projects.map(p => p.slug));

  index.skills.forEach(skill => {
    skill.projects.forEach(projectSlug => {
      if (!projectSlugs.has(projectSlug)) {
        error(`Skill "${skill.name}" references non-existent project: ${projectSlug}`);
        relationshipErrors++;
      }
    });
  });

  // Validate skill -> blog references
  const blogSlugs = new Set(index.blog.map(b => b.slug));

  index.skills.forEach(skill => {
    skill.blog.forEach(blogSlug => {
      if (!blogSlugs.has(blogSlug)) {
        error(`Skill "${skill.name}" references non-existent blog post: ${blogSlug}`);
        relationshipErrors++;
      }
    });
  });

  if (relationshipErrors === 0) {
    success('All skill relationships are valid');
  }
}

// Run validation
validateContentIndex().catch(err => {
  console.error('Validation failed:', err);
  process.exit(1);
});
