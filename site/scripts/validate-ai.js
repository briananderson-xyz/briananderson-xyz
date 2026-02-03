#!/usr/bin/env node

/**
 * AI Compatibility Validation Script
 *
 * This script validates that AI-readable endpoints are properly configured
 * and accessible for LLMs and search engines.
 *
 * Usage: node scripts/validate-ai.js
 */

import fs from 'fs';
import path from 'path';

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function error(message) {
  log(`✗ ${message}`, 'red');
}

function success(message) {
  log(`✓ ${message}`, 'green');
}

function warn(message) {
  log(`⚠ ${message}`, 'yellow');
}

function info(message) {
  log(`ℹ ${message}`, 'blue');
}

function section(message) {
  console.log(`\n${COLORS.blue}${message}${COLORS.reset}\n`);
}

async function validateEndpoints() {
  section('=== AI Endpoints ===');

  let passed = 0;
  let total = 0;

  const buildPath = path.resolve('build');
  const endpoints = [
    { path: 'llms.txt', type: 'text/plain', description: 'LLM discovery file' },
    { path: 'resume.json', type: 'application/json', description: 'JSONResume format' },
    { path: 'sitemap.xml', type: 'application/xml', description: 'Sitemap with AI endpoints' }
  ];

  for (const endpoint of endpoints) {
    total++;
    const fullPath = path.join(buildPath, endpoint.path);
    
    if (!fs.existsSync(fullPath)) {
      error(`${endpoint.description} (${endpoint.path}) not found in build output`);
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    
    if (!content.trim()) {
      error(`${endpoint.description} (${endpoint.path}) is empty`);
      continue;
    }

    success(`${endpoint.description} (${endpoint.path}) exists and has content`);
    passed++;
  }

  return { passed, total };
}

async function validateLLMsTxt() {
  section('=== llms.txt Structure ===');

  let passed = 0;
  let total = 0;

  const llmsPath = path.resolve('build/llms.txt');
  
  if (!fs.existsSync(llmsPath)) {
    error('llms.txt not found');
    return { passed: 0, total: 0 };
  }

  const content = fs.readFileSync(llmsPath, 'utf-8');
  const lines = content.split('\n');

  const requiredSections = [
    'Site Overview',
    'AI-Readable Endpoints',
    'Resume Data',
    'Content',
    'About Brian',
    'Featured Work',
    'Technical Stack'
  ];

  for (const section of requiredSections) {
    total++;
    if (content.includes(`## ${section}`)) {
      success(`Section "${section}" is present`);
      passed++;
    } else {
      error(`Section "${section}" is missing`);
    }
  }

  const requiredLinks = [
    'resume/',
    'resume.json',
    'blog/',
    'projects/',
    'briananderson.xyz'
  ];

  for (const link of requiredLinks) {
    total++;
    if (content.includes(link)) {
      success(`Link to ${link} is present`);
      passed++;
    } else {
      error(`Link to ${link} is missing`);
    }
  }

  return { passed, total };
}

async function validateResumeJSON() {
  section('=== resume.json Structure ===');

  let passed = 0;
  let total = 0;

  const resumeJsonPath = path.resolve('build/resume.json');
  
  if (!fs.existsSync(resumeJsonPath)) {
    error('resume.json not found');
    return { passed: 0, total: 0 };
  }

  let resume;
  try {
    resume = JSON.parse(fs.readFileSync(resumeJsonPath, 'utf-8'));
  } catch (e) {
    error('resume.json is not valid JSON');
    return { passed: 0, total: 0 };
  }

  const requiredFields = ['$schema', 'basics', 'work', 'education', 'skills', 'certificates'];

  for (const field of requiredFields) {
    total++;
    if (resume[field]) {
      success(`Field "${field}" is present`);
      passed++;
    } else {
      error(`Field "${field}" is missing`);
    }
  }

  const requiredBasicFields = ['name', 'label', 'email', 'summary', 'location'];

  for (const field of requiredBasicFields) {
    total++;
    if (resume.basics?.[field]) {
      success(`basics.${field} is present`);
      passed++;
    } else {
      error(`basics.${field} is missing`);
    }
  }

  total++;
  if (resume.meta) {
    success('meta object exists (for custom fields like mission, tagline, early-career)');
    passed++;
  } else {
    error('meta object is missing (custom fields may be lost)');
  }

  total++;
  if (resume.work && resume.work.length > 0) {
    success(`work array contains ${resume.work.length} entries`);
    passed++;
  } else {
    error('work array is empty or missing');
  }

  return { passed, total };
}

async function validateSitemap() {
  section('=== Sitemap XML ===');

  let passed = 0;
  let total = 0;

  const sitemapPath = path.resolve('build/sitemap.xml');
  
  if (!fs.existsSync(sitemapPath)) {
    error('sitemap.xml not found');
    return { passed: 0, total: 0 };
  }

  const content = fs.readFileSync(sitemapPath, 'utf-8');
  const aiEndpoints = [
    'https://briananderson.xyz/llms.txt',
    'https://briananderson.xyz/resume.json'
  ];

  for (const endpoint of aiEndpoints) {
    total++;
    if (content.includes(endpoint)) {
      success(`${endpoint} is in sitemap`);
      passed++;
    } else {
      error(`${endpoint} is missing from sitemap`);
    }
  }

  return { passed, total };
}

async function validateJSONLD() {
  section('=== JSON-LD Schema Markup ===');

  let passed = 0;
  let total = 0;

  const resumePages = [
    { path: 'build/index.html', title: 'Home page', fields: ['@context', '@type', 'Person', 'name', 'worksFor', 'sameAs'] },
    { path: 'build/resume/index.html', title: 'Default resume', fields: ['@context', '@type', 'Person', 'name', 'hasOccupation', 'alumniOf'] },
    { path: 'build/ops/resume/index.html', title: 'Ops variant', fields: ['@context', '@type', 'Person', 'name', 'hasOccupation', 'alumniOf'] },
    { path: 'build/builder/resume/index.html', title: 'Builder variant', fields: ['@context', '@type', 'Person', 'name', 'hasOccupation', 'alumniOf'] }
  ];

  for (const page of resumePages) {
    total++;
    if (!fs.existsSync(page.path)) {
      error(`${page.title} (${page.path}) not found`);
      continue;
    }

    const content = fs.readFileSync(page.path, 'utf-8');
    
    const jsonldMatches = content.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>/gi);
    
    if (!jsonldMatches || jsonldMatches.length === 0) {
      error(`${page.title} missing JSON-LD script tag`);
      continue;
    }

    if (jsonldMatches.length > 1) {
      error(`${page.title} has multiple (${jsonldMatches.length}) JSON-LD script tags - should have exactly one`);
      continue;
    }

    const requiredFields = page.fields;
    let hasAllFields = true;

    for (const field of requiredFields) {
      if (!content.includes(`"${field}"`) && !content.includes(`'${field}'`)) {
        hasAllFields = false;
        error(`${page.title} JSON-LD missing field: ${field}`);
      }
    }

    if (hasAllFields) {
      success(`${page.title} has exactly one JSON-LD with required fields`);
      passed++;
    }
  }

  return { passed, total };
}

async function validateContentTypes() {
  section('=== Content Type Validation ===');

  let passed = 0;
  let total = 0;

  const expectedContentTypes = [
    { file: 'build/llms.txt', type: 'text/plain' },
    { file: 'build/resume.json', type: 'application/json' },
    { file: 'build/sitemap.xml', type: 'application/xml' }
  ];

  for (const { file, type } of expectedContentTypes) {
    total++;
    const fullPath = path.resolve(file);
    
    if (!fs.existsSync(fullPath)) {
      error(`${file} not found`);
      continue;
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      if (type === 'application/json') {
        JSON.parse(content);
        success(`${file} contains valid JSON`);
        passed++;
      } else if (type === 'application/xml') {
        if (content.includes('<?xml')) {
          success(`${file} contains valid XML`);
          passed++;
        } else {
          error(`${file} missing XML declaration`);
        }
      } else {
        success(`${file} contains valid text content`);
        passed++;
      }
    } catch (e) {
      error(`${file} content validation failed: ${e.message}`);
    }
  }

  return { passed, total };
}

async function validateContentSignals() {
  section('=== Content Signals / AI Preferences ===');

  let passed = 0;
  let total = 0;

  // Check HTML pages for AI preference meta tags
  total++;
  const indexPath = path.resolve('build/index.html');
  if (fs.existsSync(indexPath)) {
    const htmlContent = fs.readFileSync(indexPath, 'utf-8');
    const hasAiPrefs = htmlContent.includes('ai-preferences') || 
                       htmlContent.includes('ai-crawler') ||
                       htmlContent.includes('AI-Preferences');
    if (hasAiPrefs) {
      success('index.html contains AI preference meta tags');
      passed++;
    } else {
      error('index.html missing AI preference meta tags');
    }
  } else {
    error('index.html not found');
  }

  // Check robots.txt for AI crawler directives
  total++;
  const robotsPath = path.resolve('build/robots.txt');
  if (fs.existsSync(robotsPath)) {
    const robotsContent = fs.readFileSync(robotsPath, 'utf-8');
    const hasAiCrawlers = robotsContent.includes('GPTBot') || 
                         robotsContent.includes('Google-Extended') ||
                         robotsContent.includes('ClaudeBot');
    if (hasAiCrawlers) {
      success('robots.txt contains AI crawler directives');
      passed++;
    } else {
      error('robots.txt missing AI crawler directives');
    }
  } else {
    error('robots.txt not found');
  }

  // Check for AI permission headers in hooks.server.ts
  total++;
  const hooksPath = path.resolve('src/hooks.server.ts');
  if (fs.existsSync(hooksPath)) {
    const hooksContent = fs.readFileSync(hooksPath, 'utf-8');
    const hasAiHeaders = hooksContent.includes('AI-Preferences') ||
                         hooksContent.includes('X-AI-');
    if (hasAiHeaders) {
      success('hooks.server.ts contains AI preference headers');
      passed++;
    } else {
      error('hooks.server.ts missing AI preference headers');
    }
  } else {
    error('hooks.server.ts not found');
  }

  return { passed, total };
}

async function main() {
  info('\n=== AI Compatibility Validation ===\n');

  const results = await Promise.all([
    validateEndpoints(),
    validateLLMsTxt(),
    validateResumeJSON(),
    validateSitemap(),
    validateJSONLD(),
    validateContentTypes(),
    validateContentSignals()
  ]);

  const totalPassed = results.reduce((sum, r) => sum + r.passed, 0);
  const totalTests = results.reduce((sum, r) => sum + r.total, 0);

  section('=== Summary ===');
  info(`Passed: ${totalPassed}/${totalTests}`);

  if (totalPassed === totalTests) {
    success('\n✓ All AI compatibility checks passed!\n');
    process.exit(0);
  } else {
    error('\n✗ Some AI compatibility checks failed.\n');
    process.exit(1);
  }
}

main();
