"""
AI-generated study plan models
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class StudyPlan(Base):
    """AI-generated personalized study plan"""
    __tablename__ = "study_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    
    # Study plan content
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    ai_generated_plan = Column(Text, nullable=False)  # JSON string with detailed plan
    
    # Plan metadata
    difficulty_level = Column(String(20), nullable=False)
    estimated_duration = Column(Integer, nullable=False)  # in hours
    learning_objectives = Column(Text, nullable=True)  # JSON array of objectives
    
    # Plan structure
    modules = Column(Text, nullable=True)  # JSON array of modules/chapters
    milestones = Column(Text, nullable=True)  # JSON array of milestones
    
    # Plan status
    status = Column(String(20), default='active')  # 'active', 'completed', 'paused', 'abandoned'
    is_ai_generated = Column(Boolean, default=True)
    
    # Progress tracking
    completion_percentage = Column(Integer, default=0)
    current_module = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="study_plans")
    course = relationship("Course", back_populates="study_plans")
    
    def __repr__(self):
        return f"<StudyPlan(id={self.id}, user_id={self.user_id}, course_id={self.course_id}, status='{self.status}')>"

class StudySession(Base):
    """Individual study sessions"""
    __tablename__ = "study_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    study_plan_id = Column(Integer, ForeignKey("study_plans.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Session details
    session_title = Column(String(200), nullable=False)
    module_name = Column(String(100), nullable=True)
    content_covered = Column(Text, nullable=True)
    
    # Time tracking
    duration_minutes = Column(Integer, nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    
    # Session metadata
    notes = Column(Text, nullable=True)
    difficulty_rating = Column(Integer, nullable=True)  # 1-5 scale
    satisfaction_rating = Column(Integer, nullable=True)  # 1-5 scale
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    study_plan = relationship("StudyPlan")
    user = relationship("User")
    
    def __repr__(self):
        return f"<StudySession(id={self.id}, study_plan_id={self.study_plan_id}, duration={self.duration_minutes}min)>"
