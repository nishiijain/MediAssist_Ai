# MedicAssist AI — AI-Powered Patient History Analysis & Clinical Workflow Support System

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-teal.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.0+-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

MedicAssist AI is a clinical information-management and decision-support system designed to convert scattered patient records (PDF reports, scanned diagnostics, prescriptions, consultation notes, and intake disclosures) into structured, chronological, and verifiable medical histories for healthcare professionals to review.

> **Clinical Disclaimer:** MedicAssist AI is a clinical workflow and decision-support prototype. It does not provide autonomous diagnoses, prescribe medications, or replace professional clinical judgment.

---

## Key Features

1. **Patient Intake & Caregiver Workflow:**
   - Full CRUD patient management.
   - Distinct separation between patient-reported disclosures and document-extracted findings.
   - Document-first intake mode for patients unable to verbally communicate (unconscious, cognitive impairment, or emergency admission).

2. **Multi-Format Document Ingestion:**
   - Text and digital PDF text extraction via PyMuPDF (`fitz`), preserving page numbers.
   - OCR processing via Tesseract for scanned PDF pages and images (PNG, JPG).
   - Safe server-side file storage outside web root with unique UUID mapping.

3. **Structured Clinical Entity Extraction:**
   - Extracts encounter dates, document types, lab tests, numerical results, measurement units, reference ranges, conditions, medications, dosages, and allergies.
   - Every finding is anchored to an exact verbatim source snippet and page citation.
   - Supports Google Gemini and OpenAI via backend-only adapters, plus a high-precision deterministic clinical rule extractor for offline/demo mode.

4. **Deterministic Verification Engine (Core Technical Contribution):**
   - **Source Consistency:** Fuzzy & substring verification between extracted fields and raw document excerpts.
   - **Date Validation:** Formats check (ISO, DMY, MDY), distinguishes encounter dates from upload dates, flags impossible/future dates.
   - **Numeric & Unit Validation:** Checks unit compatibility (e.g. HbA1c in `%`, Glucose in `mg/dL`), flags missing units.
   - **Missing Information:** Identifies missing medication dosages, frequencies, and missing diagnostic parameters.
   - **Contradiction Detection:** Detects conflicting lab results on the same encounter date and contradictory allergy records (e.g., triage "NKDA" vs chart "Penicillin allergy: anaphylaxis").
   - **Unsupported Statement Filtering:** Rejects statements lacking supporting evidence snippets.

5. **Longitudinal History & Recharts Trajectories:**
   - Chronological timeline ordering events by verified medical encounter dates.
   - Interactive Recharts visualization for compatible quantitative lab measurements (HbA1c, Fasting Blood Glucose, Serum Creatinine, Cholesterol).
   - Explicit rule-based preliminary clinical review flags (e.g., HbA1c $\ge$ 8.0%, BP $\ge$ 140/90 mmHg).

6. **Doctor Review & 10-Section Summary:**
   - Automated draft synthesis structured into 10 clinical sections:
     1. Patient overview
     2. Documented medical history
     3. Chronological timeline
     4. Relevant laboratory results and changes
     5. Medication history
     6. Reported allergies
     7. Missing or ambiguous information
     8. Contradictory records
     9. Potentially concerning findings requiring review
     10. Source documents and page references
   - Physician review interface to edit text, append clinical notes, approve/reject, and persist verified sign-offs.

7. **Standardized Evaluation Benchmark:**
   - Compares **Baseline** (naive extraction without verification) against **Proposed** (MedicAssist AI verification engine).
   - Evaluates across 8 synthetic clinical test cases (clean reports, scans, missing fields, future dates, conflicting values, missing units, unsupported hallucinations, and emergency multi-document cases).
   - Computes Precision, Recall, F1-Score, Omission Rate, Unsupported Statement Rate, and Missing-Field Detection Rate.

---

## Architecture

```
mediassistAi/
├── backend/
│   ├── app/
│   │   ├── api/api_v1/endpoints/   # REST endpoints (patients, documents, verification, etc.)
│   │   ├── core/                   # App configuration & settings
│   │   ├── database/               # SQLAlchemy engine & session
│   │   ├── models/                 # Normalized clinical schema
│   │   ├── schemas/                # Pydantic v2 validation models
│   │   └── services/               # Document processing, extraction, verification, timeline, evaluation
│   ├── storage/uploads/            # Secure document storage
│   ├── tests/                      # Pytest unit & integration test suite
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/             # Reusable UI (Navbar, Sidebar, Modal, TrendChart, StatusPill)
│   │   ├── pages/                  # 8 Main workflow sections
│   │   ├── services/api.ts         # Type-safe API client
│   │   └── types/index.ts          # Clinical TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
├── sample_data/
│   └── demo_docs/                  # Sample synthetic PDFs and TXT files
├── .env.example
└── README.md
```

---

## Prerequisites

- **macOS** or **Linux**
- **Python 3.11+**
- **Node.js v18+** & **npm v9+**
- *(Optional for image OCR)* Tesseract OCR:
  ```bash
  # macOS Homebrew
  brew install tesseract
  ```

---

## Installation & Setup

### 1. Clone & Set Up Backend

```bash
# Navigate to project root
cd /Users/nishitajain/Documents/mediassistAi

# Create and activate Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt

# (Optional) Copy environment variables template
cp .env.example .env
```

### 2. Set Up Frontend

```bash
cd frontend
npm install
cd ..
```

---

## Running the Application

### Start Backend API Server

```bash
# From workspace root with active venv:
PYTHONPATH=backend ./venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- Backend API will be live at: `http://localhost:8000`
- Interactive OpenAPI / Swagger Documentation: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### Start Frontend Development Server

In a separate terminal window:
```bash
cd frontend
npm run dev
```
- Frontend will be live at: `http://localhost:3000`

---

---

## Doctor & Patient Authentication System

MedicAssist AI includes a complete role-based authentication and clinical access control system:

- **Professional Welcome Page (`/`)**: Healthcare portal with branding, system architecture highlights, and dual entry cards for Clinicians and Patients.
- **Doctor Portal (`/doctor/login`, `/doctor/register`)**:
  - Doctor registration: Full name, medical license / registration number, specialization, hospital/clinic name, professional email, and password.
  - Simulated Medical Board directory verification active for academic evaluation.
  - Doctor workspace access: Patient records, AI extraction, hallucination verification, longitudinal timeline, and clinical summary sign-off.
- **Patient Health Portal (`/patient/login`, `/patient/register`, `/patient/portal`)**:
  - Patient registration: Full legal name, email or phone, date of birth, gender, and password.
  - Dedicated patient portal: Personal health profile, direct document uploader bound to MRN, chronological medical timeline, and physician-approved summaries.
  - Strict Patient Record Isolation: Enforced on the backend; patients cannot view or alter other patients' charts by changing URLs or IDs.
- **Backend Cryptographic Security**:
  - Secure password hashing via `bcrypt`.
  - Cryptographically signed JWT tokens (`pyjwt` with HS256).
  - Role-based authorization (`doctor` vs `patient`) and tenant ownership checks on backend REST endpoints.
  - Seeded demo credentials for immediate testing.

### Seeded Demo Accounts (for College & Offline Evaluation)

| Role | Login Identifier | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Doctor** | `doctor@medicassist.ai` | `Doctor123!` | Full clinical workspace, patient charts, verification & summaries |
| **Patient** | `patient@medicassist.ai` | `Patient123!` | Isolated patient health portal, personal timeline, own uploads |

---

## Step-by-Step Clinical Demo Walkthrough

1. Open `http://localhost:3000` in your browser to view the **MedicAssist AI Welcome Page**.
2. **Doctor Experience**:
   - Click **"Doctor Login"** (or use the instant 1-Click Doctor Demo button).
   - Enter `doctor@medicassist.ai` and `Doctor123!`.
   - Access the **Doctor Overview Dashboard** (`/dashboard`) with complete clinical stats, patient directory, and timeline analytics.
   - Click **"Load Demo Patient"** in the top navigation bar to populate fictional patient Johnathan Doe (MRN: MED-98402) with conflicting documents for verification testing.
   - Explore **AI Analysis & Verification** to inspect verbatim source snippet grounding and detected contradictions (e.g., penicillin allergy contradiction).
   - Navigate to **Doctor Review** to sign off on the clinical summary.
   - Sign out using the logout button in the top right.
3. **Patient Experience**:
   - On the Welcome Page, click **"Patient Login"** (or use the instant 1-Click Patient Demo button).
   - Enter `patient@medicassist.ai` and `Patient123!`.
   - Access the isolated **Patient Health Portal** (`/patient/portal`).
   - Check the **Health Overview** tab (demographics, verified allergies, chronic conditions).
   - Use the **Upload Reports & Prescriptions** tab to upload a new report to the patient's chart.
   - Switch to **My Medical Timeline** to view the patient's chronological trajectory.
   - Inspect **Doctor Summaries** to view physician-verified assessments.
   - Sign out securely.

---

## Running Automated Tests

Run the backend pytest suite covering authentication, verification rules, extraction logic, REST endpoints, and evaluation:

```bash
PYTHONPATH=backend ./venv/bin/pytest backend/tests/ -v
```

To validate the frontend TypeScript and production build:
```bash
cd frontend
npm run build
```

---

## Security & Privacy Considerations

1. **Role-Based Backend Verification:** Access control and patient record isolation are enforced in FastAPI dependencies, not merely hidden in the UI.
2. **Cryptographic Integrity:** Passwords are hashed using `bcrypt` with unique salts. Sessions are authenticated via signed JWT bearer tokens.
3. **Synthetic Data By Default:** The application operates on synthetic demo patient identities by default; no real PHI is stored or transmitted.
4. **Environment Variable Safeguards:** API keys (Gemini / OpenAI) are configured exclusively on the backend via `.env` and are never exposed to the frontend bundle.
5. **Isolated File Storage:** Uploaded files are stored in `backend/storage/uploads/` using secure UUIDs to prevent directory traversal attacks.
6. **Offline / Demo Resilience:** The deterministic clinical verification and extraction engine runs completely offline without requiring any external LLM API calls.
