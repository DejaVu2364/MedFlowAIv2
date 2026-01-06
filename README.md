# MedFlow AI v2.0 - "The Calm EMR"

MedFlow AI is an avant-garde Electronic Medical Record (EMR) system designed to reduce cognitive load for clinicians. It features a "calm computing" aesthetic, AI-powered documentation assistance, and a seamless offline-first experience.

## 🚀 Features

- **AI Copilot**: Integrated Gemini AI for answering medical queries, summarizing records, and generating clinical notes.
- **Offline-First**: Robust syncing with Firebase Firestore allows full functionality without an internet connection.
- **Voice-to-Text**: Real-time voice transcription for hands-free documentation.
- **Synthea Integration**: One-click generation of realistic patient data for testing and demos.
- **Premium UI**: Glass-morphism design, smooth animations, and a focus on visual hierarchy.

## 🛠️ Setup & Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/DejaVu2364/MedFlowAIv2.git
    cd MedFlowAG2-main
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    - Copy the example environment file:
      ```bash
      cp .env.example .env
      ```
    - Fill in your Firebase and Gemini API keys in `.env`.

4.  **Run Local Development Server:**
    ```bash
    npm run dev
    ```
    Access the app at `http://localhost:3000`.

## 🧪 Testing

- **Unit Tests**: Run Vitest suite for services and hooks.
  ```bash
  npm run test:unit
  ```
- **End-to-End Tests**: Run Playwright tests for user flows.
  ```bash
  npm run test:e2e
  ```

## 📦 Deployment

The application is configured for **Firebase Hosting**.

1.  **Build the application:**
    ```bash
    npm run build
    ```
2.  **Deploy to Firebase:**
    ```bash
    firebase deploy --only hosting
    ```
    *Note: Ensure you are logged in via `firebase login` first.*

## 🔒 Security

- **Firestore Rules**: Rules are configured to strictly control access. For prototype demos, temporary open access may be enabled (check `firestore.rules`).
- **API Keys**: Keys are exposed in the frontend; restrict usage quotas in Google Cloud Console.
