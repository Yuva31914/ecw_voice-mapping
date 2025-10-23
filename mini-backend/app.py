import os, io, tempfile, json, re, base64, hashlib, secrets, time
from flask import Flask, request, jsonify, session, redirect
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import requests as http_requests
from collections import OrderedDict

load_dotenv()

# Short-lived store for pending OAuth states in memory
# Maps state -> {"code_verifier": str, "ts": float}. Auto-pruned.
OAUTH_PENDING = OrderedDict()

def _pending_put(state: str, code_verifier: str):
    now = time.time()
    OAUTH_PENDING[state] = {"code_verifier": code_verifier, "ts": now}
    # Prune entries older than 10 minutes to avoid bloat
    cutoff = now - 600
    stale = [k for k, v in OAUTH_PENDING.items() if v["ts"] < cutoff]
    for k in stale:
        OAUTH_PENDING.pop(k, None)

def _pending_take(state: str):
    item = OAUTH_PENDING.pop(state, None)
    return item["code_verifier"] if item else None

app = Flask(__name__)

# OAuth Configuration - Direct values for now
CLIENT_ID     = "Vhc3_tvE5ZER8Or67MUoQodqY9Kt8sFmxYVLcGuFOeI"
CLIENT_SECRET = "1Dcoh-_7TAKN4EZYVrhwxISLwRP4jGzM012W5SkThOmHaVC5GUQqzTP2nKCx6-PN"
AUTH_URL      = "https://staging-oauthserver.ecwcloud.com/oauth/oauth2/authorize"
TOKEN_URL     = "https://staging-oauthserver.ecwcloud.com/oauth/oauth2/token"
FHIR_URL      = "https://staging-fhir.ecwcloud.com/fhir/r4/FFBJCD"
REDIRECT_URI  = "https://aakashk-upx.github.io/proscribeai/"
SCOPES        = "openid fhirUser offline_access user/Patient.read"
FRONTEND_URL  = "http://localhost:3000"

# Debug: Print loaded config
print(f"[CONFIG] CLIENT_ID loaded: {bool(CLIENT_ID)}")
print(f"[CONFIG] REDIRECT_URI: {REDIRECT_URI}")
print(f"[CONFIG] AUTH_URL: {AUTH_URL}")

# Flask Configuration
app.config.update(
    SECRET_KEY=os.getenv("SECRET_KEY", "dev-secret-change-in-production"),
    SESSION_COOKIE_NAME="app_session",
    SESSION_COOKIE_SAMESITE="Lax",  # Works with OAuth redirects
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SECURE=False,  # localhost (use True in production with HTTPS)
    PERMANENT_SESSION_LIFETIME=3600,
    MAX_CONTENT_LENGTH=100 * 1024 * 1024,  # 100MB
    SEND_FILE_MAX_AGE_DEFAULT=0,
)

CORS(app, origins=[
     "http://localhost:3000", 
     "http://127.0.0.1:3000", 
     "https://clinical-voice-app.vercel.app",
     "https://clinical-voice-assistant.vercel.app"
 ], 
     allow_headers=["Content-Type"], 
     methods=["GET", "POST", "OPTIONS"],
     max_age=3600,
     supports_credentials=True)

# Pre-load Whisper model to avoid timeout on first request
_whisper_model = None
def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        try:
            from faster_whisper import WhisperModel
            # Use base model by default for faster loading (2-3 minutes vs 10+ minutes for large-v3)
            # You can change to "large-v3" for better accuracy
            model_size_or_path = os.getenv("WHISPER_MODEL", "base")
            compute_type = os.getenv("WHISPER_COMPUTE", "int8")
            print(f"Loading Whisper model: {model_size_or_path} with compute_type: {compute_type}")
            _whisper_model = WhisperModel(model_size_or_path, compute_type=compute_type)
            print("Whisper model loaded successfully!")
        except Exception as e:
            print(f"Failed to load Whisper model: {e}")
            _whisper_model = None
    return _whisper_model

# OAuth Helper: PKCE
def _pkce_pair():
    verifier = base64.urlsafe_b64encode(os.urandom(32)).rstrip(b'=').decode()
    challenge = base64.urlsafe_b64encode(
        hashlib.sha256(verifier.encode()).digest()
    ).rstrip(b'=').decode()
    return verifier, challenge

# Health
@app.route("/health", methods=["GET"])
def health():
    return {"ok": True}

# Session status
@app.route("/session", methods=["GET"])
def session_status():
    return jsonify({"authenticated": bool(session.get("access_token"))})

# Debug endpoint to see session state
@app.route("/debug/session", methods=["GET"])
def debug_session():
    # Do NOT return secrets; just enough to diagnose flow
    return jsonify({
        "has_cookie": bool(request.cookies),
        "cookies": list(request.cookies.keys()),
        "oauth_state_in_session": bool(session.get("oauth_state")),
        "code_verifier_in_session": bool(session.get("code_verifier")),
        "pending_states_count": len(OAUTH_PENDING),
    })

# Debug endpoint to see the computed authorize URL
@app.route("/debug/authorize-url", methods=["GET"])
def debug_authorize_url():
    # Build a fresh URL for inspection (doesn't change session)
    ver, chal = _pkce_pair()
    fake_state = "DEBUG_" + secrets.token_urlsafe(6)
    
    params = {
        "response_type": "code",
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "scope": SCOPES,
        "state": fake_state,
        "code_challenge": chal,
        "code_challenge_method": "S256",
        "aud": FHIR_URL,
    }
    
    url = http_requests.Request("GET", AUTH_URL, params=params).prepare().url
    
    return jsonify({
        "authorize_url": url,
        "config": {
            "client_id": CLIENT_ID,
            "redirect_uri": REDIRECT_URI,
            "scopes": SCOPES,
            "aud": FHIR_URL,
            "auth_url": AUTH_URL,
        }
    })

# Login (redirect to Healow/eCW)
@app.route("/login", methods=["GET"])
def login():
    verifier, challenge = _pkce_pair()
    state = secrets.token_urlsafe(24)
    
    # Store in session
    session["code_verifier"] = verifier
    session["oauth_state"] = state
    
    # Also store in memory as fallback
    _pending_put(state, verifier)

    params = {
        "response_type": "code",
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "scope": SCOPES,
        "state": state,
        "code_challenge": challenge,
        "code_challenge_method": "S256",
        "aud": FHIR_URL,
    }
    
    url = http_requests.Request("GET", AUTH_URL, params=params).prepare().url
    print(f"[OAUTH] /login: set state = {state}")
    print(f"[OAUTH] /login: cookies going out? session cookie name = {app.config.get('SESSION_COOKIE_NAME')}")
    print(f"[OAUTH] Login redirect to: {AUTH_URL}")
    print(f"[OAUTH] redirect_uri = {REDIRECT_URI}")
    print(f"[OAUTH] /login authorize url = {url}")
    return redirect(url, code=302)

# OAuth callback
@app.route("/callback", methods=["GET"])
def callback():
    code = request.args.get("code")
    state = request.args.get("state")
    
    print(f"[OAUTH] /callback: got code = {code[:20] if code else None}..., state = {state}")
    print(f"[OAUTH] /callback: cookies present = {bool(request.cookies)}")
    print(f"[OAUTH] /callback: cookie names = {list(request.cookies.keys())}")
    
    if not code or not state:
        return jsonify({"error": "missing_code_or_state"}), 400
    
    # Try session first
    expected = session.get("oauth_state")
    code_verifier = session.get("code_verifier")
    
    print(f"[OAUTH] /callback: session oauth_state = {expected}")
    print(f"[OAUTH] /callback: session has code_verifier = {bool(code_verifier)}")
    
    if expected != state or not code_verifier:
        # Try fallback store if session is missing/mismatched
        alt_verifier = _pending_take(state)
        print(f"[OAUTH] /callback: session mismatch; fallback_verifier exists = {bool(alt_verifier)}")
        
        if not alt_verifier:
            return jsonify({
                "error": "state_mismatch_or_missing",
                "hint": "no_session_and_no_pending",
                "got_state": state,
                "expected_state": expected
            }), 400
        
        # Use fallback verifier
        code_verifier = alt_verifier
        # Re-seed session for later use
        session["oauth_state"] = state
        session["code_verifier"] = code_verifier
        print(f"[OAUTH] /callback: using fallback verifier and re-seeding session")

    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI,  # EXACT SAME as /login
        "code_verifier": code_verifier,  # PKCE (session or fallback)
    }
    
    print(f"[OAUTH] Exchanging code for token at {TOKEN_URL}")
    print(f"[OAUTH] Using redirect_uri: {REDIRECT_URI}")
    
    try:
        resp = http_requests.post(
            TOKEN_URL,
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            auth=(CLIENT_ID, CLIENT_SECRET),
            timeout=30
        )
        
        print(f"[OAUTH] Token response status: {resp.status_code}")
        
        if resp.status_code != 200:
            error_details = resp.text[:500]
            print(f"[OAUTH] Token exchange failed: {error_details}")
            return jsonify({"error": "token_exchange_failed", "details": error_details}), resp.status_code

        tok = resp.json()
        session["access_token"] = tok.get("access_token")
        session["refresh_token"] = tok.get("refresh_token")
        session["token_type"] = tok.get("token_type")
        session["expires_in"] = tok.get("expires_in")
        
        print(f"[OAUTH] Token exchange successful! Redirecting to {FRONTEND_URL}")
        
        dest = f"{FRONTEND_URL.rstrip('/')}/?auth=ok"
        return redirect(dest, code=302)
        
    except Exception as e:
        print(f"[OAUTH] Exception during token exchange: {e}")
        return jsonify({"error": "token_exchange_exception", "details": str(e)}), 500

# Logout
@app.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"ok": True})

# Transcribe endpoint
@app.route("/transcribe", methods=["POST"])
def transcribe():
    print("Transcribe request received")
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded (use field name 'file')."}), 400
    f = request.files["file"]
    if not f.filename:
        return jsonify({"error": "Empty filename."}), 400

    filename = secure_filename(f.filename)
    suffix = "." + (filename.split(".")[-1] if "." in filename else "webm")
    tmp_in = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    f.save(tmp_in.name)
    print(f"File saved: {tmp_in.name}, size: {os.path.getsize(tmp_in.name)} bytes")

    try:
        # Try real transcription
        try:
            model = get_whisper_model()
            if model is None:
                raise Exception("Whisper model not available")
            
            print(f"Transcribing file: {tmp_in.name}")
            segments, info = model.transcribe(tmp_in.name, beam_size=1)
            text = " ".join(s.text.strip() for s in segments if s.text).strip()
            if not text:
                text = "(empty)"
            print(f"Transcription result: {text}")
            return jsonify({"transcript": text})
        except Exception as e:
            # Graceful fallback so the demo always works
            print(f"Whisper transcription failed: {e}")
            mock = (
                "Patient: I have been coughing for three days, no drug allergies.\n"
                "Doctor: I will prescribe albuterol inhaler as needed."
            )
            return jsonify({
                "transcript": mock,
                "note": f"Fallback transcription used. Error: {str(e)}"
            })
    finally:
        try:
            os.unlink(tmp_in.name)
        except Exception:
            pass

# Extract endpoint (Ollama llama3.2:3b)
@app.route("/extract", methods=["POST"])
def extract():
    body = request.get_json(silent=True) or {}
    transcript = (body.get("transcript") or "").strip()
    if not transcript:
        return jsonify({"error": "Transcript is required"}), 400

    prompt = f"""
You are an expert medical information extraction system. Your task is to thoroughly analyze this clinical conversation and extract ALL medical details into structured JSON format.

INSTRUCTIONS:
1. Extract EVERY medical detail from the conversation
2. Include ALL symptoms, conditions, medications, history items, and clinical findings
3. Do NOT skip information - be comprehensive and thorough
4. Return ONLY valid JSON (no markdown, no text before/after)
5. Use the EXACT schema provided below

Required JSON Schema:
{{
  "summary": "comprehensive clinical summary",
  "diagnoses": [
    {{ "text": "chief complaint and symptoms", "severity": "mild/moderate/severe" }},
    {{ "text": "other symptoms or conditions", "severity": "..." }}
  ],
  "medications": [
    {{ "name": "medication name", "dose": "if mentioned", "frequency": "if mentioned", "status": "current/tried/failed" }}
  ],
  "allergies": [
    {{ "substance": "allergen", "reaction": "if mentioned", "status": "confirmed/denied" }}
  ],
  "labs": [
    {{ "name": "test name", "value": "result if mentioned" }}
  ],
  "procedures": [
    {{ "name": "procedure or exam mentioned" }}
  ],
  "tasks": [
    {{ "type": "followup", "text": "recommended actions or follow-ups" }}
  ]
}}

EXTRACTION RULES - VERY IMPORTANT:
1. Chief Complaint & ALL Symptoms → diagnoses array (e.g., headache, nausea, stiff neck, photophobia)
2. ALL Medications mentioned (Tylenol, Motrin, prescriptions) → medications with status "tried"/"current"/"prescribed"
3. Past Medical History (hypertension, diabetes, etc.) → diagnoses with text noting "history of [condition]"
4. Family History → Include in summary AND relevant diagnoses with note "family history"
5. Social History (smoking, alcohol, occupation) → Include in summary with specifics
6. Drug Allergies → If "no allergies" mentioned, add entry with status "none reported"
7. Physical Exam findings (if any) → procedures array or diagnoses
8. Planned tests/imaging → procedures array
9. Follow-up plans → tasks array with specific actions
10. Review of Systems → Extract ALL positive/negative findings to diagnoses

EXAMPLE EXTRACTION from "Patient has severe headache, took Tylenol without relief, history of hypertension":
{{
  "diagnoses": [
    {{"text": "Severe headache", "severity": "severe"}},
    {{"text": "Hypertension (controlled)", "severity": "stable"}}
  ],
  "medications": [
    {{"name": "Tylenol", "status": "tried - ineffective"}}
  ]
}}

Now extract from this transcript:
<<<{transcript}>>>
"""

    try:
        # Use remote Ollama endpoint with large model
        ollama_url = "http://108.192.20.12:11434/api/generate"
        ollama_model = "llama4:latest"  # 108.6B parameter model for better accuracy
        
        print(f"Calling Ollama at {ollama_url} with model {ollama_model}")
        
        # Request with explicit options for better JSON generation
        payload = {
            "model": ollama_model,
            "prompt": prompt,
            "stream": False,
            "format": "json",  # Force JSON format (Ollama 0.1.16+)
            "options": {
                "temperature": 0.2,  # Low temperature for consistency
                "num_predict": 4000,  # Allow up to 4000 tokens (very large response)
                "top_p": 0.9,
                "top_k": 40,
            }
        }
        
        r = http_requests.post(
            ollama_url,
            json=payload,
            timeout=180  # Increased timeout for large model
        )
        r.raise_for_status()
        response_data = r.json()
        raw = response_data.get("response", "")
        
        # Log response for debugging
        print(f"Ollama response: {len(raw)} characters")
        if len(raw) < 500:
            print(f"Full response: {raw}")
        else:
            print(f"Response preview (first 300 chars): {raw[:300]}")
        
        # Clean and extract JSON
        json_str = raw.strip()
        
        # Remove markdown code blocks if present
        if json_str.startswith("```"):
            # Remove opening ```json or ```
            json_str = re.sub(r'^```(?:json)?\s*', '', json_str)
            # Remove closing ```
            json_str = re.sub(r'\s*```$', '', json_str)
            json_str = json_str.strip()
        
        # Ensure we have the complete JSON by finding matching braces
        if json_str.startswith('{'):
            # Count braces to find the complete JSON object
            brace_count = 0
            end_pos = 0
            for i, char in enumerate(json_str):
                if char == '{':
                    brace_count += 1
                elif char == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        end_pos = i + 1
                        break
            
            if end_pos > 0:
                json_str = json_str[:end_pos]
        
        print(f"Extracted JSON length: {len(json_str)} characters")
        print(f"JSON preview (first 200): {json_str[:200]}")
        print(f"JSON preview (last 200): {json_str[-200:]}")
        
        data = json.loads(json_str)
        return jsonify(data)
    except Exception as e:
        # Fallback so the demo always runs
        print(f"Ollama extraction failed: {e}")
        fallback = {
            "summary": f"Error connecting to AI model: {str(e)}. Using fallback data.",
            "diagnoses": [{"text": "Acute cough", "severity": "mild"}],
            "medications": [{"name": "Albuterol inhaler", "route": "inhalation", "frequency": "PRN"}],
            "allergies": [],
            "labs": [],
            "procedures": [],
            "tasks": [{"type": "followup", "text": "Recheck in 2 weeks"}]
        }
        return jsonify(fallback)

if __name__ == "__main__":
    # Pre-load Whisper model in background
    print("Starting Flask app...")
    print("Pre-loading Whisper model (this may take a few minutes on first run)...")
    try:
        model = get_whisper_model()
        if model:
            print("✓ Whisper model pre-loaded successfully!")
        else:
            print("⚠ Whisper model not loaded, will use fallback transcription")
    except Exception as e:
        print(f"⚠ Could not pre-load model: {e}")
    
    # Run on port 5002
    print("\n🚀 Server ready on http://127.0.0.1:5002")
    app.run(host="127.0.0.1", port=5002, debug=True, threaded=True)
