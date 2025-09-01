"""
Progress tracking models
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Float, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Progress(Base):
    """User progress tracking for courses"""
    __tablename__ = "progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    
    # Progress metrics
    completion_percentage = Column(Float, default=0.0)
    modules_completed = Column(Integer, default=0)
    total_modules = Column(Integer, nullable=False)
    
    # Time tracking
    total_study_time = Column(Integer, default=0)  # in minutes
    last_accessed = Column(DateTime(timezone=True), nullable=True)
    streak_days = Column(Integer, default=0)
    
    # Performance metrics
    average_score = Column(Float, nullable=True)
    best_score = Column(Float, nullable=True)
    assessments_taken = Column(Integer, default=0)
    assessments_passed = Column(Integer, default=0)
    
    # Current position
    current_module = Column(String(100), nullable=True)
    current_lesson = Column(String(100), nullable=True)
    
    # Timestamps
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="progress_records")
    course = relationship("Course", back_populates="progress_records")
    
    def __repr__(self):
        return f"<Progress(user_id={self.user_id}, course_id={self.course_id}, completion={self.completion_percentage}%)>"

class LearningGoal(Base):
    """User-defined learning goals"""
    __tablename__ = "learning_goals"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    
    # Goal details
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    target_completion_date = Column(DateTime(timezone=True), nullable=True)
    
    # Goal metrics
    target_score = Column(Float, nullable=True)
    target_study_hours = Column(Integer, nullable=True)
    priority_level = Column(String(20), default='medium')  # 'low', 'medium', 'high'
    
    # Status
    status = Column(String(20), default='active')  # 'active', 'completed', 'paused', 'abandoned'
    is_achieved = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    achieved_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User")
    course = relationship("Course")
    
    def __repr__(self):
        return f"<LearningGoal(id={self.id}, user_id={self.user_id}, title='{self.title}', status='{self.status}')>"

class Achievement(Base):
    """User achievements and badges"""
    __tablename__ = "achievements"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Achievement details
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    badge_type = Column(String(50), nullable=False)  # 'completion', 'streak', 'score', 'participation'
    badge_icon = Column(String(255), nullable=True)
    
    # Achievement criteria
    criteria_met = Column(Text, nullable=True)  # JSON string with criteria details
    points_awarded = Column(Integer, default=0)
    
    # Timestamps
    earned_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User")
    
    def __repr__(self):
        return f"<Achievement(id={self.id}, user_id={self.user_id}, title='{self.title}')>"
