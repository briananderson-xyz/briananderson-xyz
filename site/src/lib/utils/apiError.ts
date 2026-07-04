/**
 * Maps an AI API error response to a friendly, user-facing message.
 *
 * The edge worker and the Cloud Run handlers return structured error bodies
 * with a `code` for expected states, so the UI can degrade gracefully instead
 * of showing a generic failure:
 *   - 429 / code "rate_limited"  -> the caller hit the per-IP rate limit
 *   - 503 / code "ai_disabled"   -> AI features are turned off (kill switch /
 *                                   budget cap)
 */
export interface ApiErrorBody {
  code?: string;
  error?: string;
  details?: string;
}

export interface ApiErrorInfo {
  message: string;
  code?: string;
}

export function describeApiError(status: number, body: ApiErrorBody | null | undefined): ApiErrorInfo {
  const code = body?.code;
  const serverMessage = body?.details || body?.error;

  if (status === 429 || code === 'rate_limited') {
    return {
      code: 'rate_limited',
      message: "You're sending requests a bit too quickly. Please wait a moment and try again.",
    };
  }

  if (code === 'ai_disabled') {
    return {
      code: 'ai_disabled',
      message: 'AI features are temporarily unavailable. Please check back soon.',
    };
  }

  if (status === 503) {
    return {
      code,
      message: serverMessage || 'The AI service is temporarily unavailable. Please try again later.',
    };
  }

  return {
    code,
    message: serverMessage || 'Something went wrong. Please try again.',
  };
}
