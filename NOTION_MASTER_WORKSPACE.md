# MedFlow AI — Master Notion Workspace
**THE COMPLETE TECHNICAL, CLINICAL & AI SYSTEM DOCUMENTATION**

> **💡 How to use this page:** This is your project's "Source of Truth". Copy and paste this entire document into a new Notion page. Use the `[📷 Add Screenshot]` placeholders to insert your actual app screenshots for a complete presentation.

---

## 🧭 📌 Navigation Panel

*   [I. Product Overview](#i-product-overview)
*   [II. System Architecture](#ii-system-architecture)
*   [III. Data Models](#iii-data-models)
*   [IV. Detailed Feature Documentation](#iv-detailed-feature-documentation)
*   [V. AI Modules & Prompt Templates](#v-ai-modules--prompt-templates)
*   [VI. UI/UX Documentation](#vi-uiux-documentation)
*   [VII. Testing & QA](#vii-testing--qa)
*   [VIII. Deployment & DevOps](#viii-deployment--devops)
*   [IX. Hackathon Defense Kit](#ix-hackathon-defense-kit)
*   [X. Appendix](#x-appendix)

---

## 🟥 I. PRODUCT OVERVIEW

### 🎯 Mission
To eliminate clinical paperwork and administrative burden for doctors using AI-powered automation — allowing them to focus entirely on patient care.

### 🩺 Real Problems We Solve

#### Clinical Pain Points
*   **Fragmented Data:** Patient info scattered across physical files, WhatsApp, and EMR fragments.
*   **Time Loss:** Rounds take too long due to manual note-taking.
*   **Delays:** Labs/radiology reporting lags behind clinical needs.
*   **Blind Spots:** Difficult to track what changed in the last 24 hours.
*   **Admin Burden:** Slow discharge summaries and repetitive documentation.

#### Hospital Administrative Pain Points
*   Fragmented interdepartmental communication.
*   Bed turnover delays due to slow discharge process.
*   Missing audit trails and clinical documentation standards.

### 👥 User Personas

| Persona | Needs | Pain Points |
| :--- | :--- | :--- |
| **Doctors** | Fast entry, AI help, clear patient evolution view. | "I spend more time typing than treating." |
| **Residents** | AI to draft notes, help with organization. | "I'm overwhelmed by paperwork." |
| **Nurses** | Order clarity, status tracking, vitals workflow. | "I don't know if the doctor saw the new labs." |
| **Admins** | Patient counts, beds, movement tracking. | "I can't see how many beds are free." |

### Value Proposition
1.  **Unified Patient Timeline:** Everything in one place (Vitals, Labs, Notes).
2.  **AI-Powered Automation:** Triage, Scribing, and Discharge Summaries done for you.
3.  **Real-Time Sync:** Instant updates across the entire team.

---

## 🟧 II. SYSTEM ARCHITECTURE

### 🏛 High-Level Architecture Diagram

```mermaid
graph TD
    User[User Browser] --> ReactApp[React App (Vite)]
    ReactApp --> UI[UI Layer (shadcn + Tailwind)]
    ReactApp --> State[State Layer (Context API)]
    ReactApp --> Logic[Domain Logic (Hooks)]
    ReactApp --> Services[Services Layer]
    
    Services --> Firebase[Firebase SDK]
    Services --> Gemini[Gemini AI API]
    
    Firebase --> Firestore[Firestore Database]
    Firebase --> Auth[Firebase Auth]
```

### 🧩 Frontend Architecture
*   **Framework:** React 19 (Latest API)
*   **Language:** TypeScript for strong typing
*   **Build Tool:** Vite for fast bundling
*   **Styling:** Tailwind CSS + shadcn/ui for consistent UI
*   **State Management:** Context API (`AuthContext`, `PatientContext`, `UIContext`)

### ☁️ Backend Architecture
*   **Platform:** Firebase
*   **Database:** Firestore (NoSQL) - Real-time listeners for instant updates.
*   **Auth:** Firebase Authentication (Email/Password).
*   **Hosting:** Vercel (SPA Routing).

### 🤖 AI Architecture
*   **Gemini Flash 2.5:** Used for fast, low-latency tasks (Triage, Status Updates).
*   **Gemini Pro 2.5:** Used for complex reasoning (Summaries, Scribing, Q&A).

#### AI Module Responsibilities
| AI Module | Purpose | Model |
| :--- | :--- | :--- |
| **Triage AI** | Classify complaint + danger level | Flash 2.5 |
| **Complaint AI** | Understand complaint + context | Flash 2.5 |
| **MedView AI** | Summaries + 24h changes | Pro 2.5 |
| **Rounds Scribe** | Draft SOAP notes from voice | Pro 2.5 |
| **Discharge AI** | Formal discharge summary generation | Pro 2.5 |

---

## 🚀 GETTING STARTED (For Developers)

### Prerequisites
*   Node.js (v18+)
*   npm or yarn
*   Firebase Project (with Firestore & Auth enabled)
*   Google Cloud Project (for Gemini API)

### Installation
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/DejaVu2364/MedFlow.git
    cd MedFlow
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the root directory:
    ```env
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_GEMINI_API_KEY=your_gemini_key
    ```

4.  **Run Locally:**
    ```bash
    npm run dev
    ```

---

## 🟩 III. DATA MODELS

All schemas are defined in `types.ts`.

### Patient Model
```typescript
interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  triage: {
    level: 'Red' | 'Yellow' | 'Green';
    department: string;
  };
  chiefComplaints: Complaint[];
  vitals: Vital[];
  orders: Order[];
  clinicalFile: ClinicalFile;
  rounds: Round[];
  dischargeSummary?: DischargeSummary;
  // ... timestamps
}
```

---

## 🟦 IV. DETAILED FEATURE DOCUMENTATION

### ▶ Reception / Registration
*   **Purpose:** Register a new patient with structured complaints.
*   **Key Features:**
    *   Multi-Complaint Input (Complaint + Duration).
    *   Auto-suggest for symptoms.
*   **AI Integration:** Optional complaint interpretation.

> [!TIP]
> **📷 Add Screenshot:** *Insert screenshot of the Registration Page here.*

### ▶ Triage
*   **Purpose:** Assign severity level + department.
*   **AI Classification:**
    *   🔴 **Red:** Critical/Resuscitation
    *   🟡 **Yellow:** Urgent
    *   🟢 **Green:** Stable/Non-urgent

> [!TIP]
> **📷 Add Screenshot:** *Insert screenshot of the Triage Dashboard showing Red/Yellow/Green badges.*

### ▶ MedView (30-second Doctor Overview)
*   **Purpose:** Rapidly catch up on patient status.
*   **Features:**
    *   **Sparklines:** Visual trend of Vitals (HR, BP, SpO2).
    *   **24h Evolution:** AI summary of what changed since yesterday.
    *   **Latest Labs:** Quick view of abnormal results.

> [!TIP]
> **📷 Add Screenshot:** *Insert screenshot of the Patient Dashboard / MedView.*

### ▶ Rounds & AI Scribe
*   **Ambient Scribe Workflow:**
    1.  Doctor clicks "Start Scribe".
    2.  Doctor speaks (dictates or converses with patient).
    3.  AI listens and transcribes in real-time.
    4.  AI generates structured **SOAP Note** (Subjective, Objective, Assessment, Plan).
    5.  Doctor edits & saves.

> [!TIP]
> **📷 Add Screenshot:** *Insert screenshot of the Clinical File / Scribe Interface.*

### ▶ Discharge Summary
*   **Workflow:** One-click generation. AI compiles admission details, course in hospital, and final diagnosis into a formal document.

> [!TIP]
> **📷 Add Screenshot:** *Insert screenshot of the generated Discharge Summary.*

---

## 🟪 V. AI MODULES & PROMPTS

*(See `services/geminiService.ts` for implementation details)*

### Triage Prompt Strategy
We use a "Chain of Thought" approach:
1.  Analyze the complaint (e.g., "Chest pain radiating to arm").
2.  Identify risk factors (Age > 50).
3.  Map to Triage Scale (ESI Level 2).
4.  Output JSON: `{ level: "Red", department: "Cardiology" }`.

### Scribe Prompt Strategy
"You are an expert medical scribe. Listen to the following transcript. Extract the Subjective (symptoms), Objective (signs), Assessment (diagnosis), and Plan. Ignore small talk."

---

## 🟫 VI. UI/UX DOCUMENTATION

### Design System
*   **Colors:**
    *   Backgrounds: Soft clinical white/grey (`#F7F9FC`)
    *   Text: Muted grey (`#1B1E27`)
    *   Accents: Indigo/Primary (`#6366f1`)
    *   Status: Green (Safe), Yellow (Warning), Red (Critical)
*   **Components:** Glassmorphism cards, rounded corners, consistent padding.
*   **Typography:** Clean sans-serif (Inter/Geist).

### Accessibility
*   High contrast text.
*   Keyboard navigable forms.
*   Dark Mode support.

---

## 🟨 VII. TESTING & QA

### Manual Testing Checklist
*   [ ] **Registration:** Create a patient, ensure they appear in Triage.
*   [ ] **Triage:** Verify AI assigns correct color.
*   [ ] **Vitals:** Add vitals, check if graph updates.
*   [ ] **Scribe:** Test voice input, verify SOAP generation.
*   [ ] **Discharge:** Generate summary, check for hallucinations.

### Automated Testing
*   **Playwright E2E:** Covers critical paths (Registration → Patient View → Orders → Discharge).
*   **Unit Tests:** Vitest for utility functions and hooks.

---

## 🟧 VIII. DEPLOYMENT & DEVOPS

### Hosting
*   **Provider:** Vercel (Primary)
*   **Environment:** Production

### Environment Variables
| Variable | Description |
| :--- | :--- |
| `VITE_FIREBASE_API_KEY` | Firebase Config |
| `VITE_GEMINI_API_KEY` | AI Model Access |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth Config |

---

## 🟥 IX. HACKATHON DEFENSE KIT

### 1. 60-second Pitch
"MedFlow AI is the operating system for modern hospitals. We replace fragmented paper and WhatsApp workflows with a unified, AI-powered timeline that handles everything from triage to discharge. We don't just digitize records; we actively help doctors care for patients faster."

### 2. Live Demo Script
1.  **Register:** "John Doe, Chest Pain."
2.  **Triage:** Show AI auto-classifying as "Red/Cardiology".
3.  **Consultant View:** Show the dashboard.
4.  **Scribe:** "Patient has severe pain radiating to left arm..." -> Generate SOAP.
5.  **Discharge:** One-click summary generation.

### 3. Risks & Mitigation
*   **Risk:** AI Hallucination. **Mitigation:** Human-in-the-loop (Doctor must sign off).
*   **Risk:** Data Privacy. **Mitigation:** HIPAA-compliant storage (Firestore rules).
*   **Risk:** Connectivity. **Mitigation:** Offline support (PWA capabilities).

---

## 🟦 X. APPENDIX

*   **Folder Structure:** See `README.md`.
*   **API Definitions:** See `types.ts`.
*   **Known Limitations:** Voice input requires browser permission.
