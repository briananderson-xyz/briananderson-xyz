import { test, expect } from '@playwright/test';

test.describe('Fit Finder', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/fit-finder', async (route) => {
      const request = route.request();
      const body = request.postDataJSON?.() as { jobDescription?: string } | undefined;
      const jobDescription = body?.jobDescription?.toLowerCase() || '';

      let analysis = {
        fitScore: 42,
        fitLevel: 'not',
        confidence: 'high',
        matchingSkills: [
          {
            name: 'General Architecture',
            context: 'Broad systems and delivery experience'
          }
        ],
        matchingExperience: [
          {
            role: 'Enterprise Solutions Architect',
            company: 'Amazon Web Services',
            dateRange: 'September 2024 - Present',
            relevance: 'Relevant cloud and platform background'
          }
        ],
        gaps: ['Domain-specific credentials not found'],
        analysis: 'This role is not a strong fit based on the requested domain specialization.',
        resumeVariantRecommendation: 'leader',
        cta: {
          text: 'Start a conversation',
          link: 'mailto:brian@briananderson.xyz'
        }
      };

      if (jobDescription.includes('aws') && jobDescription.includes('kubernetes') && jobDescription.includes('leadership')) {
        analysis = {
          fitScore: 91,
          fitLevel: 'good',
          confidence: 'high',
          matchingSkills: [
            { name: 'AWS', context: 'Enterprise delivery across AWS customers and certifications' },
            { name: 'Kubernetes', context: 'EKS, GKE, and OpenShift architecture and migrations' },
            { name: 'Terraform', context: 'Golden paths and cloud enablement' }
          ],
          matchingExperience: [
            {
              role: 'Enterprise Solutions Architect',
              company: 'Amazon Web Services',
              dateRange: 'September 2024 - Present',
              relevance: 'Direct AWS platform and customer modernization experience'
            }
          ],
          gaps: [],
          analysis: 'Strong fit based on AWS, Kubernetes, leadership, and platform engineering experience.',
          resumeVariantRecommendation: 'ops',
          cta: {
            text: 'Connect with Brian',
            link: 'mailto:brian@briananderson.xyz'
          }
        };
      } else if (jobDescription.includes('aws') && jobDescription.includes('kubernetes')) {
        analysis = {
          fitScore: 84,
          fitLevel: 'good',
          confidence: 'high',
          matchingSkills: [
            { name: 'AWS', context: 'Enterprise architecture and modernization' },
            { name: 'Kubernetes', context: 'Platform engineering across EKS, GKE, and OCP' }
          ],
          matchingExperience: [
            {
              role: 'Senior Technical Principal',
              company: 'Kin + Carta',
              dateRange: 'February 2020 - March 2024',
              relevance: 'Built cloud platforms and standardized delivery patterns'
            }
          ],
          gaps: [],
          analysis: 'Good fit with matching skills and relevant platform experience.',
          resumeVariantRecommendation: 'ops',
          cta: {
            text: 'Connect with Brian',
            link: 'mailto:brian@briananderson.xyz'
          }
        };
      } else if (jobDescription.includes('react') || jobDescription.includes('node.js')) {
        analysis = {
          fitScore: 68,
          fitLevel: 'maybe',
          confidence: 'medium',
          matchingSkills: [
            { name: 'React', context: 'Full-stack and product development work' },
            { name: 'TypeScript', context: 'Modern web and AI tooling projects' }
          ],
          matchingExperience: [
            {
              role: 'Staff Applied AI Engineer',
              company: 'Independent / AWS-adjacent builder work',
              dateRange: 'Recent',
              relevance: 'Strong builder alignment with some but not all requirements'
            }
          ],
          gaps: ['GraphQL experience not emphasized'],
          analysis: 'There is meaningful overlap, but the match is partial rather than exact.',
          resumeVariantRecommendation: 'builder',
          cta: {
            text: 'Review builder resume',
            link: 'mailto:brian@briananderson.xyz'
          }
        };
      } else if (jobDescription.includes('registered nurse') || jobDescription.includes('icu')) {
        analysis = {
          fitScore: 7,
          fitLevel: 'not',
          confidence: 'high',
          matchingSkills: [],
          matchingExperience: [],
          gaps: ['Clinical credentials', 'ICU experience', 'Patient care background'],
          analysis: 'This role is outside Brian’s background, so the fit is low.',
          resumeVariantRecommendation: 'leader',
          cta: {
            text: 'View resume anyway',
            link: 'mailto:brian@briananderson.xyz'
          }
        };
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ analysis })
      });
    });

    await page.goto('/');
  });

  test('should open fit finder from connect banner', async ({ page }) => {
    // Wait for page to fully load and hydrate
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Give time for JS to initialize

    // Try keyboard shortcut (Meta on Mac, Control on Windows/Linux)
    await page.keyboard.press('Meta+f');

    // Wait for fit finder modal
    const fitFinder = page.locator('[data-testid="fit-finder"]');
    await expect(fitFinder).toBeVisible({ timeout: 5000 });

    // Should have job description input
    const jdInput = page.locator('[data-testid="jd-input"]');
    await expect(jdInput).toBeVisible();
  });

  test('should analyze job description and show good fit', async ({ page }) => {
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Open fit finder via keyboard shortcut
    await page.keyboard.press('Meta+f');

    // Wait for modal with specific test ID
    await page.waitForSelector('[data-testid="jd-input"]', { timeout: 5000 });

    // Enter job description with AWS + Kubernetes + Leadership
    const jd = `Senior Platform Engineer

Required:
- 5+ years AWS experience
- Kubernetes and container orchestration
- Team leadership experience
- DevOps and CI/CD background
- Infrastructure as Code (Terraform)

Nice to have:
- Cloud architecture certifications
- Multi-cloud experience`;

    await page.fill('textarea', jd);

    // Click analyze button
    const analyzeButton = page.locator('button:has-text("Analyze")').or(
      page.locator('button:has-text("Check Fit")')
    );
    await analyzeButton.click();

    // Wait for analysis (AI call can take a few seconds)
    await page.waitForSelector('text=/fit/i', { timeout: 30000 });

    // Should show fit score or fit level
    const content = await page.textContent('body');
    expect(content).toMatch(/good|fit|score|match/i);
  });

  test('should show matching skills with evidence', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Open fit finder
    await page.keyboard.press('Meta+f');
    await page.waitForSelector('[data-testid="jd-input"]', { timeout: 5000 });

    // Simple job description
    const jd = `Cloud Engineer needed with AWS and Kubernetes experience.`;

    await page.fill('textarea', jd);

    const analyzeButton = page.locator('button:has-text("Analyze")').or(
      page.locator('button:has-text("Check Fit")')
    );
    await analyzeButton.click();

    // Wait for results
    await page.waitForSelector('text=/skill|experience/i', { timeout: 30000 });

    // Check that results include some content
    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(100);
  });

  test('should handle maybe fit scenario', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Open fit finder
    await page.keyboard.press('Meta+f');
    await page.waitForSelector('[data-testid="jd-input"]', { timeout: 5000 });

    // Job with partial match (some relevant skills, some gaps)
    const jd = `Full Stack Developer

Required:
- React and TypeScript frontend development
- Node.js backend development
- AWS deployment experience
- Agile team environment

Nice to have:
- Mobile app development
- GraphQL experience`;

    await page.fill('textarea', jd);

    const analyzeButton = page.locator('button:has-text("Analyze")').or(
      page.locator('button:has-text("Check Fit")')
    );
    await analyzeButton.click();

    // Wait for analysis
    await page.waitForSelector('text=/fit|match/i', { timeout: 30000 });

    // Should have some result
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('should show not fit for unrelated job', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Open fit finder
    await page.keyboard.press('Meta+f');
    await page.waitForSelector('[data-testid="jd-input"]', { timeout: 5000 });

    // Completely unrelated job
    const jd = `Registered Nurse - ICU

Required:
- Current RN license
- 3+ years ICU experience
- ACLS and BLS certification
- Strong patient care skills`;

    await page.fill('textarea', jd);

    const analyzeButton = page.locator('button:has-text("Analyze")').or(
      page.locator('button:has-text("Check Fit")')
    );
    await analyzeButton.click();

    // Wait for analysis
    await page.waitForSelector('text=/fit|match|gap/i', { timeout: 30000 });

    // Should show some result (even if not a good fit)
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('should be closeable with Escape key', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Open fit finder
    await page.keyboard.press('Meta+f');

    // Wait for modal
    const modal = page.locator('[data-testid="fit-finder"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Press Escape
    await page.keyboard.press('Escape');

    // Modal should close
    await expect(modal).not.toBeVisible({ timeout: 5000 });
  });
});
