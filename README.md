# 🎙️ AI Interview Simulator – GenAI & Voice Practice Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?style=flat&logo=React&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.0+-646CFF.svg?style=flat&logo=Vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC.svg?style=flat&logo=Tailwind-CSS&logoColor=white)](https://tailwindcss.com)
[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.13%20%7C%203.14-blue.svg?style=flat&logo=Python&logoColor=white)](https://python.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

A modern, full-stack voice-powered AI interview platform for practicing technical, behavioral, HR, and system design interviews for **any job role**. Speak naturally using your microphone, receive live speech-to-text transcription, listen to the AI interviewer speak questions aloud, and get instant NLP rubrics, wrong-answer coaching, and comprehensive performance analytics.

---

## ✨ Key Features

- **🌐 Universal Role Input (Zero Restrictions)**:
  - Enter **any job role** (e.g. *Full Stack Developer*, *Machine Learning Engineer*, *Cloud Architect*, *Product Manager*, *Cybersecurity Analyst*, or specialized custom titles).
  - Optional Job Description upload to tailor question generation directly to specific job postings.
  - Choose from 7 interview types: *Technical, Behavioral (STAR), HR & Culture, System Design, Coding, Managerial, Mixed*.

- **🎙️ Two-Way Real-Time Voice Communication**:
  - **Speech-to-Text (STT)**: Speak answers naturally using your microphone with real-time browser transcription and live soundwave visualizers.
  - **Text-to-Speech (TTS)**: The AI interviewer reads questions aloud with customizable speaking rate and mute controls.
  - Seamless toggle between **Voice Mode** and **Text Mode** at any moment.

- **⚡ Dynamic Adaptive Question Engine**:
  - The AI monitors candidate performance in real time.
  - High-scoring answers trigger deeper, higher-complexity questions.
  - Weaker answers dynamically trigger clarifying, remedial follow-ups targeting detected weak spots.

- **💡 "How to Say It Right" Answer Coach (Wrong Answer Diagnosis)**:
  - **Mistake Diagnosis**: Clear explanations of *why* an answer was incomplete, vague, or factually off-track.
  - **Ideal Spoken Script**: An authentic, first-person conversational script demonstrating how a top candidate would articulate the answer out loud.
  - **🔊 Audio Playback**: Listen to the AI speak the ideal response aloud to practice pronunciation, cadence, and tone.
  - **Phrasing Formulas**: Ready-to-use sentence starters and structure frameworks (STAR method, PREP method, architectural trade-offs).
  - **Live Interview Recovery Advice**: Practical guidance on how to recover gracefully if you make a mistake or get stuck during an interview.

- **📊 Comprehensive Performance Rubrics & Analytics**:
  - Executive **Readiness Verdict** (e.g., *Strong Hire*, *Hire*, *Conditional Practice Needed*).
  - Multi-dimensional scoring across **Technical Accuracy**, **Communication Clarity**, **Depth & Completeness**, and **Problem-Solving / STAR Structure**.
  - Identified Key Strengths and Priority Growth Areas.
  - Question-by-question review with candidate answers vs. ideal benchmark answers.

- **🔒 Secure Authentication & Session History**:
  - JWT-based authentication with bcrypt password hashing.
  - Persistent candidate dashboard tracking completed sessions, average readiness scores, and practiced domains.

---

## 🏗️ Architecture & Project Structure

```text
AI-Interview-Simulator/
├── backend/
│   ├── app/
│   │   ├── database/         # SQLAlchemy engine (SQLite local / PostgreSQL cloud)
│   │   ├── models/           # User and Interview SQL models
│   │   ├── routes/           # Auth and Interview API endpoints
│   │   ├── schemas/          # Pydantic request/response validation schemas
│   │   ├── services/         # LLM & NLP evaluation engine, Auth service, Interview logic
│   │   ├── config.py         # Environment configuration
│   │   ├── deps.py           # Dependency injection (Auth, DB)
│   │   └── main.py           # FastAPI entrypoint & CORS middleware
│   ├── Dockerfile            # Container build for backend
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/       # Navbar, VoiceVisualizer, ProtectedRoute
│   │   ├── context/          # AuthContext (login, register, session management)
│   │   ├── hooks/            # useSpeechRecognition & useSpeechSynthesis
│   │   ├── pages/            # Home, Login, Register, Dashboard, Setup, Room, Report
│   │   ├── services/         # Axios API client
│   │   ├── App.jsx           # React Router route tree
│   │   └── main.jsx          # Vite root entrypoint
│   ├── vercel.json           # SPA rewrite rules for Vercel deployment
│   ├── package.json          # Node dependencies & scripts
│   └── vite.config.js        # Vite configuration & dev proxy
├── database/                 # Local SQLite database storage
├── docker-compose.yml        # Multi-container local orchestration
├── render.yaml               # 1-click cloud deployment blueprint for Render
├── .env.example              # Environment variables template
├── .gitignore                # Production gitignore
└── README.md                 # Project documentation
```

---

## 🚀 Quickstart: Local Setup

### Prerequisites
- **Node.js 20+** and npm
- **Python 3.11+**

### 1. Clone & Configure Environment

```bash
# Clone the repository
git clone https://github.com/your-username/AI-Interview-Simulator.git
cd AI-Interview-Simulator

# Copy environment variables
# On Windows PowerShell:
Copy-Item .env.example .env

# On macOS / Linux:
cp .env.example .env
```

### 2. Start the Backend

```bash
cd backend

# Create and activate virtual environment
# Windows PowerShell:
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# macOS / Linux:
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Verify backend health at: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

### 3. Start the Frontend

In a second terminal window:

```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser (Google Chrome, Edge, or Safari recommended for native Web Speech API microphone support).

---

## 🐳 Running with Docker

Run the entire platform (backend + frontend) in containers with a single command:

```bash
docker compose up --build
```

Access the frontend at `http://localhost:5173` and backend API at `http://localhost:8000`.

---

## ☁️ Deployment Guide

### Option 1: 1-Click Render Deployment (`render.yaml`)

This repository includes a production-ready `render.yaml` blueprint:

1. Push your repository to **GitHub**.
2. Go to [Render Dashboard](https://dashboard.render.com/) and click **New > Blueprint**.
3. Connect your repository. Render automatically reads `render.yaml` to spin up:
   - **Backend Web Service**: Python FastAPI server.
   - **Frontend Static Site**: Vite build with `/index.html` single-page routing.
4. Set the `FRONTEND_ORIGIN` variable in Render to your frontend URL.

### Option 2: Deploy Frontend on Vercel + Backend on Render / Railway

#### Deploy Backend (Render or Railway):
1. Create a Web Service connected to the `backend/` directory.
2. Build Command: `pip install -r requirements.txt`
3. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set Environment Variables:
   - `SECRET_KEY`: `<your-random-32-char-secret>`
   - `FRONTEND_ORIGIN`: `https://your-frontend.vercel.app`

#### Deploy Frontend (Vercel):
1. Import your GitHub repository into [Vercel](https://vercel.com).
2. Set Root Directory to `frontend`.
3. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://your-backend.onrender.com`
4. Deploy! `vercel.json` ensures all client-side routes (`/dashboard`, `/interview/:id`, etc.) resolve properly without 404s.

---

## 📤 How to Push to GitHub

If you haven't pushed this project to GitHub yet, run these commands:

```bash
# 1. Initialize git repository
git init

# 2. Add all files
git add .

# 3. Create your initial commit
git commit -m "feat: complete AI Interview Simulator with voice mode, answer coaching, and deployment configs"

# 4. Rename default branch to main
git branch -M main

# 5. Add your GitHub remote repository (replace with your repo URL)
git remote add origin https://github.com/your-username/AI-Interview-Simulator.git

# 6. Push to GitHub
git push -u origin main
```

---

## 🛡️ License

This project is licensed under the MIT License - see the LICENSE file for details.
