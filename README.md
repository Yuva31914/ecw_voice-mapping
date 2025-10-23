# Clinical Voice Assistant

AI-Powered Medical Transcription & Clinical Data Mapping with Healow/eCW OAuth Integration

---

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- eCW/Healow Developer Account
- Ollama server (or use remote endpoint)

### Installation

**1. Backend Setup:**
```bash
cd mini-backend
pip install -r requirements.txt

# Create and configure .env (see OAUTH_SETUP.md)
cp .env.example .env
# Edit .env with your credentials

python app.py
```

**2. Frontend Setup:**
```bash
cd mini-frontend
npm install
npm run dev
```

**3. Access:**
- Frontend: http://localhost:3000
- Backend: http://127.0.0.1:5002

---

## ✨ Features

### 🎤 Voice Recording
- Professional recorder UI with real-time timer
- Pulsing recording indicator
- Audio playback
- **Or paste text directly for testing**

### 📝 AI Transcription
- Powered by faster-whisper (base model)
- Automatic transcription after recording
- Graceful fallback if model unavailable
- Pre-loaded model for fast processing

### 🔮 Clinical Data Mapping
- Uses **llama4:latest** (108.6B parameters)
- Remote Ollama endpoint: `http://108.192.20.12:11434`
- Extracts structured medical data:
  - Diagnoses with severity
  - Medications with status
  - Allergies
  - Lab results
  - Procedures
  - Follow-up tasks

### 🎨 Beautiful UI
- Wizard-style step-by-step flow
- Professional animations and transitions
- Dark mode support
- Responsive design
- Print-friendly export

### 🔐 Security
- Healow/eCW OAuth 2.0 authentication
- PKCE for enhanced security
- HTTP Basic Auth for token exchange
- Secure session cookies
- No credentials in frontend

---

## 🎯 User Flow

### Without OAuth (Testing)
1. **Record** - Click mic or paste text
2. **Auto-transcribe** - AI converts to text
3. **Auto-map** - AI extracts clinical data
4. **Review results** - See structured data in tabs

### With OAuth (Production)
1. **Login** - Click "Login with eCW"
2. **Authenticate** - Use your Healow credentials
3. **Authorized** - Access full app
4. **Use app** - Record → Transcribe → Map → Review
5. **Logout** - Top-right logout button

---

## 📁 Project Structure

```
new_voice-mapping/
├── mini-backend/
│   ├── .env                 # OAuth credentials (gitignored!)
│   ├── .gitignore
│   ├── requirements.txt     # Python dependencies
│   └── app.py              # Flask server + OAuth + AI
├── mini-frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/         # shadcn-style components
│   │   │   ├── AppHeader.tsx
│   │   │   └── Login.tsx   # OAuth login page
│   │   ├── lib/
│   │   │   └── utils.ts
│   │   ├── api.ts          # Session API
│   │   ├── App.tsx         # Auth guard
│   │   ├── MainApp.tsx     # Main application
│   │   ├── main.tsx
│   │   └── index.css       # Tailwind + theme
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── docs/
│   └── index.html          # GitHub Pages OAuth redirect
├── OAUTH_SETUP.md          # Detailed OAuth setup guide
└── README.md               # This file
```

---

## 🛠 Technology Stack

**Backend:**
- Flask (Python web framework)
- faster-whisper (AI transcription)
- Ollama llama4 (clinical data extraction)
- Flask-CORS (cross-origin)
- python-dotenv (environment variables)

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Radix UI (accessible components)
- lucide-react (icons)

**OAuth:**
- OAuth 2.0 + PKCE
- HTTP Basic Auth
- Secure session cookies
- GitHub Pages redirect handler

---

## 🔑 Environment Variables

See `mini-backend/.env` for full list:

Required for OAuth:
- `CLIENT_ID` - eCW client ID
- `CLIENT_SECRET` - eCW client secret  
- `REDIRECT_URI` - GitHub Pages URL
- `SECRET_KEY` - Flask session secret

Optional:
- `WHISPER_MODEL` - Whisper model size (default: base)
- `WHISPER_COMPUTE` - Compute type (default: int8)

---

## 📊 API Endpoints

### Public Endpoints
- `GET /health` - Health check
- `GET /login` - Start OAuth flow
- `GET /callback` - OAuth callback handler

### Authenticated Endpoints  
- `POST /transcribe` - Upload audio, get transcript
- `POST /extract` - Submit transcript, get structured data
- `GET /session` - Check auth status
- `POST /logout` - Clear session

---

## 🎨 UI Features

- ✅ Step-by-step wizard flow
- ✅ Automatic progression
- ✅ Beautiful animations (fade, slide, pulse, bounce)
- ✅ Dark mode toggle
- ✅ Progress indicator
- ✅ Professional medical design
- ✅ Responsive layout
- ✅ Text input for testing
- ✅ Print-friendly export

---

## 📖 Documentation

- `OAUTH_SETUP.md` - Complete OAuth setup guide
- `mini-backend/.env.example` - Environment template
- Inline code comments

---

## 🆘 Support

Check the backend PowerShell window for detailed `[OAUTH]` logs during authentication flow.

---

## 📄 License

Internal use only - Clinical data processing application

---

Built with ❤️ for medical professionals

