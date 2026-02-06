# AI Integration - Final Steps (Firebase AI Logic)

Follow these steps to complete the Firebase AI Logic integration and go live.

**Why Firebase AI Logic?**
- ✅ Built into Firebase - no separate API key needed
- ✅ Automatic RAG with URL context
- ✅ Simpler setup than direct Gemini API
- ✅ Same free tier limits (1,500 requests/day)
- ✅ Better integration with Firebase ecosystem

---

## ✅ Step 1: Enable Firebase AI Logic (3 minutes)

### Open Firebase Console
```
https://console.firebase.google.com/project/briananderson-xyz-ai
```

### Navigate to AI Logic
1. In the left sidebar, find **"Build"** section
2. Click **"AI Logic"** (or search for it)
3. Click **"Get Started"**

### Enable Required APIs
Firebase will automatically enable:
- Vertex AI API
- Generative Language API
- Cloud Functions API

Just click **"Enable"** when prompted.

### Select Model
- Choose **Gemini 2.0 Flash** (recommended)
- Free tier: 1,500 requests/day
- Perfect for your use case!

---

## ✅ Step 2: Enable Billing (Required but Free!)

### Why Billing is Required
- Firebase AI Logic requires a billing account
- **BUT** you stay in the free tier!
- You won't be charged unless you exceed limits

### Enable Billing
1. Go to: https://console.cloud.google.com/billing
2. Click **"Link a billing account"**
3. Add a credit card (won't be charged in free tier)
4. Set up billing alerts for $5/month (optional but recommended)

### Free Tier Limits
- ✅ 1,500 Vertex AI requests/day
- ✅ 2M Cloud Functions invocations/month
- ✅ 10GB Firebase Hosting storage

**You'll stay at $0/month with moderate traffic!**

---

## ✅ Step 3: Build Functions (2 minutes)

### Navigate to Functions Directory
```bash
cd site/functions
```

### Install Dependencies
```bash
pnpm install
```

### Build TypeScript
```bash
pnpm run build
```

This compiles your TypeScript functions to JavaScript in the `lib/` folder.

### Verify Build
```bash
dir lib
```

You should see `index.js`, `systemPrompt.js`, `guardrails.js`

---

## ✅ Step 4: Deploy Functions (3 minutes)

### Deploy to Firebase
```bash
cd ../..
firebase deploy --only functions
```

This will:
1. Upload your functions to Firebase
2. Configure them with Vertex AI
3. Provide URLs for your endpoints

### Note the URLs
After deployment, you'll see URLs like:
```
✔  functions[us-central1-chat]: Successful create operation.
Function URL: https://us-central1-briananderson-xyz-ai.cloudfunctions.net/chat

✔  functions[us-central1-fitFinder]: Successful create operation.
Function URL: https://us-central1-briananderson-xyz-ai.cloudfunctions.net/fitFinder
```

**Copy these URLs!** You'll need them in the next step.

---

## ✅ Step 5: Update API Routes (2 minutes)

### Update Chat API Route

Edit `site/src/routes/api/chat/+server.ts`:

Find this line:
```typescript
const functionUrl = `https://us-central1-briananderson-xyz-ai.cloudfunctions.net/chat`;
```

Replace with your actual deployed URL (should be the same, but verify).

### Update Fit Finder API Route

Edit `site/src/routes/api/fit-finder/+server.ts`:

Find this line:
```typescript
const functionUrl = `https://us-central1-briananderson-xyz-ai.cloudfunctions.net/fitFinder`;
```

Replace with your actual deployed URL.

### Remove Dev Check (Optional)

In both files, you can change:
```typescript
const isDev = import.meta.env.DEV;

if (isDev) {
  // Mock response...
}
```

To always use production:
```typescript
const isDev = false; // Always use real AI
```

Or leave it as-is to keep mock responses in development.

---

## ✅ Step 6: Test Locally (2 minutes)

### Start Dev Server (if not running)
```bash
cd site
pnpm dev
```

### Test in Browser
1. Open http://localhost:5173
2. Click on terminal input (after `guest@briananderson:~$`)
3. Type `chat` and press Enter
4. Type: "Tell me about your AWS experience"
5. You should get a **real AI response** (not mock)!

### Test Fit Finder
1. Type `fit-finder` in terminal input and press Enter
2. Paste a job description
3. Click "Analyze Fit"
4. You should get a **real AI analysis**!

### Check Console
- Open browser DevTools (F12)
- Look for any errors
- Verify `mock: false` in API responses

---

## ✅ Step 7: Deploy Site (3 minutes)

### Build the Site
```bash
cd site
pnpm run build
```

### Option A: Deploy to Firebase Hosting
```bash
firebase deploy --only hosting
```

### Option B: Deploy to GCS (Your Current Setup)
```bash
# Upload build folder to your GCS bucket
gsutil -m rsync -r -d build gs://your-bucket-name
```

### Verify Deployment
Visit your live site and test:
- ✅ Terminal input autocomplete works
- ✅ Chatbot works (type `chat`)
- ✅ Fit Finder works (type `fit-finder`)
- ✅ Keyboard shortcuts work (Cmd/Ctrl+I, Cmd/Ctrl+F)
- ✅ No console errors

---

## ✅ Step 8: Monitor & Verify (Ongoing)

### Check Function Logs
```bash
firebase functions:log
```

Or visit: https://console.firebase.google.com/project/briananderson-xyz-ai/functions

### Monitor Vertex AI Usage
Visit: https://console.cloud.google.com/vertex-ai/generative

Check your quota usage:
- Requests per day
- Should stay well within free tier!

### PostHog Analytics
Visit: https://app.posthog.com

Track:
- Chat sessions
- Fit Finder usage
- Terminal input usage
- Keyboard shortcut usage
- Conversion rates

---

## 🎉 Success Checklist

Your integration is complete when:

- [x] Firebase AI Logic enabled
- [x] Billing account linked (but staying in free tier)
- [x] Functions built successfully
- [x] Functions deployed to Firebase
- [x] API routes updated with function URLs
- [x] Terminal input autocomplete works
- [x] Chatbot responds with real AI (not mock)
- [x] Fit Finder analyzes with real AI (not mock)
- [x] No console errors
- [x] Site deployed to production
- [x] PostHog tracking events
- [x] Function logs show successful requests
- [x] API usage within free tier

---

## 🐛 Troubleshooting

### "Vertex AI API not enabled" Error

**Fix:**
1. Go to: https://console.cloud.google.com/apis/library/aiplatform.googleapis.com
2. Click "Enable"
3. Redeploy functions: `firebase deploy --only functions --force`

### "Billing account required" Error

**Fix:**
1. Go to: https://console.cloud.google.com/billing
2. Link a billing account
3. You won't be charged in free tier!

### Still Seeing Mock Responses

**Check:**
1. Function logs: `firebase functions:log`
2. Browser console for errors
3. Verify `isDev` check in API routes
4. Ensure functions deployed successfully

**Fix:**
```bash
# Redeploy functions
firebase deploy --only functions --force
```

### CORS Errors

**Check:**
- Function responses include `corsHeaders`
- Function config has `cors: true`

**Fix:**
Already configured in your functions!

### "Quota exceeded" Error

**Check:**
- Visit https://console.cloud.google.com/vertex-ai/generative
- View your usage

**Fix:**
- Wait for quota to reset (per day)
- Or upgrade to paid tier (very cheap: ~$0.0004 per chat)

### Functions Taking Too Long

**Check:**
- Cold start (first request after idle)
- Network latency

**Fix:**
- Normal for first request
- Subsequent requests will be faster
- Consider keeping functions warm (optional)

---

## 💰 Cost Monitoring

### Set Up Billing Alert

1. Go to: https://console.cloud.google.com/billing
2. Click "Budgets & alerts"
3. Create alert for $5/month
4. You'll get email if you approach this (unlikely!)

### Expected Monthly Cost

With free tiers:
- **Vertex AI (Gemini)**: $0 (under 1,500 requests/day)
- **Firebase Functions**: $0 (under 2M invocations/month)
- **Firebase Hosting**: $0 (under 10GB storage)

**Total: $0/month** 🎉

Even if you exceed free tier:
- **Vertex AI**: ~$0.0004 per chat
- **1,000 chats/month**: ~$0.40
- **Still incredibly cheap!**

---

## 📞 Need Help?

### Documentation
- **Firebase AI Logic**: https://firebase.google.com/docs/vertex-ai
- **Vertex AI**: https://cloud.google.com/vertex-ai/docs
- **Firebase Functions**: https://firebase.google.com/docs/functions

### Check Logs
```bash
# Function logs
firebase functions:log

# Specific function
firebase functions:log --only chat

# Follow logs in real-time
firebase functions:log --follow
```

### Test Functions Directly
```bash
# Test chat endpoint
curl -X POST https://us-central1-briananderson-xyz-ai.cloudfunctions.net/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello, tell me about Brian"}'
```

---

## 🎯 What's Next?

After successful integration, consider:

### Optional Enhancements
- [ ] Add streaming responses for better UX
- [ ] Implement response caching
- [ ] Add Firebase App Check for security
- [ ] Create custom PostHog dashboard
- [ ] Write Playwright tests
- [ ] Add voice input to chatbot
- [ ] Enable PDF upload for Fit Finder

### Monitoring
- [ ] Set up uptime monitoring
- [ ] Create alerts for errors
- [ ] Track conversion funnels
- [ ] A/B test different prompts

---

## ✅ You're Done!

Your AI-powered portfolio is now live with:
- ✅ Real AI chatbot powered by Firebase AI Logic
- ✅ Intelligent job fit analyzer
- ✅ Interactive terminal with autocomplete
- ✅ Keyboard-first navigation
- ✅ Visual feature discovery
- ✅ Professional terminal aesthetic
- ✅ Zero cost at moderate traffic

**Congratulations!** 🎉

Test it out and watch the analytics roll in!

### Visit Google AI Studio
```
https://aistudio.google.com/app/apikey
```

### Create API Key
1. Click **"Create API Key"** button
2. Select your Firebase project: `briananderson-xyz-ai`
   - Or create a new Google Cloud project
3. Copy the API key (starts with `AIza...`)
4. Save it somewhere safe temporarily

### Free Tier Limits
- ✅ 15 requests per minute (RPM)
- ✅ 1,500 requests per day (RPD)
- ✅ Perfect for your traffic!

---

## ✅ Step 2: Configure Firebase (3 minutes)

### Login to Firebase
```bash
firebase login
```

If you're not logged in, this will open a browser for authentication.

### Set API Key as Secret
```bash
firebase functions:secrets:set GEMINI_API_KEY
```

When prompted, paste your API key and press Enter.

### Verify Secret is Set
```bash
firebase functions:secrets:access GEMINI_API_KEY
```

You should see your API key (or an error if not set correctly).

---

## ✅ Step 3: Build Functions (2 minutes)

### Navigate to Functions Directory
```bash
cd site/functions
```

### Install Dependencies (if not already done)
```bash
pnpm install
```

### Build TypeScript
```bash
pnpm run build
```

This compiles your TypeScript functions to JavaScript in the `lib/` folder.

### Verify Build
```bash
dir lib
```

You should see `index.js`, `chat-with-gemini.js`, etc.

---

## ✅ Step 4: Deploy Functions (3 minutes)

### Deploy to Firebase
```bash
cd ../..
firebase deploy --only functions
```

This will:
1. Upload your functions to Firebase
2. Configure them with your secrets
3. Provide URLs for your endpoints

### Note the URLs
After deployment, you'll see URLs like:
```
✔  functions[us-central1-chat]: Successful create operation.
Function URL: https://us-central1-briananderson-xyz-ai.cloudfunctions.net/chat

✔  functions[us-central1-fitFinder]: Successful create operation.
Function URL: https://us-central1-briananderson-xyz-ai.cloudfunctions.net/fitFinder
```

**Copy these URLs!** You'll need them in the next step.

---

## ✅ Step 5: Update API Routes (2 minutes)

### Update Chat API Route

Edit `site/src/routes/api/chat/+server.ts`:

Find this line:
```typescript
const functionUrl = `https://us-central1-briananderson-xyz-ai.cloudfunctions.net/chat`;
```

Replace with your actual deployed URL (should be the same, but verify).

### Update Fit Finder API Route

Edit `site/src/routes/api/fit-finder/+server.ts`:

Find this line:
```typescript
const functionUrl = `https://us-central1-briananderson-xyz-ai.cloudfunctions.net/fitFinder`;
```

Replace with your actual deployed URL.

### Remove Dev Check (Optional)

In both files, you can change:
```typescript
const isDev = import.meta.env.DEV;

if (isDev) {
  // Mock response...
}
```

To always use production:
```typescript
const isDev = false; // Always use real API
```

Or leave it as-is to keep mock responses in development.

---

## ✅ Step 6: Test Locally (2 minutes)

### Start Dev Server (if not running)
```bash
cd site
pnpm dev
```

### Test in Browser
1. Open http://localhost:5173
2. Press **Cmd/Ctrl+I** to open chatbot
3. Type: "Tell me about your AWS experience"
4. You should get a **real AI response** (not mock)!

### Test Fit Finder
1. Press **Cmd/Ctrl+F**
2. Paste a job description
3. Click "Analyze Fit"
4. You should get a **real AI analysis**!

### Check Console
- Open browser DevTools (F12)
- Look for any errors
- Verify `mock: false` in API responses

---

## ✅ Step 7: Deploy Site (3 minutes)

### Build the Site
```bash
cd site
pnpm run build
```

### Option A: Deploy to Firebase Hosting
```bash
firebase deploy --only hosting
```

### Option B: Deploy to GCS (Your Current Setup)
```bash
# Upload build folder to your GCS bucket
gsutil -m rsync -r -d build gs://your-bucket-name
```

### Verify Deployment
Visit your live site and test:
- ✅ Chatbot works (Cmd/Ctrl+I)
- ✅ Fit Finder works (Cmd/Ctrl+F)
- ✅ Terminal input autocomplete works
- ✅ No console errors

---

## ✅ Step 8: Monitor & Verify (Ongoing)

### Check Function Logs
```bash
firebase functions:log
```

Or visit: https://console.firebase.google.com/project/briananderson-xyz-ai/functions

### Monitor API Usage
Visit: https://aistudio.google.com/app/apikey

Check your quota usage:
- Requests per minute
- Requests per day
- Should stay well within free tier!

### PostHog Analytics
Visit: https://app.posthog.com

Track:
- Chat sessions
- Fit Finder usage
- Keyboard shortcut usage
- Conversion rates

---

## 🎉 Success Checklist

Your integration is complete when:

- [x] Gemini API key obtained
- [x] Firebase secret configured
- [x] Functions built successfully
- [x] Functions deployed to Firebase
- [x] API routes updated with function URLs
- [x] Chatbot responds with real AI (not mock)
- [x] Fit Finder analyzes with real AI (not mock)
- [x] Terminal input autocomplete works
- [x] No console errors
- [x] Site deployed to production
- [x] PostHog tracking events
- [x] Function logs show successful requests
- [x] API usage within free tier

---

## 🐛 Troubleshooting

### "API key not valid" Error

**Check:**
```bash
firebase functions:secrets:access GEMINI_API_KEY
```

**Fix:**
```bash
firebase functions:secrets:set GEMINI_API_KEY
# Re-enter your API key
firebase deploy --only functions --force
```

### Still Seeing Mock Responses

**Check:**
1. Function logs: `firebase functions:log`
2. Browser console for errors
3. Verify `isDev` check in API routes
4. Ensure functions deployed successfully

**Fix:**
```bash
# Redeploy functions
firebase deploy --only functions --force
```

### CORS Errors

**Check:**
- Function responses include `corsHeaders`
- Function config has `cors: true`

**Fix:**
Already configured in your functions!

### "Quota exceeded" Error

**Check:**
- Visit https://aistudio.google.com/app/apikey
- View your usage

**Fix:**
- Wait for quota to reset (per minute/per day)
- Or upgrade to paid tier (very cheap)

### Functions Taking Too Long

**Check:**
- Cold start (first request after idle)
- Network latency

**Fix:**
- Normal for first request
- Subsequent requests will be faster
- Consider keeping functions warm (optional)

---

## 💰 Cost Monitoring

### Set Up Billing Alert

1. Go to: https://console.cloud.google.com/billing
2. Click "Budgets & alerts"
3. Create alert for $5/month
4. You'll get email if you approach this (unlikely!)

### Expected Monthly Cost

With free tiers:
- **Gemini API**: $0 (under 1,500 requests/day)
- **Firebase Functions**: $0 (under 2M invocations/month)
- **Firebase Hosting**: $0 (under 10GB storage)

**Total: $0/month** 🎉

Even if you exceed free tier:
- **Gemini**: ~$0.0004 per chat
- **1,000 chats/month**: ~$0.40
- **Still incredibly cheap!**

---

## 📞 Need Help?

### Documentation
- **Gemini API**: https://ai.google.dev/docs
- **Firebase Functions**: https://firebase.google.com/docs/functions
- **Your Setup Guide**: See `GEMINI_API_SETUP.md`

### Check Logs
```bash
# Function logs
firebase functions:log

# Specific function
firebase functions:log --only chat

# Follow logs in real-time
firebase functions:log --follow
```

### Test Functions Directly
```bash
# Test chat endpoint
curl -X POST https://us-central1-briananderson-xyz-ai.cloudfunctions.net/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello, tell me about Brian"}'
```

---

## 🎯 What's Next?

After successful integration, consider:

### Optional Enhancements
- [ ] Add streaming responses for better UX
- [ ] Implement response caching
- [ ] Add Firebase App Check for security
- [ ] Create custom PostHog dashboard
- [ ] Write Playwright tests
- [ ] Add voice input to chatbot
- [ ] Enable PDF upload for Fit Finder

### Monitoring
- [ ] Set up uptime monitoring
- [ ] Create alerts for errors
- [ ] Track conversion funnels
- [ ] A/B test different prompts

---

## ✅ You're Done!

Your AI-powered portfolio is now live with:
- ✅ Real AI chatbot powered by Gemini
- ✅ Intelligent job fit analyzer
- ✅ Interactive terminal with autocomplete
- ✅ Keyboard-first navigation
- ✅ Visual feature discovery
- ✅ Professional terminal aesthetic
- ✅ Zero cost at moderate traffic

**Congratulations!** 🎉

Test it out and watch the analytics roll in!
