class FitFinderProvider {
  constructor(options) {
    this.providerId = options.id || "fit-finder-api";
    this.config = options.config || {};
    this.baseUrl = process.env.AI_EVAL_BASE_URL || this.config.baseUrl || "https://api.briananderson.xyz";
  }

  id() {
    return this.providerId;
  }

  async callApi(prompt, context) {
    const response = await fetch(`${this.baseUrl}/fit-finder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jobDescription: prompt,
        variant: context?.vars?.variant || "leader",
      }),
    });

    if (!response.ok) {
      throw new Error(`Fit Finder eval request failed with status ${response.status}`);
    }

    const data = await response.json();

    return {
      output: JSON.stringify(data.analysis || {}),
    };
  }
}

module.exports = FitFinderProvider;
