# 🎓 Student Performance Prediction System

An end-to-end, production-ready web application designed for academic performance analysis. This system evaluates student performance parameters, assigns letter grades, assesses key educational risk factors, and provides personalized improvement recommendations using pure standard Python algorithm logic.

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Python](https://img.shields.io/badge/Python-3.9+-green.svg)
![Frontend](https://img.shields.io/badge/Frontend-HTML5%20%7C%20CSS3%20%7C%20JS-purple.svg)

---

## 🌟 Key Architecture & Highlights

```
                       ┌────────────────────────────────────────────────────────┐
                       │          Modern Responsive UI (HTML5/CSS3/JS)           │
                       │ ┌──────────────────┐ ┌────────────────┐ ┌────────────┐ │
                       │ │ Single Predictor │ │ "What-If" Live │ │ Batch CSV  │ │
                       │ │ & Smart Advisor  │ │ Simulator      │ │ Exporter   │ │
                       │ └─────────┬────────┘ └───────┬────────┘ └─────┬──────┘ │
                       └───────────┼──────────────────┼────────────────┼────────┘
                                   │ REST API (JSON)  │                │
                                   ▼                  ▼                ▼
                       ┌────────────────────────────────────────────────────────┐
                       │               Python HTTP / API Server                 │
                       │ ┌──────────────────┐ ┌────────────────┐ ┌────────────┐ │
                       │ │ /api/predict     │ │ /api/model-info│ │ Batch Exec │ │
                       │ └─────────┬────────┘ └───────┬────────┘ └─────┬──────┘ │
                       └───────────┼──────────────────┼────────────────┼────────┘
                                   ▼                  ▼                ▼
                       ┌────────────────────────────────────────────────────────┐
                       │       Standard Python Statistical Analytics Engine     │
                       │  • Weighted Score Evaluator (Score 0-100)               │
                       │  • Grade Classifier (Grades A+ to F)                   │
                       │  • Feature Importance & Analytics Breakdown            │
                       └────────────────────────────────────────────────────────┘
```

### 1. ⚙️ Statistical Analytics Engine (`train_model.py`)
- **Core Logic**: Pure Standard Python algorithm for feature weighting and score calculation. Zero external heavy library dependencies.
- **Evaluation Parameters**:
  - `study_hours`: Weekly dedicated study time (1 to 40 hrs)
  - `attendance`: Class attendance percentage (45% to 100%)
  - `previous_score`: Prior academic score (30 to 100)
  - `sleep_hours`: Average nightly sleep hours (4 to 10 hrs)
  - `tutoring_sessions`: Monthly tutoring frequency (0 to 6)
  - `stress_level`: Self-reported stress scale (1 to 10)
  - `parent_education`, `extracurricular`, `internet_access`

### 2. ⚡ Flask REST API & SQLite Database Backend (`app.py`, `database.py`)
- **Framework & Database**: Flask application with CORS enabled, backed by SQLite 3 and SQLAlchemy ORM (`data/student_records.db`).
- **Database Models**:
  - `User`: Registered accounts, SHA-256 hashed credentials, roles, and profiles.
  - `PredictionRecord`: Academic parameter inputs, predicted marks, GPA, category, pass probability, and detailed recommendation JSON.
  - `CounselingLog`: Tracked parent advisories, email/call/WhatsApp dispatches.
  - `UserSession`: Secure 7-day bearer token sessions.
- **REST API Endpoints**:
  - `POST /api/predict`: Evaluates performance parameters and automatically archives the record in SQLite.
  - `POST /api/predict-batch`: Cohort CSV evaluation and batch statistics calculation.
  - `GET /api/history`: Retrieves archived prediction logs (with user/limit filters).
  - `DELETE /api/history/<id>`: Removes an archived record.
  - `GET /api/history/stats`: Summarizes total evaluations, average score, and pass rates.
  - `POST /api/counseling/log` & `GET /api/counseling/logs`: Logs counseling notices.
  - `GET /api/model-info` & `GET /api/health`: Model metadata and system health monitoring.
- **Authentication Endpoints**:
  - `POST /api/auth/login`: Authenticates credentials and returns user profile + session bearer token.
  - `POST /api/auth/register`: Creates new user account with assigned role (Student / Teacher / Admin).
  - `GET /api/auth/me`: Validates session token and returns active user details.
  - `POST /api/auth/logout`: Clears session token.
  - `GET /api/auth/demo-users`: Serves pre-configured demo account profiles.

### 3. 🔐 User Roles & Pre-configured Demo Accounts
- 🧑‍🎓 **Student Demo**: `student@demo.edu` / `student123` (Alex Turner - Undergraduate Y2)
- 👨‍🏫 **Teacher / Counselor Demo**: `teacher@demo.edu` / `teacher123` (Prof. Eleanor Vance - Academic Counseling)
- 🛡️ **Dean / Admin Demo**: `admin@demo.edu` / `admin123` (Dean Arthur Davis - Administration)

### 4. 🎨 UI/UX Design & Frontend Engineering (`index.html`, `styles.css`, `app.js`)
- **Glassmorphic Design System**: Modern dark theme with CSS custom property design tokens, Google Fonts (*Outfit* and *Inter*), vibrant accents (`#6366f1`, `#8b5cf6`, `#10b981`), and responsive layouts.
- **Role-Based Auth Widget & Modal**: Header user profile trigger with dropdown menu, 1-click demo login selector chips, show/hide password toggle, and tabbed sign-in/registration.
- **Database History Logs Tab**: Interactive archive viewer with real-time refresh, evaluation metrics, and deletion actions.
- **Interactive Score Gauge**: SVG radial animated gauge displaying target score and letter grade badge.
- **"What-If" Live Simulator**: Dynamic slider calculations showing instant score delta changes.
- **Chart.js Analytics**: Visualizations for Feature Importance horizontal bars, Cohort Grade Distribution doughnut, and Correlation scatter plots.
- **Batch CSV Parser & Exporter**: Drag-and-drop CSV upload, batch predictions table, sample CSV generator, and 1-click results exporter.
- **Resilience**: Embedded client-side fallback engine ensures the frontend works both online with Python server and standalone in any web browser!

---

## 📁 Project Directory Structure

```
student/
├── app.py               # Flask REST API Server & Route Handlers
├── database.py          # SQLAlchemy ORM Models, SQLite Engine & Seed Setup
├── train_model.py       # Performance Analytics Setup Script
├── run_server.py        # Application Launcher
├── requirements.txt     # Python Dependencies (Flask, SQLAlchemy, Pandas, NumPy)
├── index.html           # SPA Dashboard HTML Structure
├── css/
│   └── styles.css       # Production Glassmorphism Design Tokens & CSS
├── js/
│   └── app.js           # Frontend Application Logic, History Sync & Charts
├── data/
│   ├── student_records.db # SQLite Persistent Database
│   └── users.json       # User Accounts Cache
└── models/
    └── metadata.json    # Analytics Checkpoints & Pre-calculated Stats
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.8 or higher installed on your machine.

### Installation & Execution

1. **Navigate to the Workspace Directory**:
   ```bash
   cd c:\Users\sujal\OneDrive\Desktop\student
   ```

2. **Launch the Application**:
   ```bash
   python run_server.py
   ```
   *The server will initialize the analytics engine, start the API on `http://localhost:5000`, and open the web browser automatically.*

3. **Standalone Web View**:
   You can also directly open `index.html` in any browser.

---

## 🛡️ License

Distributed under the MIT License.
