class ChatProvider {
  constructor(options) {
    this.providerId = options.id || "chat-api";
    this.config = options.config || {};
    this.baseUrl = process.env.AI_EVAL_BASE_URL || this.config.baseUrl || "https://api.briananderson.xyz";
  }

  id() {
    return this.providerId;
  }

  async callApi(prompt, context) {
    const response = await fetch(`${this.baseUrl}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: prompt,
        history: context?.vars?.history || [],
      }),
    });

    if (!response.ok) {
      throw new Error(`Chat eval request failed with status ${response.status}`);
    }

    const data = await response.json();

    return {
      output: data.response || "",
    };
  }
}

module.exports = ChatProvider;
