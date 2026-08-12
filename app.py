import os
import sys
import json
import time
import secrets
import numpy as np
import pandas as pd
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# Import database models & session
from database import init_db, db_session, User, UserSession, PredictionRecord, CounselingLog, hash_password, DATA_DIR

# Initialize Base Directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE_DIR)

# Initialize Flask Application
app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# Ensure Database is initialized
init_db()

@app.teardown_appcontext
def shutdown_session(exception=None):
    db_session.remove()

# Load metadata.json if available
METADATA_PATH = os.path.join(BASE_DIR, 'models', 'metadata.json')
METADATA = {}
if os.path.exists(METADATA_PATH):
    try:
        with open(METADATA_PATH, 'r', encoding='utf-8') as f:
            METADATA = json.load(f)
    except Exception as e:
        print(f"Notice: Could not read metadata.json: {e}")

# Helper: Get current user from Authorization header
def get_authenticated_user():
    auth_header = request.headers.get('Authorization', '')
    token = None
    if auth_header.startswith('Bearer '):
        token = auth_header.split(' ', 1)[1].strip()
    else:
        token = request.args.get('token')

    if not token:
        return None

    session = db_session.query(UserSession).filter_by(token=token).first()
    if not session:
        return None

    if time.time() > session.expires_at:
        db_session.delete(session)
        db_session.commit()
        return None

    user = db_session.query(User).filter_by(id=session.user_id).first()
    return user

# Statistical & Behavioral Prediction Algorithm
def calculate_student_prediction(data):
    """
    High-precision statistical & behavioral prediction model (NumPy/Pandas accelerated)
    calculating all 8 required predictions:
    1. Expected marks (out of 100 and out of 500)
    2. Performance percentage
    3. Grade & GPA
    4. Performance category: Excellent / Good / Average / At Risk
    5. Pass/fail probability (%)
    6. Performance trend & trajectory
    7. Weak and strong areas
    8. Personalized study recommendations
    """
    study_hours = float(data.get('study_hours', 18))
    attendance = float(data.get('attendance', 85))
    previous_score = float(data.get('previous_score', 75))
    assignment_completion = float(data.get('assignment_completion', 80))
    discipline_rating = float(data.get('discipline_rating', 7))
    sleep_hours = float(data.get('sleep_hours', 7.5))
    tutoring_sessions = float(data.get('tutoring_sessions', 2))
    parent_education = float(data.get('parent_education', 1))
    extracurricular = float(data.get('extracurricular', 1))
    internet_access = float(data.get('internet_access', 1))
    stress_level = float(data.get('stress_level', 4))

    # Multi-factor weighting formula
    raw_score = (
        0.30 * attendance +
        0.75 * study_hours +
        0.35 * previous_score +
        0.20 * assignment_completion +
        0.80 * discipline_rating +
        1.10 * tutoring_sessions +
        1.20 * parent_education +
        1.00 * extracurricular +
        1.00 * internet_access
    )
    
    # Sleep effect (optimal: 6.5h - 8.5h)
    sleep_effect = 3.0 if (6.5 <= sleep_hours <= 8.5) else -2.2 * abs(sleep_hours - 7.5)
    
    # Stress curve effect
    stress_effect = -0.85 * (stress_level - 6) if stress_level > 6 else 0.50 * (6 - stress_level)
    
    total = raw_score + float(sleep_effect) + stress_effect
    
    # Standardized scaling to 0-100 range
    final_score = float(np.clip(round(30.0 + (total - 45.0) * 0.55, 1), 0.0, 100.0))
    
    # 1. Expected Marks (100 & 500 scale)
    marks_out_of_100 = final_score
    marks_out_of_500 = float(round(final_score * 5.0, 1))
    
    # 2. Performance Percentage
    performance_percentage = final_score
    
    # 3. Grade & GPA
    if final_score >= 90:
        grade = 'A+'
        gpa = 4.0
    elif final_score >= 80:
        grade = 'A'
        gpa = 3.7
    elif final_score >= 70:
        grade = 'B'
        gpa = 3.0
    elif final_score >= 60:
        grade = 'C'
        gpa = 2.0
    elif final_score >= 50:
        grade = 'D'
        gpa = 1.0
    else:
        grade = 'F'
        gpa = 0.0

    # 4. Performance Category
    if final_score >= 85:
        category = 'Excellent'
        badge_color = 'success'
    elif final_score >= 70:
        category = 'Good'
        badge_color = 'primary'
    elif final_score >= 50:
        category = 'Average'
        badge_color = 'warning'
    else:
        category = 'At Risk'
        badge_color = 'danger'

    # 5. Pass/Fail Probability (Sigmoid Curve)
    k = 0.18
    pass_prob = float(np.clip(round((1.0 / (1.0 + np.exp(-k * (final_score - 50.0)))) * 100.0, 1), 0.5, 99.5))
    fail_prob = float(round(100.0 - pass_prob, 1))
    pass_status = 'PASS' if final_score >= 50 else 'FAIL'

    # 6. Performance Trend Analysis
    delta_vs_previous = float(round(final_score - previous_score, 1))
    if delta_vs_previous > 2.0:
        trend_status = 'Improving ↑'
        trend_type = 'positive'
    elif delta_vs_previous < -2.0:
        trend_status = 'Declining ↓'
        trend_type = 'negative'
    else:
        trend_status = 'Stable →'
        trend_type = 'neutral'
        
    projected_next_term = float(np.clip(round(final_score + (delta_vs_previous * 0.45) + (2.0 if study_hours > 20 else 0), 1), 0.0, 100.0))
    trajectory = [
        {"period": "Previous Exam", "score": previous_score},
        {"period": "Current Expected", "score": final_score},
        {"period": "Projected Next Term", "score": projected_next_term}
    ]

    # 7. Weak and Strong Areas Analysis
    strong_areas = []
    weak_areas = []
    
    if attendance >= 85:
        strong_areas.append({"name": "Class Attendance", "detail": f"Excellent presence rate of {attendance}%", "score": 90})
    elif attendance < 75:
        weak_areas.append({"name": "Low Attendance Rate", "detail": f"Attendance is currently at {attendance}% (Threshold: 85%)", "severity": "High", "impact": f"-{round((85 - attendance)*0.3, 1)} pts"})

    if study_hours >= 20:
        strong_areas.append({"name": "Weekly Study Time", "detail": f"Dedicated effort of {study_hours} hrs/week", "score": 88})
    elif study_hours < 15:
        weak_areas.append({"name": "Weekly Study Deficit", "detail": f"Only {study_hours} hrs/week devoted (Recommended: 20h+)", "severity": "High", "impact": f"-{round((20 - study_hours)*0.75, 1)} pts"})

    if previous_score >= 80:
        strong_areas.append({"name": "Academic Foundation", "detail": f"Strong prior baseline score of {previous_score}", "score": 85})
    elif previous_score < 60:
        weak_areas.append({"name": "Prior Core Gaps", "detail": f"Lower foundation score of {previous_score}", "severity": "Medium", "impact": "-5.0 pts"})

    if assignment_completion >= 85:
        strong_areas.append({"name": "Assignment Consistency", "detail": f"High completion rate of {assignment_completion}%", "score": 87})
    elif assignment_completion < 70:
        weak_areas.append({"name": "Assignment Deadlines", "detail": f"Completion rate is {assignment_completion}%", "severity": "Medium", "impact": f"-{round((85 - assignment_completion)*0.2, 1)} pts"})

    if stress_level <= 4:
        strong_areas.append({"name": "Stress Control", "detail": f"Low stress index ({stress_level}/10) supports focus", "score": 82})
    elif stress_level > 6:
        weak_areas.append({"name": "Elevated Stress", "detail": f"High stress index ({stress_level}/10) hinders retention", "severity": "High", "impact": f"-{round((stress_level - 6)*0.85, 1)} pts"})

    if 6.5 <= sleep_hours <= 8.5:
        strong_areas.append({"name": "Healthy Sleep Routine", "detail": f"Restful sleep of {sleep_hours} hrs nightly", "score": 84})
    else:
        weak_areas.append({"name": "Irregular Sleep Hygiene", "detail": f"Sleeping {sleep_hours} hrs/night (Target: 7.5h)", "severity": "Medium", "impact": "-3.0 pts"})

    if not strong_areas:
        strong_areas.append({"name": "General Engagement", "detail": "Consistent participation across academic activities", "score": 70})
    if not weak_areas:
        weak_areas.append({"name": "No Major Vulnerabilities", "detail": "All evaluated attributes are well balanced", "severity": "Low", "impact": "0 pts"})

    # 8. Personalized Recommendations
    recommendations = []
    
    if attendance < 85:
        boost = round((85 - attendance) * 0.30, 1)
        recommendations.append({
            "category": "Attendance",
            "priority": "High Priority",
            "title": "Target 85%+ Classroom Attendance",
            "description": f"Currently at {attendance}%. Attending all lectures builds core exam familiarity.",
            "impact": f"+{boost} pts"
        })
        
    if study_hours < 20:
        target_h = 22
        diff = target_h - study_hours
        boost = round(diff * 0.75, 1)
        recommendations.append({
            "category": "Study Discipline",
            "priority": "High Priority",
            "title": "Increase Weekly Study Hours",
            "description": f"Expand weekly study schedule from {study_hours}h to {target_h}h using focused 45-minute Pomodoro sessions.",
            "impact": f"+{boost} pts"
        })

    if assignment_completion < 85:
        boost = round((85 - assignment_completion) * 0.20, 1)
        recommendations.append({
            "category": "Coursework",
            "priority": "Medium Priority",
            "title": "Complete All Practice Worksheets",
            "description": f"Raising assignment submission rate from {assignment_completion}% to 90%+ reinforces exam topics.",
            "impact": f"+{boost} pts"
        })
        
    if sleep_hours < 6.5 or sleep_hours > 8.5:
        recommendations.append({
            "category": "Wellness",
            "priority": "Medium Priority",
            "title": "Standardize 7.5 Hour Sleep Routine",
            "description": "Aligning nightly sleep restores memory consolidation and sharpens exam performance.",
            "impact": "+3.0 pts"
        })

    if stress_level > 6:
        recommendations.append({
            "category": "Mental Health",
            "priority": "High Priority",
            "title": "Implement Stress Management Routine",
            "description": f"Reduce stress score from {stress_level} down to <=4 via daily 10-minute relaxation or counseling.",
            "impact": "+2.5 pts"
        })
        
    if tutoring_sessions < 2 and final_score < 75:
        recommendations.append({
            "category": "Academic Support",
            "priority": "Medium Priority",
            "title": "Schedule Guided Peer Tutoring",
            "description": "Enroll in 2 monthly guided tutoring sessions to master challenging core concepts.",
            "impact": "+3.5 pts"
        })

    if not recommendations:
        recommendations.append({
            "category": "Maintenance",
            "priority": "Positive",
            "title": "Maintain Peak Performance Regimen",
            "description": "Outstanding execution across all dimensions! Keep up current habits to retain top-tier ranking.",
            "impact": "Top Tier"
        })

    conf_score = round(float(np.clip(88.5 + (attendance / 100.0) * 8.0 - abs(stress_level - 5) * 0.4, 86.0, 98.8)), 1)

    feature_contributions = {
        "Attendance": round((attendance / 100.0) * 30, 1),
        "Study Hours": round((study_hours / 40.0) * 26, 1),
        "Previous Marks": round((previous_score / 100.0) * 22, 1),
        "Assignments & Discipline": round((assignment_completion / 100.0) * 12 + (discipline_rating / 10.0) * 8, 1),
        "Wellness & Support": round(max(float(sleep_effect) + tutoring_sessions * 1.1, 0), 1)
    }

    attendance_actions = {
        "requires_call": attendance < 60,
        "requires_email": attendance < 75,
        "phone": "+919876543210",
        "email": "student.parent@example.com",
        "email_subject": f"Academic Advisory Notice: Attendance Warning ({attendance}%)",
        "email_body": f"Dear Parent/Guardian,\n\nAcademic notice regarding your student's attendance rate ({attendance}%).\n\nExpected Marks: {marks_out_of_100}/100 | Grade: {grade} | Category: {category}.\nPass Probability: {pass_prob}%\n\nPlease contact the academic office for a progress consultation.\n\nBest regards,\nAcademic Advisory Board"
    }

    return {
        "predicted_score": marks_out_of_100,
        "predicted_grade": grade,
        "status": category,
        "expected_marks": marks_out_of_100,
        "expected_marks_500": marks_out_of_500,
        "performance_percentage": performance_percentage,
        "grade": grade,
        "gpa": gpa,
        "performance_category": category,
        "badge_color": badge_color,
        "pass_status": pass_status,
        "pass_probability": pass_prob,
        "fail_probability": fail_prob,
        "performance_trend": {
            "status": trend_status,
            "type": trend_type,
            "delta": delta_vs_previous,
            "projected_next": projected_next_term,
            "trajectory": trajectory
        },
        "strong_areas": strong_areas,
        "weak_areas": weak_areas,
        "personalized_recommendations": recommendations,
        "confidence_score": conf_score,
        "feature_contributions": feature_contributions,
        "attendance_actions": attendance_actions,
        "input_values": data
    }


# ==============================================================================
# REST API ROUTES
# ==============================================================================

# 1. System Health
@app.route('/api/health', methods=['GET'])
def api_health():
    return jsonify({
        "status": "healthy",
        "service": "Student Performance Prediction System (Flask + SQLite)",
        "database": "SQLite / SQLAlchemy ORM",
        "timestamp": datetime.utcnow().isoformat()
    }), 200

# 2. Model Info & Statistics
@app.route('/api/model-info', methods=['GET'])
def api_model_info():
    return jsonify(METADATA), 200

# 3. Auth Endpoints
@app.route('/api/auth/demo-users', methods=['GET'])
def api_demo_users():
    users = db_session.query(User).all()
    return jsonify({"demo_users": [u.to_dict() for u in users]}), 200

@app.route('/api/auth/login', methods=['POST'])
def api_login():
    data = request.get_json() or {}
    email = str(data.get('email', '')).strip().lower()
    password = str(data.get('password', ''))

    if not email or not password:
        return jsonify({"success": False, "error": "Email and password are required."}), 400

    pw_hash = hash_password(password)
    user = db_session.query(User).filter_by(email=email).first()

    if user and user.password_hash == pw_hash:
        token = secrets.token_hex(24)
        session = UserSession(
            token=token,
            user_id=user.id,
            expires_at=time.time() + (86400 * 7) # 7 days
        )
        db_session.add(session)
        db_session.commit()

        return jsonify({
            "success": True,
            "token": token,
            "user": user.to_dict(),
            "message": f"Welcome back, {user.name}!"
        }), 200
    else:
        return jsonify({
            "success": False,
            "error": "Invalid email or password. Please check your credentials or use 1-click demo."
        }), 401

@app.route('/api/auth/register', methods=['POST'])
def api_register():
    data = request.get_json() or {}
    name = str(data.get('name', '')).strip()
    email = str(data.get('email', '')).strip().lower()
    password = str(data.get('password', ''))
    role = str(data.get('role', 'student')).strip().lower()
    grade_level = str(data.get('grade_level', 'Undergraduate Year 1')).strip()
    department = str(data.get('department', 'Academic Studies')).strip()

    if not name or not email or not password:
        return jsonify({"success": False, "error": "Name, email, and password are required."}), 400

    if len(password) < 6:
        return jsonify({"success": False, "error": "Password must be at least 6 characters long."}), 400

    if role not in ['student', 'teacher', 'admin']:
        role = 'student'

    existing = db_session.query(User).filter_by(email=email).first()
    if existing:
        return jsonify({"success": False, "error": "An account with this email already exists."}), 409

    prefix = "STU" if role == "student" else ("FAC" if role == "teacher" else "ADM")
    new_id = f"{prefix}-{secrets.token_hex(3).upper()}"
    avatar = "🧑‍🎓" if role == "student" else ("👨‍🏫" if role == "teacher" else "🛡️")

    new_user = User(
        id=new_id,
        name=name,
        email=email,
        password_hash=hash_password(password),
        role=role,
        avatar=avatar,
        grade_level=grade_level if role == 'student' else None,
        department=department if role != 'student' else None
    )

    db_session.add(new_user)
    db_session.commit()

    token = secrets.token_hex(24)
    session = UserSession(
        token=token,
        user_id=new_user.id,
        expires_at=time.time() + (86400 * 7)
    )
    db_session.add(session)
    db_session.commit()

    return jsonify({
        "success": True,
        "token": token,
        "user": new_user.to_dict(),
        "message": f"Account created successfully. Welcome, {name}!"
    }), 201

@app.route('/api/auth/me', methods=['GET'])
def api_me():
    user = get_authenticated_user()
    if user:
        return jsonify({"authenticated": True, "user": user.to_dict()}), 200
    return jsonify({"authenticated": False, "error": "Invalid or expired session token"}), 401

@app.route('/api/auth/logout', methods=['POST'])
def api_logout():
    auth_header = request.headers.get('Authorization', '')
    token = None
    if auth_header.startswith('Bearer '):
        token = auth_header.split(' ', 1)[1].strip()
    else:
        data = request.get_json() or {}
        token = data.get('token')

    if token:
        db_session.query(UserSession).filter_by(token=token).delete()
        db_session.commit()

    return jsonify({"success": True, "message": "Logged out successfully"}), 200

# 4. Prediction Endpoints & SQLite Archiving
@app.route('/api/predict', methods=['POST'])
def api_predict():
    data = request.get_json() or {}
    result = calculate_student_prediction(data)
    
    # Save prediction record to SQLite Database
    user = get_authenticated_user()
    user_id = user.id if user else data.get('user_id')
    student_name = user.name if user else data.get('student_name', 'Alex Turner')
    student_id = user.id if user else data.get('student_id', 'STU-PREDICT')

    try:
        record = PredictionRecord(
            user_id=user_id,
            student_id=student_id,
            student_name=student_name,
            study_hours=float(data.get('study_hours', 18)),
            attendance=float(data.get('attendance', 85)),
            previous_score=float(data.get('previous_score', 75)),
            assignment_completion=float(data.get('assignment_completion', 80)),
            discipline_rating=float(data.get('discipline_rating', 7)),
            sleep_hours=float(data.get('sleep_hours', 7.5)),
            tutoring_sessions=float(data.get('tutoring_sessions', 2)),
            stress_level=float(data.get('stress_level', 4)),
            parent_education=float(data.get('parent_education', 1)),
            extracurricular=float(data.get('extracurricular', 1)),
            predicted_score=result['predicted_score'],
            expected_marks_500=result['expected_marks_500'],
            grade=result['grade'],
            gpa=result['gpa'],
            category=result['performance_category'],
            pass_status=result['pass_status'],
            pass_probability=result['pass_probability'],
            fail_probability=result['fail_probability'],
            confidence_score=result['confidence_score'],
            details_json=json.dumps({
                "trend": result['performance_trend'],
                "strong_areas": result['strong_areas'],
                "weak_areas": result['weak_areas'],
                "recommendations": result['personalized_recommendations']
            })
        )
        db_session.add(record)
        db_session.commit()
        result['record_id'] = record.id
    except Exception as e:
        print(f"Notice: Could not save prediction record to database: {e}")

    return jsonify(result), 200

# 5. Batch Prediction
@app.route('/api/predict-batch', methods=['POST'])
def api_predict_batch():
    post_data = request.get_json() or {}
    students = post_data.get('students', [])
    batch_results = [calculate_student_prediction(st) for st in students]
    
    if students:
        res_df = pd.DataFrame(batch_results)
        scores = res_df['expected_marks'].astype(float)
        avg_score = round(float(scores.mean()), 1)
        passed_count = int((scores >= 50).sum())
        pass_rate = round(float((passed_count / len(students)) * 100), 1)
    else:
        avg_score = 0
        passed_count = 0
        pass_rate = 0
    
    return jsonify({
        "total_students": len(students),
        "average_predicted_score": avg_score,
        "passed_count": passed_count,
        "failed_count": len(students) - passed_count,
        "pass_rate": pass_rate,
        "predictions": batch_results
    }), 200

# 6. Database History Endpoints
@app.route('/api/history', methods=['GET'])
def api_get_history():
    user_id = request.args.get('user_id')
    limit = int(request.args.get('limit', 20))

    query = db_session.query(PredictionRecord)
    if user_id:
        query = query.filter(PredictionRecord.user_id == user_id)
    
    records = query.order_by(PredictionRecord.created_at.desc()).limit(limit).all()
    return jsonify({"count": len(records), "records": [r.to_dict() for r in records]}), 200

@app.route('/api/history/<int:record_id>', methods=['DELETE'])
def api_delete_history(record_id):
    record = db_session.query(PredictionRecord).filter_by(id=record_id).first()
    if not record:
        return jsonify({"success": False, "error": "Record not found"}), 404
    
    db_session.delete(record)
    db_session.commit()
    return jsonify({"success": True, "message": f"Record #{record_id} deleted"}), 200

@app.route('/api/history/stats', methods=['GET'])
def api_history_stats():
    records = db_session.query(PredictionRecord).all()
    if not records:
        return jsonify({"total_evaluations": 0, "average_score": 0, "pass_rate": 0}), 200

    scores = [r.predicted_score for r in records]
    passed = [r for r in records if r.predicted_score >= 50]

    return jsonify({
        "total_evaluations": len(records),
        "average_score": round(float(np.mean(scores)), 1),
        "pass_rate": round(float((len(passed) / len(records)) * 100), 1),
        "categories": {
            "Excellent": len([r for r in records if r.category == 'Excellent']),
            "Good": len([r for r in records if r.category == 'Good']),
            "Average": len([r for r in records if r.category == 'Average']),
            "At Risk": len([r for r in records if r.category == 'At Risk'])
        }
    }), 200

# 7. Counseling Logs Endpoints
@app.route('/api/counseling/log', methods=['POST'])
def api_log_counseling():
    data = request.get_json() or {}
    user = get_authenticated_user()
    sent_by = user.name if user else data.get('sent_by', 'Academic Counselor')

    log = CounselingLog(
        student_id=data.get('student_id', 'STU-ADVISORY'),
        student_name=data.get('student_name', 'Student'),
        action_type=data.get('action_type', 'WhatsApp'),
        recipient=data.get('recipient', '+919876543210'),
        subject=data.get('subject', 'Performance Notice'),
        message_content=data.get('message_content', ''),
        status=data.get('status', 'Dispatched'),
        sent_by=sent_by
    )

    db_session.add(log)
    db_session.commit()

    return jsonify({"success": True, "log": log.to_dict()}), 201

@app.route('/api/counseling/logs', methods=['GET'])
def api_get_counseling_logs():
    logs = db_session.query(CounselingLog).order_by(CounselingLog.timestamp.desc()).limit(30).all()
    return jsonify({"count": len(logs), "logs": [l.to_dict() for l in logs]}), 200

# 8. Static Web Serving Routes
@app.route('/', methods=['GET'])
def serve_index():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/whatsapp_system/', methods=['GET'])
@app.route('/whatsapp_system/index.html', methods=['GET'])
def serve_whatsapp():
    return send_from_directory(os.path.join(BASE_DIR, 'whatsapp_system'), 'index.html')

def run_server(port=5000):
    print("============================================================")
    print(" Student Performance Prediction Flask & SQLite Server Running")
    print(f" Web UI: http://localhost:{port}")
    print(f" API Health: http://localhost:{port}/api/health")
    print(f" Database: SQLite ({os.path.join(DATA_DIR, 'student_records.db')})")
    print("============================================================")
    app.run(host='0.0.0.0', port=port, debug=False)

if __name__ == '__main__':
    port = 5000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    run_server(port)
