# Clinical Voice Assistant - Deployment Guide

## 🚀 Complete Deployment Setup

This guide will help you deploy your Clinical Voice Assistant with:
- **Frontend**: Hosted on Vercel (public access)
- **Backend**: Running locally with ngrok tunnel (public access)
- **OAuth**: eCW/Healow integration via GitHub Pages

---

## 📋 Prerequisites

1. **GitHub Account** (for repository hosting)
2. **Vercel Account** (for frontend hosting)
3. **ngrok Account** (for backend tunneling)
4. **eCW/Healow Developer Account** (for OAuth credentials)

---

## 🔧 Step-by-Step Deployment

### Step 1: Set Up ngrok for Backend Access

1. **Sign up at [ngrok.com](https://ngrok.com)**
2. **Install ngrok agent:**
   ```bash
   # Download from ngrok.com or use package manager
   # Windows: choco install ngrok
   # macOS: brew install ngrok
   ```

3. **Get your authtoken from ngrok dashboard**
4. **Configure ngrok:**
   ```bash
   ngrok config add-authtoken YOUR_AUTHTOKEN
   ```

5. **Claim a free static domain:**
   - Go to ngrok dashboard → Cloud Edge → Domains
   - Claim a free domain (e.g., `my-clinical-app.ngrok-free.app`)

6. **Start ngrok tunnel:**
   ```bash
   ngrok http --domain=my-clinical-app.ngrok-free.app 5002
   ```
   **Keep this terminal running!**

### Step 2: Update OAuth Configuration

1. **Update your eCW app settings:**
   - Redirect URI: `https://aakashk-upx.github.io/proscribeai/`
   - This should already be configured

2. **Update GitHub Pages redirect (already done):**
   - File: `docs/index.html`
   - Now points to: `https://my-clinical-app.ngrok-free.app/callback`

### Step 3: Deploy Frontend to Vercel

1. **Sign up at [vercel.com](https://vercel.com)**
2. **Connect your GitHub account**
3. **Create new project:**
   - Import your GitHub repository
   - Framework: Vite
   - Root Directory: `mini-frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Configure environment variables:**
   - In Vercel dashboard → Project Settings → Environment Variables
   - Add: `VITE_API_BASE_URL` = `https://my-clinical-app.ngrok-free.app`

5. **Deploy!**
   - Vercel will build and deploy your app
   - You'll get a URL like: `https://clinical-voice-app.vercel.app`

### Step 4: Update Backend CORS (Already Done)

The backend CORS has been updated to allow your Vercel frontend:
```python
CORS(app, origins=[
    "http://localhost:3000", 
    "http://127.0.0.1:3000", 
    "https://clinical-voice-app.vercel.app",
    "https://clinical-voice-assistant.vercel.app"
], ...)
```

### Step 5: Test the Complete Flow

1. **Start your local backend:**
   ```bash
   cd mini-backend
   python app.py
   ```

2. **Start ngrok tunnel:**
   ```bash
   ngrok http --domain=my-clinical-app.ngrok-free.app 5002
   ```

3. **Visit your Vercel app:**
   - Go to: `https://clinical-voice-app.vercel.app`
   - Click "Login with eCW"
   - Complete OAuth flow
   - Test voice recording and transcription

---

## 🔄 Development vs Production

### Development (Local)
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5002`
- Environment: `.env.development`

### Production (Deployed)
- Frontend: `https://clinical-voice-app.vercel.app`
- Backend: `https://my-clinical-app.ngrok-free.app`
- Environment: `.env.production`

---

## 🛠️ Maintenance

### Daily Operations
1. **Start ngrok tunnel** (required for backend access)
2. **Start local backend** (required for API)
3. **Vercel frontend** (automatically available)

### Updates
1. **Frontend changes**: Push to GitHub → Vercel auto-deploys
2. **Backend changes**: Restart local backend
3. **OAuth changes**: Update GitHub Pages if needed

---

## 🔍 Troubleshooting

### Common Issues

1. **"Connection refused" errors:**
   - Check if ngrok tunnel is running
   - Verify backend is running on port 5002

2. **CORS errors:**
   - Check if Vercel URL is in backend CORS origins
   - Restart backend after CORS changes

3. **OAuth redirect issues:**
   - Verify GitHub Pages is updated
   - Check eCW redirect URI configuration

4. **Environment variable issues:**
   - Check Vercel environment variables
   - Verify `.env.production` file

### Debug Commands

```bash
# Check backend health
curl https://my-clinical-app.ngrok-free.app/health

# Check session status
curl https://my-clinical-app.ngrok-free.app/session

# Check OAuth configuration
curl https://my-clinical-app.ngrok-free.app/debug/authorize-url
```

---

## 📊 System Architecture

```
User Browser
    ↓
Vercel Frontend (https://clinical-voice-app.vercel.app)
    ↓
ngrok Tunnel (https://my-clinical-app.ngrok-free.app)
    ↓
Local Backend (localhost:5002)
    ↓
AI Services (Whisper + Ollama)
```

---

## ✅ Success Checklist

- [ ] ngrok tunnel running and accessible
- [ ] Local backend running on port 5002
- [ ] Vercel frontend deployed and accessible
- [ ] OAuth flow working end-to-end
- [ ] Voice recording and transcription working
- [ ] Clinical data extraction working
- [ ] CORS configured correctly
- [ ] Environment variables set

---

## 🎉 You're Live!

Your Clinical Voice Assistant is now publicly accessible at:
**https://clinical-voice-app.vercel.app**

Anyone can access it, authenticate with eCW, and use the voice mapping features!
