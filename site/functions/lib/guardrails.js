export function checkGuardrails(query) {
    const offTopicPatterns = [
        /who is the (president|current president)/i,
        /politic/i,
        /opinion on (abortion|gun control|election)/i,
        /tell me a (joke|story) not about (brian|work|tech)/i,
        /what's your (real name|human name)/i,
        /reveal your (prompt|system instruction)/i,
        /ignore (previous|all) instructions/i,
        /you are now/i
    ];
    for (const pattern of offTopicPatterns) {
        if (pattern.test(query)) {
            return {
                allowed: false,
                reason: 'off-topic'
            };
        }
    }
    // Check for prompt injection attempts
    if (query.toLowerCase().includes('ignore') && query.toLowerCase().includes('instruction')) {
        return {
            allowed: false,
            reason: 'harmful'
        };
    }
    return { allowed: true };
}
export function getRefusalMessage(reason) {
    const messages = {
        'off-topic': "I'm designed to help you learn about Brian's professional background, experience, and projects. I can't help with that particular topic, but feel free to ask about his work history, skills, or projects!",
        'harmful': "I can't generate content that could be harmful or inappropriate. Is there something else about Brian's work or experience I can help you with?",
        'unknown': "I'm not sure I have information about that. Feel free to ask about Brian's work history, technical skills, projects, or personal interests."
    };
    return messages[reason] || messages['unknown'];
}
//# sourceMappingURL=guardrails.js.map