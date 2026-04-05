class FitFinderProvider {
  constructor(options) {
    this.providerId = options.id || "fit-finder-api";
    this.config = options.config || {};
    this.baseUrl = process.env.AI_EVAL_BASE_URL || this.config.baseUrl || "https://api.briananderson.xyz";
    this.maxRetries = Number(process.env.AI_EVAL_MAX_RETRIES || this.config.maxRetries || 2);
    this.timeoutMs = Number(process.env.AI_EVAL_TIMEOUT_MS || this.config.timeoutMs || 25000);
  }

  id() {
    return this.providerId;
  }

  async delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async callApi(prompt, context) {
    let lastError;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/fit-finder`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jobDescription: prompt,
            variant: context?.vars?.variant || "leader",
          }),
          signal: AbortSignal.timeout(this.timeoutMs),
        });

        if (!response.ok) {
          const responseText = await response.text();
          const shouldRetry = response.status >= 500 || response.status === 429;
          if (shouldRetry && attempt < this.maxRetries) {
            await this.delay(750 * (attempt + 1));
            continue;
          }

          throw new Error(
            `Fit Finder eval request failed with status ${response.status}: ${responseText.slice(0, 500)}`
          );
        }

        const data = await response.json();

        return {
          output: JSON.stringify(data.analysis || {}),
        };
      } catch (error) {
        lastError = error;
        if (attempt < this.maxRetries) {
          await this.delay(750 * (attempt + 1));
          continue;
        }
      }
    }

    const detail =
      lastError?.cause?.message ||
      lastError?.message ||
      String(lastError);
    throw new Error(`Fit Finder eval transport failed after retries: ${detail}`);
  }
}

module.exports = FitFinderProvider;
