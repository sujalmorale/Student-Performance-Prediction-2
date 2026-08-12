import os
import time
import hashlib
import json
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, scoped_session, relationship

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
os.makedirs(DATA_DIR, exist_ok=True)

DB_PATH = os.path.join(DATA_DIR, 'student_records.db')
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
db_session = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))

Base = declarative_base()
Base.query = db_session.query_property()

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

class User(Base):
    __tablename__ = 'users'

    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, nullable=False, index=True)
    password_hash = Column(String(256), nullable=False)
    role = Column(String(20), default='student', index=True) # student, teacher, admin
    avatar = Column(String(20), default='🧑‍🎓')
    grade_level = Column(String(50), nullable=True)
    major = Column(String(100), nullable=True)
    department = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    predictions = relationship('PredictionRecord', back_populates='user', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "avatar": self.avatar,
            "grade_level": self.grade_level,
            "major": self.major,
            "department": self.department,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class UserSession(Base):
    __tablename__ = 'user_sessions'

    id = Column(Integer, primary_key=True, autoincrement=True)
    token = Column(String(64), unique=True, nullable=False, index=True)
    user_id = Column(String(50), ForeignKey('users.id'), nullable=False)
    expires_at = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship('User')

class PredictionRecord(Base):
    __tablename__ = 'prediction_records'

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey('users.id'), nullable=True, index=True)
    student_id = Column(String(50), nullable=True, default='STU-CUSTOM')
    student_name = Column(String(100), nullable=True, default='Student')
    
    # Input parameters
    study_hours = Column(Float, nullable=False)
    attendance = Column(Float, nullable=False)
    previous_score = Column(Float, nullable=False)
    assignment_completion = Column(Float, default=80.0)
    discipline_rating = Column(Float, default=7.0)
    sleep_hours = Column(Float, default=7.5)
    tutoring_sessions = Column(Float, default=2.0)
    stress_level = Column(Float, default=4.0)
    parent_education = Column(Float, default=1.0)
    extracurricular = Column(Float, default=1.0)

    # Prediction outputs
    predicted_score = Column(Float, nullable=False)
    expected_marks_500 = Column(Float, nullable=False)
    grade = Column(String(10), nullable=False)
    gpa = Column(Float, nullable=False)
    category = Column(String(20), nullable=False)
    pass_status = Column(String(10), nullable=False)
    pass_probability = Column(Float, nullable=False)
    fail_probability = Column(Float, nullable=False)
    confidence_score = Column(Float, default=92.0)
    
    # Detailed JSON payload (recommendations, trends, strong/weak areas)
    details_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship('User', back_populates='predictions')

    def to_dict(self):
        details = {}
        if self.details_json:
            try:
                details = json.loads(self.details_json)
            except Exception:
                details = {}

        return {
            "id": self.id,
            "user_id": self.user_id,
            "student_id": self.student_id,
            "student_name": self.student_name,
            "study_hours": self.study_hours,
            "attendance": self.attendance,
            "previous_score": self.previous_score,
            "assignment_completion": self.assignment_completion,
            "discipline_rating": self.discipline_rating,
            "sleep_hours": self.sleep_hours,
            "tutoring_sessions": self.tutoring_sessions,
            "stress_level": self.stress_level,
            "predicted_score": self.predicted_score,
            "expected_marks": self.predicted_score,
            "expected_marks_500": self.expected_marks_500,
            "grade": self.grade,
            "gpa": self.gpa,
            "category": self.category,
            "pass_status": self.pass_status,
            "pass_probability": self.pass_probability,
            "fail_probability": self.fail_probability,
            "confidence_score": self.confidence_score,
            "details": details,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None
        }

class CounselingLog(Base):
    __tablename__ = 'counseling_logs'

    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(String(50), nullable=False)
    student_name = Column(String(100), default='Student')
    action_type = Column(String(20), nullable=False) # 'Email', 'Call', 'WhatsApp', 'Meeting'
    recipient = Column(String(150), nullable=False)
    subject = Column(String(200), nullable=True)
    message_content = Column(Text, nullable=False)
    status = Column(String(20), default='Sent')
    sent_by = Column(String(100), default='Academic Counselor')
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "student_id": self.student_id,
            "student_name": self.student_name,
            "action_type": self.action_type,
            "recipient": self.recipient,
            "subject": self.subject,
            "message_content": self.message_content,
            "status": self.status,
            "sent_by": self.sent_by,
            "timestamp": self.timestamp.strftime("%Y-%m-%d %H:%M:%S") if self.timestamp else None
        }

def init_db():
    """Create tables and seed initial demo accounts & sample data"""
    Base.metadata.create_all(bind=engine)
    session = db_session()

    # Check if demo users exist
    if session.query(User).count() == 0:
        demo_users = [
            User(
                id="STU-2026-081",
                name="Alex Turner",
                email="student@demo.edu",
                password_hash=hash_password("student123"),
                role="student",
                avatar="🧑‍🎓",
                grade_level="Undergraduate Year 2",
                major="Computer Science & AI"
            ),
            User(
                id="FAC-9041",
                name="Prof. Eleanor Vance",
                email="teacher@demo.edu",
                password_hash=hash_password("teacher123"),
                role="teacher",
                avatar="👨‍🏫",
                department="Academic Counseling & Statistics"
            ),
            User(
                id="ADM-1001",
                name="Dean Arthur Davis",
                email="admin@demo.edu",
                password_hash=hash_password("admin123"),
                role="admin",
                avatar="🛡️",
                department="Academic Affairs & Administration"
            )
        ]
        session.add_all(demo_users)
        session.commit()
        print("[OK] Database initialized with default demo accounts.")

        # Seed sample historical predictions
        sample_records = [
            PredictionRecord(
                user_id="STU-2026-081",
                student_id="STU-2026-081",
                student_name="Alex Turner",
                study_hours=24.0,
                attendance=92.0,
                previous_score=84.0,
                assignment_completion=90.0,
                discipline_rating=8.0,
                sleep_hours=7.5,
                tutoring_sessions=2.0,
                stress_level=3.0,
                predicted_score=87.5,
                expected_marks_500=437.5,
                grade="A",
                gpa=3.7,
                category="Excellent",
                pass_status="PASS",
                pass_probability=98.2,
                fail_probability=1.8,
                confidence_score=95.4,
                details_json=json.dumps({"trend": "Improving", "weak_areas": [], "strong_areas": [{"name": "Attendance", "score": 92}]})
            ),
            PredictionRecord(
                user_id="STU-2026-081",
                student_id="STU-2026-081",
                student_name="Alex Turner",
                study_hours=18.0,
                attendance=85.0,
                previous_score=75.0,
                assignment_completion=82.0,
                discipline_rating=7.0,
                sleep_hours=7.0,
                tutoring_sessions=1.0,
                stress_level=5.0,
                predicted_score=76.8,
                expected_marks_500=384.0,
                grade="B",
                gpa=3.0,
                category="Good",
                pass_status="PASS",
                pass_probability=94.5,
                fail_probability=5.5,
                confidence_score=91.0,
                details_json=json.dumps({"trend": "Stable", "weak_areas": [], "strong_areas": [{"name": "Coursework", "score": 82}]})
            )
        ]
        session.add_all(sample_records)
        session.commit()
        print("[OK] Database seeded with initial student prediction history.")

    session.close()

if __name__ == '__main__':
    init_db()
    print("Database tables & initial records ready in:", DB_PATH)
