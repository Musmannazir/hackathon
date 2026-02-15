"""
دوا پہچان - Dawa Pahchan
Medicine Recognition & Safety PWA Backend
FastAPI + Gemini Vision AI
"""

import os
import json
import re
import uuid
import asyncio
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
import google.generativeai as genai

# ========================================
# Configuration
# ========================================

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyAt5L_antFk4X-k3_NCxevAAxlG70LtECg")
genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI(title="دوا پہچان - Dawa Pahchan")

# Ensure directories
Path("uploads").mkdir(exist_ok=True)
Path("static").mkdir(exist_ok=True)


# ========================================
# Prompt Builder
# ========================================

def build_analysis_prompt(age, gender, weight, pregnant, allergies):
    """Build the comprehensive analysis prompt for Gemini Vision."""

    gender_urdu = "مرد" if gender == "male" else "عورت"
    pregnant_urdu = "ہاں" if pregnant else "نہیں"

    return f"""You are a pharmaceutical analysis AI assistant designed for rural Pakistani users with low literacy. Analyze this medicine image comprehensively.

USER PROFILE:
- Age: {age} years
- Gender: {gender_urdu} ({gender})
- Weight: {weight} kg
- Pregnant: {pregnant_urdu} ({pregnant})
- Known Allergies: {allergies if allergies else "None reported"}

TASKS:
1. EXTRACT all text visible on the medicine packaging, strip, bottle, or prescription
2. IDENTIFY the medicine name and active ingredients
3. EXPLAIN what this medicine does in ultra-simple Urdu (imagine explaining to someone with minimal education). Maximum 2 short sentences. No medical jargon whatsoever. Use everyday language.
4. ASSESS AUTHENTICITY by checking for:
   - Spelling mistakes on packaging
   - Font inconsistencies or poor print quality
   - Presence of batch number and expiry date
   - Manufacturer details and regulatory marks (DRAP for Pakistan)
   - Barcode/QR code presence
   - Overall packaging quality
5. CHECK SAFETY for this specific user based on their profile:
   - Age-appropriate? (pediatric/geriatric considerations)
   - Gender-specific contraindications?
   - Pregnancy category and risks? (critical if user is pregnant)
   - Allergy conflicts with known allergies?
   - Weight-based dosing considerations?
6. PROVIDE general DOSAGE guidance (NOT a prescription, just standard information)

CRITICAL RULES:
- ALL Urdu text MUST use extremely simple, everyday language
- Keep explanations to 1-2 bullet points maximum
- Use friendly, reassuring tone
- If the image is NOT a medicine or is unclear, set "not_medicine" to true
- For authenticity: be practical and fair - don't flag legitimate packaging as suspicious
- NEVER prescribe. Only provide general dosage ranges
- Always emphasize consulting a doctor
- Use the exact emoji indicators specified below

For authenticity status labels, use EXACTLY one of:
- If authentic: "🟢 اصل لگتی ہے"
- If suspicious: "🟡 مزید تصدیق ضروری ہے"
- If counterfeit: "🔴 جعلی ہونے کا شبہ ہے"

For safety status labels, use EXACTLY one of:
- If safe: "🟢 آپ کے لیے محفوظ لگتی ہے"
- If warning: "🟡 احتیاط ضروری ہے"
- If danger: "🔴 آپ کے لیے خطرناک ہو سکتی ہے"

Respond ONLY with valid JSON in this EXACT structure (no markdown, no code blocks):
{{
  "medicine_name": "Medicine name in English",
  "extracted_text": "All text extracted from the image",
  "explanation_urdu": "Simple 1-2 line Urdu explanation of what this medicine does using everyday words",
  "authenticity": {{
    "status": "authentic OR suspicious OR counterfeit",
    "label_urdu": "Emoji + Urdu label as specified above",
    "reasons_urdu": ["Reason 1 in simple Urdu", "Reason 2 in simple Urdu"],
    "details": "Technical details in English for advanced users"
  }},
  "safety": {{
    "status": "safe OR warning OR danger",
    "label_urdu": "Emoji + Urdu label as specified above",
    "warnings_urdu": ["Warning 1 in simple Urdu if any"],
    "details": "Technical safety details in English"
  }},
  "dosage": {{
    "recommendation_urdu": "Dosage guidance in simple Urdu, always end with: لیکن ڈاکٹر سے مشورہ ضروری ہے",
    "details": "Technical dosage information in English"
  }},
  "not_medicine": false,
  "error_message_urdu": ""
}}"""


# ========================================
# Response Parser
# ========================================

def parse_gemini_response(text):
    """Extract JSON from Gemini response, handling various formats."""
    if not text:
        return None

    # Try direct parse
    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError):
        pass

    # Try extracting from markdown code block
    match = re.search(r'```(?:json)?\s*([\s\S]*?)```', text)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except (json.JSONDecodeError, TypeError):
            pass

    # Try finding JSON object
    match = re.search(r'\{[\s\S]*\}', text)
    if match:
        try:
            return json.loads(match.group())
        except (json.JSONDecodeError, TypeError):
            pass

    return None


# ========================================
# Gemini Analysis
# ========================================

def _run_gemini_analysis(prompt, image_path, content_type):
    """Synchronous Gemini call (run in thread pool from async context)."""
    uploaded_file = None
    try:
        # Upload image to Gemini
        uploaded_file = genai.upload_file(image_path, mime_type=content_type)

        # Create model and generate
        model = genai.GenerativeModel('gemini-2.5-flash')

        # Try with JSON response mode first
        try:
            response = model.generate_content(
                [prompt, uploaded_file],
                generation_config={
                    "temperature": 0.2,
                    "response_mime_type": "application/json"
                }
            )
        except Exception:
            # Fallback without response_mime_type
            response = model.generate_content(
                [prompt, uploaded_file],
                generation_config={"temperature": 0.2}
            )

        return response.text

    finally:
        # Clean up uploaded file from Gemini
        if uploaded_file:
            try:
                genai.delete_file(uploaded_file)
            except Exception:
                pass


# ========================================
# Routes
# ========================================

@app.get("/")
async def root():
    """Serve the main PWA page."""
    return FileResponse("static/index.html")


@app.get("/manifest.json")
async def manifest():
    """Serve PWA manifest from root scope."""
    return FileResponse("static/manifest.json", media_type="application/json")


@app.get("/sw.js")
async def service_worker():
    """Serve service worker from root scope for maximum coverage."""
    return FileResponse(
        "static/sw.js",
        media_type="application/javascript",
        headers={"Service-Worker-Allowed": "/"}
    )


@app.post("/api/analyze")
async def analyze_medicine(
    image: UploadFile = File(...),
    age: int = Form(0),
    gender: str = Form(""),
    weight: float = Form(0),
    pregnant: str = Form("false"),
    allergies: str = Form("")
):
    """
    Analyze a medicine image using Gemini Vision AI.
    Returns structured analysis including:
    - Medicine identification & Urdu explanation
    - Authenticity assessment
    - User-specific safety check
    - Dosage guidance
    """

    # Validate image
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="براہ کرم تصویر اپلوڈ کریں")

    # Parse pregnant field
    is_pregnant = pregnant.lower() in ("true", "1", "yes")

    # Save image temporarily
    suffix = "." + image.content_type.split("/")[-1].split(";")[0]
    temp_path = f"uploads/{uuid.uuid4()}{suffix}"

    try:
        # Save uploaded image
        image_data = await image.read()
        with open(temp_path, "wb") as f:
            f.write(image_data)

        # Build prompt
        prompt = build_analysis_prompt(age, gender, weight, is_pregnant, allergies)

        # Run Gemini analysis in thread pool (non-blocking)
        response_text = await asyncio.to_thread(
            _run_gemini_analysis, prompt, temp_path, image.content_type
        )

        # Parse response
        result = parse_gemini_response(response_text)

        if result is None:
            return JSONResponse({
                "not_medicine": True,
                "error_message_urdu": "تصویر سے معلومات حاصل نہیں ہو سکیں۔ براہ کرم صاف تصویر لیں اور دوبارہ کوشش کریں۔"
            })

        return JSONResponse(result)

    except Exception as e:
        print(f"❌ Analysis error: {e}")
        return JSONResponse(
            {
                "not_medicine": True,
                "error_message_urdu": "تجزیہ میں مسئلہ ہوا۔ براہ کرم دوبارہ کوشش کریں۔"
            },
            status_code=500
        )

    finally:
        # Clean up temp file
        try:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
        except Exception:
            pass


# Mount static files AFTER explicit routes
app.mount("/static", StaticFiles(directory="static"), name="static")


# ========================================
# Run
# ========================================

if __name__ == "__main__":
    import uvicorn
    print("\n💊 دوا پہچان - Dawa Pahchan")
    print("🌐 http://localhost:8000\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)
