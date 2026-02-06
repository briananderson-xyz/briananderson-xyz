# Deployment Checklist

Use this checklist to deploy your AI chatbot to production.

## ✅ Pre-Deployment (Already Done)

- [x] Firebase project created (`briananderson-xyz-ai`)
- [x] Firebase SDK installed
- [x] Cloud Functions structure created
- [x] Gemini SDK installed (`@google/generative-ai`)
- [x] All UI components built and tested
- [x] Mock responses working in development
- [x] Keyboard shortcuts implemented
- [x] PostHog analytics integrated

## 🔑 Step 1: Get Gemini API Key

Follow the detailed guide in `GEMINI_API_SETUP.md`, but here's the quick version:

1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Select your Firebase project or create new
4. Copy the API key (starts with `AIza...`)

**Free Tier Limits:**
- 15 requests per minute
- 1,500 requests per day
- Perfect for your use case!

## 🔧 Step 2: Configure Firebase

### Login to Firebase

```bash
firebase login
```

### Set the API Key as a Secret

```bash
firebase functions:secrets:set GEMINI_API_KEY
# Paste your API key when prompted
```

### Set Site URL (Optional)

```bash
firebase functions:config:set site.url="https://briananderson.xyz"
```

## 📦 Step 3: Build and Deploy Functions

### Build Functions

```bash
cd site/functions
pnpm run build
```

### Deploy to Firebase

```bash
# From project root
firebase deploy --only functions
```

This will output URLs like:
- `https://us-central1-briananderson-xyz-ai.cloudfunctions.net/chat`
- `https://us-central1-briananderson-xyz-ai.cloudfunctions.net/fitFinder`

## 🌐 Step 4: Update Production API Routes

Update `site/src/routes/api/chat/+server.ts`:

```typescript
const functionUrl = `https://us-central1-briananderson-xyz-ai.cloudfunctions.net/chat`;
```

Update `site/src/routes/api/fit-finder/+server.ts`:

```typescript
const functionUrl = `https://us-central1-briananderson-xyz-ai.cloudfunctions.net/fitFinder`;
```

## 🚀 Step 5: Deploy Static Site

### Build the Site

```bash
cd site
pnpm run build
```

### Deploy to Firebase Hosting (or your preferred host)

```bash
firebase deploy --only hosting
```

Or deploy to your existing hosting (GCS + Cloudflare):

```bash
# Upload build folder to GCS bucket
gsutil -m rsync -r -d site/build gs://your-bucket-name
```

## ✅ Step 6: Test in Production

1. Visit your live site
2. Press **Cmd/Ctrl+I** to open chatbot
3. Send a test message
4. Verify you get a real AI response (not mock)
5. Press **Cmd/Ctrl+F** to test Fit Finder
6. Paste a job description and verify analysis

## 📊 Step 7: Monitor

### Check Function Logs

```bash
firebase functions:log
```

Or in console: https://console.firebase.google.com/project/briananderson-xyz-ai/functions

### Monitor API Usage

- Google AI Studio: https://aistudio.google.com/app/apikey
- Check your quota usage

### PostHog Analytics

- Dashboard: https://app.posthog.com
- Track: chat sessions, fit finder usage, keyboard shortcuts

## 🐛 Troubleshooting

### Functions Not Working

```bash
# Check deployment status
firebase functions:list

# View logs
firebase functions:log --only chat

# Test function directly
curl -X POST https://us-central1-briananderson-xyz-ai.cloudfunctions.net/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}'
```

### API Key Issues

```bash
# Verify secret is set
firebase functions:secrets:access GEMINI_API_KEY

# Re-deploy if needed
firebase deploy --only functions --force
```

### CORS Errors

- Check that `corsHeaders` are set in function responses
- Verify `cors: true` in function config
- Check browser console for specific error

## 💰 Cost Monitoring

### Set Up Billing Alerts

1. Go to https://console.cloud.google.com/billing
2. Click "Budgets & alerts"
3. Create alert for $5/month (way more than you'll use)

### Expected Costs

With free tiers:
- **Gemini API**: $0 (under 1,500 requests/day)
- **Firebase Functions**: $0 (under 2M invocations/month)
- **Firebase Hosting**: $0 (under 10GB storage, 360MB/day transfer)

**Total**: $0/month for moderate traffic! 🎉

## 🎯 Optional Enhancements

After deployment, consider:

- [ ] Add streaming responses for better UX
- [ ] Implement caching for common queries
- [ ] Add Firebase App Check for security
- [ ] Create custom PostHog dashboard
- [ ] Write Playwright tests
- [ ] Add voice input to chatbot
- [ ] Enable PDF upload for Fit Finder

## 📝 Environment Variables Summary

### Firebase Functions Secrets

```bash
GEMINI_API_KEY=<your-api-key>
SITE_URL=https://briananderson.xyz
```

### SvelteKit Environment Variables

Already in `site/.env.local`:

```bash
PUBLIC_FIREBASE_API_KEY=AIzaSyDNMWAulnvVZu3OXZITdyFW9oXyommrXX4
PUBLIC_FIREBASE_PROJECT_ID=briananderson-xyz-ai
# ... other Firebase config
PUBLIC_POSTHOG_KEY=<your-posthog-key>
```

## 🎉 Success Criteria

Your deployment is successful when:

- ✅ Chatbot responds with real AI (not mock)
- ✅ Fit Finder analyzes job descriptions accurately
- ✅ All keyboard shortcuts work
- ✅ Hiring manager banner appears after 30 seconds
- ✅ No console errors
- ✅ PostHog tracking events
- ✅ Function logs show successful requests
- ✅ API usage within free tier limits

## 📞 Support

If you need help:

1. Check `GEMINI_API_SETUP.md` for detailed API setup
2. Review Firebase Functions logs
3. Test functions directly with curl
4. Check Google Cloud Console for API errors
5. Review PostHog for user behavior issues

---

**Ready to deploy?** Start with Step 1! 🚀
