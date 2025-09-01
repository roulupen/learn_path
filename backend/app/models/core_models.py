"""
Core data models for the LearnPath learning management system
"""
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, Float, DateTime
from datetime import datetime
from app.database import Base

class User(Base):
    """User model for learners"""
    __tablename__ = "lp_users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    
    def __repr__(self):
        return f"<User(id={self.id}, name='{self.name}', username='{self.username}')>"

class Course(Base):
    """Learning course with duration selection"""
    __tablename__ = "lp_courses"
    
    id = Column(Integer, primary_key=True, index=True)
    course_name = Column(String(200), nullable=False)
    course_description = Column(Text, nullable=True)  # Optional description
    duration_days = Column(Integer, nullable=False)  # 15, 20, or 30
    user_id = Column(Integer, ForeignKey("lp_users.id"), nullable=False)
    is_custom = Column(Boolean, default=False)  # True if user-created course
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<Course(id={self.id}, name='{self.course_name}', duration={self.duration_days}, user_id={self.user_id}, custom={self.is_custom})>"

class Plan(Base):
    """Daily study plans"""
    __tablename__ = "lp_study_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    day_number = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)  # Study plan content for the day
    course_id = Column(Integer, ForeignKey("lp_courses.id"), nullable=False)
    
    def __repr__(self):
        return f"<Plan(id={self.id}, day={self.day_number}, course_id={self.course_id})>"

class Question(Base):
    """Learning questions for each day with difficulty and points"""
    __tablename__ = "lp_questions"
    
    id = Column(Integer, primary_key=True, index=True)
    day_number = Column(Integer, nullable=False)
    question = Column(Text, nullable=False)
    difficulty = Column(String(20), nullable=False)  # beginner, intermediate, advanced
    points = Column(Integer, nullable=False)
    correct_answer = Column(Text, nullable=False)
    options = Column(Text, nullable=True)  # JSON string for multiple choice options
    question_type = Column(String(50), nullable=True)  # code_analysis, debugging, algorithm, best_practice, conceptual
    code_snippet = Column(Text, nullable=True)  # Optional code for programming questions
    course_id = Column(Integer, ForeignKey("lp_courses.id"), nullable=False)
    
    def __repr__(self):
        return f"<Question(id={self.id}, day={self.day_number}, difficulty='{self.difficulty}', points={self.points}, type='{self.question_type}')>"

class Progress(Base):
    """Track user learning progress and answers"""
    __tablename__ = "lp_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("lp_users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("lp_courses.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("lp_questions.id"), nullable=False)
    is_correct = Column(Boolean, nullable=False)
    earned_points = Column(Integer, nullable=False)
    user_answer = Column(Text, nullable=True)  # Store user's answer
    
    def __repr__(self):
        return f"<Progress(user_id={self.user_id}, course_id={self.course_id}, question_id={self.question_id}, correct={self.is_correct}, points={self.earned_points})>"
