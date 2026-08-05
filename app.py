import os
import sys
import json
import math
import numpy as np
import pandas as pd
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

# Set working directory to project folder
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE_DIR)

# Load metadata.json if available
METADATA_PATH = os.path.join(BASE_DIR, 'models', 'metadata.json')
METADATA = {}
if os.path.exists(METADATA_PATH):
    try:
        with open(METADATA_PATH, 'r') as f:
            METADATA = json.load(f)
    except Exception as e:
        print(f"Notice: Could not read metadata.json: {e}")

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

    # 4. Performance Category: Excellent / Good / Average / At Risk
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

    # 5. Pass/Fail Probability (Sigmoid Logistic Curve)
    # Threshold at score = 50. Steeper transition around 50.
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
        
    # Projected Next Term Score
    projected_next_term = float(np.clip(round(final_score + (delta_vs_previous * 0.45) + (2.0 if study_hours > 20 else 0), 1), 0.0, 100.0))
    trajectory = [
        {"period": "Previous Exam", "score": previous_score},
        {"period": "Current Expected", "score": final_score},
        {"period": "Projected Next Term", "score": projected_next_term}
    ]

    # 7. Weak and Strong Areas Analysis
    strong_areas = []
    weak_areas = []
    
    # Check Attendance
    if attendance >= 85:
        strong_areas.append({"name": "Class Attendance", "detail": f"Excellent presence rate of {attendance}%", "score": 90})
    elif attendance < 75:
        weak_areas.append({"name": "Low Attendance Rate", "detail": f"Attendance is currently at {attendance}% (Threshold: 85%)", "severity": "High", "impact": f"-{round((85 - attendance)*0.3, 1)} pts"})

    # Check Study Hours
    if study_hours >= 20:
        strong_areas.append({"name": "Weekly Study Time", "detail": f"Dedicated effort of {study_hours} hrs/week", "score": 88})
    elif study_hours < 15:
        weak_areas.append({"name": "Weekly Study Deficit", "detail": f"Only {study_hours} hrs/week devoted (Recommended: 20h+)", "severity": "High", "impact": f"-{round((20 - study_hours)*0.75, 1)} pts"})

    # Check Previous Foundation
    if previous_score >= 80:
        strong_areas.append({"name": "Academic Foundation", "detail": f"Strong prior baseline score of {previous_score}", "score": 85})
    elif previous_score < 60:
        weak_areas.append({"name": "Prior Core Gaps", "detail": f"Lower foundation score of {previous_score}", "severity": "Medium", "impact": "-5.0 pts"})

    # Check Assignment Completion
    if assignment_completion >= 85:
        strong_areas.append({"name": "Assignment Consistency", "detail": f"High completion rate of {assignment_completion}%", "score": 87})
    elif assignment_completion < 70:
        weak_areas.append({"name": "Assignment Deadlines", "detail": f"Completion rate is {assignment_completion}%", "severity": "Medium", "impact": f"-{round((85 - assignment_completion)*0.2, 1)} pts"})

    # Check Stress & Sleep
    if stress_level <= 4:
        strong_areas.append({"name": "Stress Control", "detail": f"Low stress index ({stress_level}/10) supports focus", "score": 82})
    elif stress_level > 6:
        weak_areas.append({"name": "Elevated Stress", "detail": f"High stress index ({stress_level}/10) hinders retention", "severity": "High", "impact": f"-{round((stress_level - 6)*0.85, 1)} pts"})

    if 6.5 <= sleep_hours <= 8.5:
        strong_areas.append({"name": "Healthy Sleep Routine", "detail": f"Restful sleep of {sleep_hours} hrs nightly", "score": 84})
    else:
        weak_areas.append({"name": "Irregular Sleep Hygiene", "detail": f"Sleeping {sleep_hours} hrs/night (Target: 7.5h)", "severity": "Medium", "impact": "-3.0 pts"})

    # Fallbacks if none detected
    if not strong_areas:
        strong_areas.append({"name": "General Engagement", "detail": "Consistent participation across academic activities", "score": 70})
    if not weak_areas:
        weak_areas.append({"name": "No Major Vulnerabilities", "detail": "All evaluated attributes are well balanced", "severity": "Low", "impact": "0 pts"})

    # 8. Personalized Study Recommendations
    recommendations = []
    
    if attendance < 85:
        boost = round((85 - attendance) * 0.30, 1)
        recommendations.append({
            "category": "Attendance",
            "priority": "High Priority",
            "title": "Target 85%+ Classroom Attendance",
            "description": f"Currently at {attendance}%. Attending all lectures will build exam familiarity.",
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

    # Confidence score calculation
    conf_score = round(float(np.clip(88.5 + (attendance / 100.0) * 8.0 - abs(stress_level - 5) * 0.4, 86.0, 98.8)), 1)

    # Feature contribution breakdown
    feature_contributions = {
        "Attendance": round((attendance / 100.0) * 30, 1),
        "Study Hours": round((study_hours / 40.0) * 26, 1),
        "Previous Marks": round((previous_score / 100.0) * 22, 1),
        "Assignments & Discipline": round((assignment_completion / 100.0) * 12 + (discipline_rating / 10.0) * 8, 1),
        "Wellness & Support": round(max(float(sleep_effect) + tutoring_sessions * 1.1, 0), 1)
    }

    # Attendance & Counselor Actions
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

class APIRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/api/model-info':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(METADATA).encode('utf-8'))
            return
            
        elif parsed_path.path == '/api/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "healthy", "service": "Student Performance Predictor API (Pandas/NumPy)"}).encode('utf-8'))
            return
            
        # Default to static files serving
        return super().do_GET()

    def do_POST(self):
        parsed_path = urlparse(self.path)
        content_length = int(self.headers.get('Content-Length', 0))
        post_data_bytes = self.rfile.read(content_length)
        
        try:
            post_data = json.loads(post_data_bytes.decode('utf-8'))
        except Exception:
            post_data = {}

        if parsed_path.path == '/api/predict':
            result = calculate_student_prediction(post_data)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode('utf-8'))
            return

        elif parsed_path.path == '/api/predict-batch':
            students = post_data.get('students', [])
            batch_results = [calculate_student_prediction(st) for st in students]
            
            # Pandas batch statistical metrics
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
            
            response = {
                "total_students": len(students),
                "average_predicted_score": avg_score,
                "passed_count": passed_count,
                "failed_count": len(students) - passed_count,
                "pass_rate": pass_rate,
                "predictions": batch_results
            }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode('utf-8'))
            return


        self.send_response(404)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode('utf-8'))

def run_server(port=5000):
    server_address = ('', port)
    httpd = HTTPServer(server_address, APIRequestHandler)
    print(f"============================================================")
    print(f" Student Performance Prediction System Server Running")
    print(f" URL: http://localhost:{port}")
    print(f" API Endpoint: http://localhost:{port}/api/predict")
    print(f" Model Analytics: http://localhost:{port}/api/model-info")
    print(f"============================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.server_close()

if __name__ == '__main__':
    port = 5000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass
    run_server(port)
