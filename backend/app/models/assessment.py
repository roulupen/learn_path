"""
Assessment and quiz models
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Float, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Assessment(Base):
    """Course assessments and quizzes"""
    __tablename__ = "assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    
    # Assessment details
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    assessment_type = Column(String(50), nullable=False)  # 'quiz', 'exam', 'assignment', 'project'
    
    # Assessment content
    questions = Column(Text, nullable=False)  # JSON string with questions
    total_questions = Column(Integer, nullable=False)
    total_points = Column(Float, nullable=False)
    
    # Assessment settings
    time_limit = Column(Integer, nullable=True)  # in minutes
    passing_score = Column(Float, nullable=False)
    max_attempts = Column(Integer, default=3)
    is_randomized = Column(Boolean, default=False)
    
    # Availability
    is_published = Column(Boolean, default=False)
    available_from = Column(DateTime(timezone=True), nullable=True)
    available_until = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    course = relationship("Course", back_populates="assessments")
    results = relationship("AssessmentResult", back_populates="assessment")
    
    def __repr__(self):
        return f"<Assessment(id={self.id}, title='{self.title}', type='{self.assessment_type}')>"

class AssessmentResult(Base):
    """User assessment results"""
    __tablename__ = "assessment_results"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False)
    
    # Result details
    score = Column(Float, nullable=False)
    max_score = Column(Float, nullable=False)
    percentage = Column(Float, nullable=False)
    is_passed = Column(Boolean, nullable=False)
    
    # Attempt information
    attempt_number = Column(Integer, default=1)
    time_taken = Column(Integer, nullable=True)  # in minutes
    
    # Answer details
    answers = Column(Text, nullable=True)  # JSON string with user answers
    correct_answers = Column(Integer, nullable=False)
    incorrect_answers = Column(Integer, nullable=False)
    skipped_answers = Column(Integer, default=0)
    
    # Feedback
    feedback = Column(Text, nullable=True)
    ai_generated_feedback = Column(Text, nullable=True)
    
    # Timestamps
    started_at = Column(DateTime(timezone=True), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="assessment_results")
    assessment = relationship("Assessment", back_populates="results")
    
    def __repr__(self):
        return f"<AssessmentResult(id={self.id}, user_id={self.user_id}, score={self.score}/{self.max_score})>"

class Question(Base):
    """Individual questions for assessments"""
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False)
    
    # Question details
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), nullable=False)  # 'multiple_choice', 'true_false', 'short_answer', 'essay'
    points = Column(Float, default=1.0)
    
    # Question content
    options = Column(Text, nullable=True)  # JSON string for multiple choice options
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)
    
    # Question metadata
    difficulty_level = Column(String(20), default='medium')
    tags = Column(String(500), nullable=True)  # Comma-separated tags
    
    # AI generation info
    is_ai_generated = Column(Boolean, default=False)
    ai_prompt_used = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    assessment = relationship("Assessment")
    
    def __repr__(self):
        return f"<Question(id={self.id}, type='{self.question_type}', points={self.points})>"
