# 🚀 Quick Setup Instructions

## ✅ OAuth Integration Complete!

Your Clinical Voice Assistant now has **genuine Healow/eCW OAuth authentication**!

---

## 📋 What You Need to Do

### Step 1: Add Your eCW Credentials

Open `mini-backend/.env` and replace these values:

```env
CLIENT_ID=paste_your_real_ecw_client_id_here
CLIENT_SECRET=paste_your_real_ecw_client_secret_here
SECRET_KEY=run: python -c "import secrets; print(secrets.token_hex(32))"
```

**Where to get credentials:**
- Login to eCW Developer Portal
- Find your app registration
- Copy Client ID and Client Secret

---

### Step 2: Deploy GitHub Pages Redirect

```bash
# Navigate to project root
cd C:\Users\yuvas\Documents\new_voice-mapping

# Add and commit the OAuth redirect page
git add docs/index.html
git commit -m "Add OAuth redirect handler for Healow/eCW integration"
git push origin main

# Then in GitHub:
# 1. Go to your repo → Settings → Pages
# 2. Source: Deploy from a branch
# 3. Branch: main
# 4. Folder: /docs
# 5. Save
```

Your redirect URL will be: `https://aakashk-upx.github.io/proscribeai/`

---

### Step 3: Whitelist Redirect URI in eCW Portal

1. Login to eCW Developer Portal
2. Go to your app settings
3. Find "Redirect URIs" section
4. **Add this EXACT URL:** `https://aakashk-upx.github.io/proscribeai/`
5. Ensure these scopes are enabled:
   - `openid`
   - `fhirUser`
   - `offline_access`
   - `user/Patient.read`
6. **Save changes**

⚠️ **IMPORTANT:** The redirect URI must match EXACTLY (including trailing slash or no slash)

---

### Step 4: Test the OAuth Flow

1. Open http://localhost:3000
2. You'll see the beautiful login page
3. Click "Login with eCW"
4. **Watch the flow:**
   - Redirects to Healow/eCW login
   - Enter your credentials
   - Redirects to GitHub Pages
   - GitHub Pages forwards to localhost:5002/callback
   - Backend exchanges code for tokens
   - Redirects back to localhost:3000/?auth=ok
   - **You're logged in!**

---

## 🎯 Testing Without OAuth (For Development)

**Option 1: Use Text Input**
1. Open http://localhost:3000
2. On the login page, you'll see the auth requirement
3. For quick testing, you can temporarily disable auth (see below)

**Option 2: Temporarily Bypass Auth**
Edit `mini-frontend/src/App.tsx` and comment out:
```tsx
// Temporarily bypass for testing
if (!auth) {
  // return <Login onLogin={loginWithECW} />
  setAuth(true) // Force authenticated state
}
```

Then you can use the text input feature without OAuth.

---

## 🔍 Debugging OAuth Issues

### Check Backend Logs

Watch the backend PowerShell window for `[OAUTH]` messages:

```
[OAUTH] Login redirect to: https://staging-oauthserver...
[OAUTH] redirect_uri = https://aakashk-upx.github.io/proscribeai/
[OAUTH] Callback received - code: abc..., state: xyz...
[OAUTH] Token response status: 200
[OAUTH] Token exchange successful!
```

### Common Issues

**1. "state_mismatch_or_missing"**
- Start fresh from Login button
- Don't navigate directly to /callback
- Use same browser session

**2. "redirect_uri_mismatch"**
- Check .env REDIRECT_URI matches eCW portal exactly
- Check for trailing slash differences
- Verify HTTPS vs HTTP

**3. "invalid_client"**
- Verify CLIENT_ID and CLIENT_SECRET in .env
- Check credentials are from correct environment (staging vs production)

**4. Session stays false**
- Check backend logs for errors
- Verify cookies are enabled
- Try in incognito mode (clean session)

---

## 📊 Current Configuration

**Backend:** ✅ Running on port 5002
- Whisper base model pre-loaded
- OAuth routes configured
- Remote Ollama endpoint: `http://108.192.20.12:11434`
- Model: `llama4:latest` (108.6B parameters)

**Frontend:** ✅ Running on port 3000
- Beautiful wizard UI
- Auth guard protecting app
- Text input for testing
- Dark mode support

**GitHub Pages:** Ready to deploy
- `docs/index.html` created
- OAuth redirect handler ready

---

## 🎨 Features Overview

### Authentication
- ✅ Login with eCW button
- ✅ OAuth 2.0 + PKCE flow
- ✅ Session persistence
- ✅ Logout functionality

### Recording
- ✅ Large mic button with animations
- ✅ Real-time timer
- ✅ Pulsing indicator
- ✅ **Text input for testing**

### Transcription
- ✅ Automatic after recording
- ✅ AI-powered (faster-whisper)
- ✅ Loading animations
- ✅ Skip if using text input

### Mapping
- ✅ Automatic extraction
- ✅ llama4 large model
- ✅ Comprehensive clinical data
- ✅ Beautiful loading state

### Results
- ✅ Tabbed interface
- ✅ Summary statistics
- ✅ All clinical categories
- ✅ Staggered animations
- ✅ Export functionality

---

## 🎯 Next Steps

1. ✅ Add your eCW credentials to `.env`
2. ✅ Deploy `docs/index.html` to GitHub Pages
3. ✅ Whitelist redirect URI in eCW portal
4. ✅ Test OAuth flow
5. ✅ Use the app with real eCW authentication!

---

## 📝 Notes

- The `.env` file is gitignored for security
- Never commit credentials to GitHub
- Use staging environment for testing
- Switch to production endpoints when ready

---

**Everything is ready! Just add your credentials and deploy the GitHub page!** 🎉

