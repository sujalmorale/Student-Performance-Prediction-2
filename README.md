# 🎓 Student Performance Prediction System

An end-to-end, production-ready web application designed for academic performance analysis, predictive evaluation, and counseling guidance. The application is secured by a **full authentication gate with Flask sessions, Werkzeug password security, SQLite database persistence, and protected dashboard routing**.

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Python](https://img.shields.io/badge/Python-3.9+-green.svg)
![Backend](https://img.shields.io/badge/Backend-Flask%20%7C%20SQLite%20%7C%20SQLAlchemy-red.svg)
![Frontend](https://img.shields.io/badge/Frontend-HTML5%20%7C%20CSS3%20%7C%20JS-purple.svg)

---

## 🔒 Authentication Flow & Security Architecture

```
                       ┌────────────────────────┐
                       │  Open Web Application   │
                       │ (http://localhost:5000)│
                       └───────────┬────────────┘
                                   │
                                   ▼
                       ┌────────────────────────┐
                       │     /login Portal      │
                       │ (Unauthenticated Gate) │
                       └───────────┬────────────┘
                                   │
                        Successful Authentication?
                                   │
                     ┌─────────────┴─────────────┐
                     │                           │
                   [YES]                        [NO]
                     │                           │
                     ▼                           ▼
        ┌─────────────────────────┐    ┌────────────────────┐
        │  /dashboard (Protected) │    │ Display Validation │
        │  • Single Predictor     │    │ & Error Flash Msg  │
        │  • "What-If" Simulator  │    └────────────────────┘
        │  • Chart.js Analytics   │
        │  • Batch CSV Exporter   │
        │  • Voice AI Assistant   │
        │  • WhatsApp Link Gateway│
        │  • Database History     │
        └────────────┬────────────┘
                     │
               User clicks Logout
                     │
                     ▼
        ┌─────────────────────────┐
        │ Session Destroyed &     │
        │ Redirected to /login    │
        │ (Cache-Control Gated)   │
        └─────────────────────────┘
```

---

## 🔑 Pre-Configured Test Credentials

| Role | Username / Email | Password | Name / Profile |
| :--- | :--- | :--- | :--- |
| 🧑‍🎓 **Student Account** | `student@demo.edu` | `student123` | **Alex Turner** *(Undergraduate Year 2, CS & AI)* |
| 👨‍🏫 **Teacher / Counselor** | `teacher@demo.edu` | `teacher123` | **Prof. Eleanor Vance** *(Academic Counseling & Statistics)* |
| 🛡️ **Administrator / Dean** | `admin@demo.edu` | `admin123` | **Dean Arthur Davis** *(Academic Affairs & Administration)* |

---

## 📁 Complete Project Directory Structure

```
student/
├── app.py                     # Flask Server with @login_required, Werkzeug Auth & REST APIs
├── database.py                # SQLAlchemy ORM Models (User, PredictionRecord, CounselingLog)
├── train_model.py             # Performance Analytics Setup Script
├── run_server.py              # Application Launcher (Auto-opens browser)
├── requirements.txt           # Python Dependencies (Flask, SQLAlchemy, Werkzeug, Pandas, NumPy)
│
├── templates/
│   ├── login.html             # Dedicated Full-Page Glassmorphic Login Portal
│   ├── signup.html            # Dedicated Full-Page Registration Portal
│   ├── forgot_password.html   # Password Recovery Page
│   └── dashboard.html         # Protected Main Academic Dashboard (All Features & Logout)
│
├── static/
│   ├── css/
│   │   ├── auth.css           # Glassmorphism Stylesheet for Login/Signup/Reset
│   │   └── styles.css         # Main Dashboard Glassmorphism Design Tokens & CSS
│   └── js/
│       ├── auth.js            # Password Reveal, Live Validation & Demo Autofill
│       └── app.js             # Dashboard Predictions, Simulator, Charts & Voice
│
├── css/
│   └── styles.css             # Main Dashboard Styles (Legacy Mirror)
├── js/
│   └── app.js                 # Dashboard Scripts (Legacy Mirror)
├── whatsapp_system/           # WhatsApp Link Gateway & Counselor Dispatcher
├── data/
│   └── student_records.db     # SQLite Persistent Database
└── models/
    └── metadata.json          # Analytics Checkpoints & Feature Weights
```

---

## ⚡ Core Features & Modules

### 1. 🔐 Authentication & Session Security
- **Strict Login Gate**: When opening `http://localhost:5000/`, users are strictly routed to `/login`. Direct access to `/dashboard`, `/whatsapp_system/`, and prediction APIs is blocked.
- **Werkzeug Security**: Passwords hashed with secure salt (`generate_password_hash` / `check_password_hash`).
- **Flask Session Guard**: Server-side encrypted session cookies (`session['user_id']`) with `@login_required` view decorators.
- **Browser Back-Button Protection**: `Cache-Control: no-store, no-cache, must-revalidate` headers ensure logging out locks access immediately.

### 2. 🗄️ SQLite Database Persistence (`database.py`)
- **SQLAlchemy ORM Models**:
  - `User`: User accounts, hashed passwords, roles (`student`, `teacher`, `admin`), profile details.
  - `PredictionRecord`: Auto-archives every student prediction run with complete input factors, predicted score, grade, GPA, and recommendations.
  - `CounselingLog`: Tracks advisory notices, emails, and parent communications.
  - `UserSession`: 7-day bearer token sessions for API access.

### 3. 🎯 Machine Learning & Predictive Analytics Engine
- **8 Core Prediction Metrics**: Expected Marks (/100 and /500), Performance Percentage, Letter Grade (A+ to F), GPA (4.0 scale), Category (Excellent / Good / Average / At Risk), Pass/Fail Probability, Performance Trend Trajectory, and Weak/Strong Area Breakdown.
- **"What-If" Live Scenario Simulator**: Dynamic slider simulations showing live score deltas.
- **Chart.js Visual Analytics**: Student Competency Profile (Radar), Trajectory Trend (Line), Cohort Distribution (Doughnut), and Feature Importance (Horizontal Bar).
- **Batch CSV Evaluation & Exporter**: Upload cohort CSV, batch predict, sample generator, and export results.
- **Nova AI Voice Guide**: Speech synthesis and voice recognition for interactive spoken reports.
- **WhatsApp Link Gateway**: Generates shareable, pre-filled WhatsApp report links for parents and mentors.

---

## 🚀 Installation & How to Run

### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Start the Application
```bash
python run_server.py
```
*The launcher will initialize the SQLite database, start the Flask server on `http://localhost:5000`, and open your browser directly to the Login page.*

### Step 3: Sign In
- Use one of the **1-Click Demo** buttons on the Login page (`🧑‍🎓 Student`, `👨‍🏫 Teacher`, `🛡️ Admin`), or
- Enter `student@demo.edu` / `student123`, or
- Click **"Create Account"** to register a new user!

---

## 🛡️ License
Distributed under the MIT License.
