# Gemini API Setup Guide

This guide will help you integrate Google's Gemini API with your Firebase Cloud Functions to power the AI chatbot.

## Prerequisites

- Firebase project already created (✅ Done: `briananderson-xyz-ai`)
- Firebase CLI installed (✅ Done via `pnpm add -D firebase-tools`)
- Google Cloud account with billing enabled

---

## Step 1: Get Your Gemini API Key

### Option A: Using Google AI Studio (Recommended - Free Tier)

1. **Go to Google AI Studio**
   - Visit: https://aistudio.google.com/app/apikey
   - Sign in with your Google account

2. **Create API Key**
   - Click "Create API Key"
   - Select your Firebase project (`briananderson-xyz-ai`) or create a new one
   - Copy the API key (starts with `AIza...`)

3. **Note the Free Tier Limits**
   - 15 requests per minute (RPM)
   - 1 million tokens per minute (TPM)
   - 1,500 requests per day (RPD)
   - Perfect for development and moderate production use!

### Option B: Using Google Cloud Console (For Production Scale)

1. **Enable the Generative Language API**
   - Go to: https://console.cloud.google.com/apis/library
   - Search for "Generative Language API"
   - Click "Enable"

2. **Create API Key**
   - Go to: https://console.cloud.google.com/apis/credentials
   - Click "Create Credentials" → "API Key"
   - Copy the API key
   - (Optional) Restrict the key to only "Generative Language API"

---

## Step 2: Add API Key to Firebase Functions

### Set Environment Variable

```bash
# Navigate to your project root
cd e:\dev\briananderson.xyz\sveltekit

# Set the Gemini API key as a Firebase secret
firebase functions:secrets:set GEMINI_API_KEY
# When prompted, paste your API key
```

### Alternative: Using .env file (Development Only)

Create `site/functions/.env`:

```bash
GEMINI_API_KEY=your_api_key_here
SITE_URL=https://briananderson.xyz
```

**⚠️ IMPORTANT:** Never commit `.env` files to git!

---

## Step 3: Update Cloud Functions Code

The functions are already set up to use the API key. Here's what needs to be updated in `site/functions/src/index.ts`:

### Add Gemini SDK

```bash
cd site/functions
pnpm add @google/generative-ai
```

### Update the Chat Function

Replace the mock response section in `site/functions/src/index.ts` with:

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);

// In the chat function:
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash-exp',
  systemInstruction: getSystemPrompt(SITE_URL)
});

// Build conversation history
const chatHistory = history.map(msg => ({
  role: msg.role === 'user' ? 'user' : 'model',
  parts: [{ text: msg.content }]
}));

// Generate response
const chat = model.startChat({
  history: chatHistory,
  generationConfig: {
    maxOutputTokens: 1000,
    temperature: 0.7,
  }
});

const result = await chat.sendMessage(message);
const response = result.response.text();

res.set(corsHeaders);
res.status(200).json({
  response,
  mock: false
});
```

---

## Step 4: Deploy Functions

### Login to Firebase

```bash
firebase login
```

### Deploy Functions

```bash
# From project root
firebase deploy --only functions
```

This will:
- Build your TypeScript functions
- Deploy to Firebase Cloud Functions
- Make them available at: `https://us-central1-briananderson-xyz-ai.cloudfunctions.net/`

---

## Step 5: Update Production API Routes

Update `site/src/routes/api/chat/+server.ts`:

```typescript
// Change isDev check to use environment variable
const isDev = import.meta.env.DEV;

// Update function URL to your deployed endpoint
const functionUrl = `https://us-central1-briananderson-xyz-ai.cloudfunctions.net/chat`;
```

Do the same for `site/src/routes/api/fit-finder/+server.ts`.

---

## Step 6: Test the Integration

### Test Locally with Emulator (Optional)

```bash
cd site/functions
pnpm run serve
```

This starts the Firebase emulator at `http://localhost:5001`

### Test in Production

1. Deploy your site: `pnpm run build && firebase deploy --only hosting`
2. Visit your site
3. Press `Cmd/Ctrl+I` to open chatbot
4. Send a message
5. Verify you get a real AI response (not mock)

---

## Step 7: Monitor Usage

### Check API Usage

- **Google AI Studio**: https://aistudio.google.com/app/apikey
  - View your API key usage and quotas

- **Google Cloud Console**: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/metrics
  - Detailed metrics and billing

### Firebase Functions Logs

```bash
firebase functions:log
```

Or view in console: https://console.firebase.google.com/project/briananderson-xyz-ai/functions

---

## Troubleshooting

### "API key not valid" Error

- Verify the API key is correct
- Check if the Generative Language API is enabled
- Ensure billing is enabled on your Google Cloud project

### "Quota exceeded" Error

- You've hit the free tier limits (15 RPM, 1,500 RPD)
- Wait for quota to reset (per minute/per day)
- Consider upgrading to paid tier if needed

### Functions Not Deploying

```bash
# Check Firebase project
firebase projects:list

# Ensure you're using the right project
firebase use briananderson-xyz-ai

# Try deploying with verbose logging
firebase deploy --only functions --debug
```

### CORS Errors

- Ensure `corsHeaders` are set in function responses
- Check that `cors: true` is in function config

---

## Cost Estimates

### Free Tier (Gemini 2.0 Flash)
- **Cost**: $0
- **Limits**: 15 RPM, 1,500 RPD
- **Good for**: Development, personal sites, low-traffic production

### Paid Tier (if you exceed free tier)
- **Input**: $0.075 per 1M tokens (~$0.000075 per request)
- **Output**: $0.30 per 1M tokens (~$0.0003 per response)
- **Typical chat**: ~$0.0004 per conversation
- **1,000 chats/month**: ~$0.40

**Firebase Functions Free Tier:**
- 2M invocations/month
- 400,000 GB-seconds/month
- 200,000 CPU-seconds/month

Your usage will likely stay in free tier unless you get significant traffic!

---

## Security Best Practices

1. **Never expose API keys in client-side code** ✅ (Using Cloud Functions)
2. **Use Firebase App Check** (Optional but recommended)
3. **Implement rate limiting** ✅ (Already in guardrails)
4. **Monitor usage regularly**
5. **Set up billing alerts** in Google Cloud Console

---

## Next Steps

Once Gemini is integrated:

1. Test thoroughly with various prompts
2. Monitor response quality and adjust system prompt if needed
3. Track analytics in PostHog
4. Consider adding streaming responses for better UX
5. Implement caching for common queries (optional)

---

## Quick Reference

**API Key Location**: Firebase Functions Secret `GEMINI_API_KEY`
**Model**: `gemini-2.0-flash-exp`
**Endpoint**: `https://us-central1-briananderson-xyz-ai.cloudfunctions.net/chat`
**Docs**: https://ai.google.dev/docs

---

## Need Help?

- Gemini API Docs: https://ai.google.dev/tutorials/node_quickstart
- Firebase Functions: https://firebase.google.com/docs/functions
- Community: https://stackoverflow.com/questions/tagged/google-gemini-api
