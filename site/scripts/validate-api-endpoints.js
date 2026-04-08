#!/usr/bin/env node
/**
 * Validates Chat and Fit Finder API endpoints
 * Tests both local (emulator) and production endpoints
 */

const SITE_URL = process.env.SITE_URL || 'https://api.briananderson.xyz';
const USE_PRODUCTION = process.env.TEST_PRODUCTION === 'true';
const SMOKE_TEST = process.env.SMOKE_TEST === 'true';

let errorCount = 0;
let warningCount = 0;
let testCount = 0;

function error(message) {
  console.error(`❌ ERROR: ${message}`);
  errorCount++;
}

function warn(message) {
  console.warn(`⚠️  WARNING: ${message}`);
  warningCount++;
}

function success(message) {
  console.log(`✓ ${message}`);
  testCount++;
}

async function smokeFetch(url, options, retries = SMOKE_TEST ? 3 : 0) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(url, options);
    if (response.ok || response.status < 500) return response;
    if (attempt < retries) {
      console.log(`   Retrying (attempt ${attempt + 2}/${retries + 1}) after ${response.status}...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  return fetch(url, options);
}

async function validateChatEndpoint() {
  console.log('\n🔍 Testing Chat Endpoint...\n');

  const endpoint = `${SITE_URL}/chat`;

  try {
    // Test 1: Basic chat request
    console.log('Test 1: Basic question about AWS...');
    const response1 = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What AWS experience do you have?',
        history: []
      })
    });

    if (!response1.ok) {
      if (response1.status === 503) {
        warn('Chat endpoint returned 503 - AI service may not be configured');
        warn('This is expected if GEMINI_API_KEY is not set');
      } else {
        error(`Chat endpoint returned ${response1.status}`);
      }
      const errorData = await response1.json().catch(() => ({}));
      console.log('Error details:', errorData);
    } else {
      const data1 = await response1.json();
      if (!data1.response) {
        error('Chat response missing "response" field');
      } else if (data1.response.length < 20) {
        warn('Chat response seems too short (< 20 chars)');
      } else {
        success('Chat endpoint returned valid response');
      }
    }

    // Test 2: Follow-up question with history
    console.log('\nTest 2: Follow-up question with history...');
    const response2 = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What about Kubernetes?',
        history: [
          { role: 'user', content: 'What AWS experience do you have?' },
          { role: 'assistant', content: 'I have extensive AWS experience...' }
        ]
      })
    });

    if (response2.ok) {
      const data2 = await response2.json();
      if (data2.response) {
        success('Chat handles conversation history correctly');
      }
    }

    // Test 3: Empty message validation
    console.log('\nTest 3: Empty message validation...');
    const response3 = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: '',
        history: []
      })
    });

    if (response3.status === 400) {
      success('Chat endpoint correctly validates empty messages');
    } else if (response3.ok) {
      warn('Chat endpoint accepts empty messages (should return 400)');
    }

    // Test 4: Invalid request body
    console.log('\nTest 4: Invalid request body...');
    const response4 = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invalid: 'data' })
    });

    if (response4.status === 400) {
      success('Chat endpoint correctly validates request body');
    } else if (response4.ok) {
      warn('Chat endpoint accepts invalid request body');
    }

  } catch (err) {
    error(`Chat endpoint test failed: ${err.message}`);
  }
}

async function validateFitFinderEndpoint() {
  console.log('\n🔍 Testing Fit Finder Endpoint...\n');

  const endpoint = `${SITE_URL}/fit-finder`;

  try {
    // Test 1: Good fit scenario
    console.log('Test 1: Good fit job description (AWS + Kubernetes)...');
    const goodFitJD = `Senior Platform Engineer

Required:
- 5+ years AWS experience
- Kubernetes and container orchestration
- Infrastructure as Code (Terraform)
- Team leadership experience
- DevOps and CI/CD background`;

    const response1 = await smokeFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobDescription: goodFitJD,
        variant: 'leader'
      })
    });

    if (!response1.ok) {
      if (response1.status === 503) {
        warn('Fit Finder endpoint returned 503 - AI service may not be configured');
        warn('This is expected if GEMINI_API_KEY is not set');
      } else {
        error(`Fit Finder endpoint returned ${response1.status}`);
      }
      const errorData = await response1.json().catch(() => ({}));
      console.log('Error details:', errorData);
    } else {
      const data1 = await response1.json();

      // Validate response structure
      if (!data1.analysis) {
        error('Fit Finder response missing "analysis" field');
      } else {
        const analysis = data1.analysis;

        // Check required fields
        if (typeof analysis.fitScore !== 'number') {
          error('Analysis missing fitScore');
        } else if (analysis.fitScore < 0 || analysis.fitScore > 100) {
          error(`Invalid fitScore: ${analysis.fitScore} (should be 0-100)`);
        } else {
          success(`Fit Finder returned fitScore: ${analysis.fitScore}`);
        }

        if (!['good', 'maybe', 'not'].includes(analysis.fitLevel)) {
          error(`Missing or unexpected fitLevel: ${analysis.fitLevel}`);
        } else {
          success(`Fit Finder returned fitLevel: ${analysis.fitLevel}`);
        }

        if (analysis.confidence && !['high', 'medium', 'low'].includes(analysis.confidence)) {
          warn(`Unexpected confidence: ${analysis.confidence}`);
        }

        if (!Array.isArray(analysis.matchingSkills)) {
          error('Analysis missing matchingSkills array');
        } else {
          success(`Fit Finder found ${analysis.matchingSkills.length} matching skills`);

          // Validate skill structure
          analysis.matchingSkills.forEach((skill, i) => {
            if (!skill.name) {
              error(`Skill ${i} missing name`);
            }
            if (skill.url && !skill.url.startsWith('http')) {
              warn(`Skill "${skill.name}" has invalid URL: ${skill.url}`);
            }
          });
        }

        if (!Array.isArray(analysis.matchingExperience)) {
          error('Analysis missing matchingExperience array');
        } else {
          success(`Fit Finder found ${analysis.matchingExperience.length} matching experience entries`);
        }

        if (!Array.isArray(analysis.gaps)) {
          error('Analysis missing gaps array');
        }

        if (!analysis.analysis || typeof analysis.analysis !== 'string') {
          error('Analysis missing narrative text');
        } else if (analysis.analysis.length < 50) {
          error('Analysis narrative too short (< 50 chars)');
        } else {
          success('Fit Finder includes narrative analysis');
        }

        if (!analysis.resumeVariantRecommendation) {
          error('Analysis missing resumeVariantRecommendation');
        } else {
          success(`Resume variant recommendation: ${analysis.resumeVariantRecommendation}`);
        }

        if (!analysis.cta || !analysis.cta.text || !analysis.cta.link) {
          error('Analysis missing CTA (text and link required)');
        } else {
          success('Analysis includes CTA');
        }
      }
    }

    // Test 2: Not fit scenario
    console.log('\nTest 2: Not fit job description (Nursing)...');
    const notFitJD = `Registered Nurse - ICU

Required:
- Current RN license
- 3+ years ICU experience
- ACLS and BLS certification`;

    const response2 = await smokeFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobDescription: notFitJD
      })
    });

    if (response2.ok) {
      const data2 = await response2.json();
      if (data2.analysis && data2.analysis.fitLevel === 'not') {
        success('Fit Finder correctly identifies poor fit');
      } else if (data2.analysis) {
        warn(`Expected fitLevel "not" for nursing job, got "${data2.analysis.fitLevel}"`);
      }
    }

    // Test 3: Empty job description
    console.log('\nTest 3: Empty job description validation...');
    const response3 = await smokeFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobDescription: ''
      })
    });

    if (response3.status === 400) {
      success('Fit Finder correctly validates empty job descriptions');
    } else if (response3.ok) {
      warn('Fit Finder accepts empty job descriptions (should return 400)');
    }

  } catch (err) {
    error(`Fit Finder endpoint test failed: ${err.message}`);
  }
}

async function validateAPIEndpoints() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 API Endpoint Validation');
  console.log(`   Testing: ${SITE_URL}`);
  console.log(`   Mode: ${USE_PRODUCTION ? 'PRODUCTION' : SMOKE_TEST ? 'SMOKE TEST' : 'LOCAL/EMULATOR'}`);
  console.log('='.repeat(60));

  await validateChatEndpoint();
  await validateFitFinderEndpoint();

  // Summary
  console.log('\n' + '='.repeat(60));
  if (errorCount === 0 && warningCount === 0) {
    console.log(`✅ All ${testCount} API tests passed!`);
  } else {
    console.log(`\n⚠️  API validation completed with issues:`);
    console.log(`   - ${errorCount} errors`);
    console.log(`   - ${warningCount} warnings`);
    console.log(`   - ${testCount} tests passed`);

    if (warningCount > 0 && errorCount === 0) {
      console.log('\n💡 Warnings are expected if AI service is not configured');
      console.log('   Set GEMINI_API_KEY in Firebase Functions to enable AI features');
    }

    if (errorCount > 0) {
      console.log('\n❌ Fix errors before deploying to production');
      process.exit(1);
    }
  }
  console.log('='.repeat(60) + '\n');
}

// Run validation
validateAPIEndpoints().catch(err => {
  console.error('API validation failed:', err);
  process.exit(1);
});
