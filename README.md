# MedFlow AI 🏥

Modern healthcare management system with AI-powered clinical workflows, built with React, TypeScript, and Firebase.

## ✨ Features

### Patient Management
- **Multi-role Dashboard**: Reception, Triage, Doctor views
- **Real-time Updates**: Live patient status tracking
- **Smart Triage**: AI-powered complaint classification
- **Clinical Documentation**: Structured clinical file with AI assistance

### Advanced Vitals Monitoring
- **Interactive Charts**: Trend visualization with Recharts
- **Live Device Integration**: Simulated pulse oximeter
- **AI Insights**: Automated vitals analysis
- **Alerts System**: Real-time critical value notifications

### AI-Powered Clinical Workflows
- **SOAP Note Generation**: Voice-to-text with AI structuring
- **Follow-up Questions**: Intelligent history taking
- **Order Suggestions**: Context-aware clinical decision support
- **Discharge Summaries**: Automated comprehensive summaries
- **Clinical Cross-checking**: AI validation of clinical notes

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + Custom components
- **Backend**: Firebase (Auth + Firestore)
- **AI**: Google Gemini 2.5 (Flash & Pro)
- **Charts**: Recharts
- **Testing**: Playwright E2E

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Firebase account
- Google AI API key

### Installation

```bash
# Clone the repository
git clone https://github.com/DejaVu2364/MedFlowAG2.git
cd MedFlowAG2

# Install dependencies
npm install

# Set up environment variables
cp temp_env.txt .env
# Edit .env with your Firebase & Gemini credentials

# Start dev server
npm run dev
```

### Environment Variables

```env
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GEMINI_API_KEY=your_gemini_key
```

## 📦 Build & Deploy

```bash
# Build for production
npm run build

# Deploy to Firebase
firebase deploy
```

## 🧪 Testing

```bash
# Run E2E tests
npm run test:e2e

# Run tests in UI mode
npm run test:e2e:ui
```

## 📱 Pages & Features

### Dashboard
- Patient overview with status cards
- Quick stats and metrics
- Navigation hub

### Reception
- Patient registration
- AI-powered triage suggestions
- Queue management

### Triage
- Priority-based patient queue
- Vitals recording
- Triage assignment

### Patient Detail
- **Clinical File**: Comprehensive history & examination
- **Orders**: Lab, imaging, medications, procedures
- **Vitals**: Full vitals dashboard with charts
- **MedView**: AI handover summaries

### Vitals Page
- 3-column responsive layout
- Quick vitals entry
- Real-time trend charts
- AI insights & alerts
- Live device simulation

### Discharge
- Structured discharge summary generator
- Medication reconciliation
- Follow-up instructions

## 🔒 Security Notes

⚠️ **Current Implementation**: This is a prototype with client-side AI calls.

**For Production:**
- Migrate to Firebase Cloud Functions + Vertex AI
- Implement server-side PHI handling
- Add proper authentication & authorization
- Enable audit logging
- Follow HIPAA compliance guidelines

## 🗺️ Roadmap

- [ ] Migrate to Vertex AI (server-side)
- [ ] Real device integrations (HL7/FHIR)
- [ ] Advanced reporting & analytics
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Telemedicine integration

## 📄 License

MIT

## 🙏 Acknowledgments

Built with modern web technologies and AI assistance for healthcare workflows.

---

**Note**: This is a demonstration/prototype application. Not intended for production clinical use without proper validation, security hardening, and regulatory compliance.
