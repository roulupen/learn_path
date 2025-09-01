"""
Course and enrollment models
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, Float, ForeignKey, Boolean, Table
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

# Association table for course prerequisites
course_prerequisites = Table(
    'course_prerequisites',
    Base.metadata,
    Column('course_id', Integer, ForeignKey('courses.id'), primary_key=True),
    Column('prerequisite_id', Integer, ForeignKey('courses.id'), primary_key=True)
)

class Course(Base):
    """Course model"""
    __tablename__ = "courses"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=False)
    short_description = Column(String(500), nullable=True)
    
    # Course metadata
    instructor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category = Column(String(100), nullable=False)
    difficulty_level = Column(String(20), nullable=False)  # 'beginner', 'intermediate', 'advanced'
    estimated_duration = Column(Integer, nullable=False)  # in hours
    
    # Course content
    thumbnail_url = Column(String(255), nullable=True)
    course_content = Column(Text, nullable=True)  # JSON string with course structure
    
    # Pricing and availability
    price = Column(Float, default=0.0)
    is_free = Column(Boolean, default=True)
    is_published = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    instructor = relationship("User", foreign_keys=[instructor_id])
    enrollments = relationship("Enrollment", back_populates="course")
    study_plans = relationship("StudyPlan", back_populates="course")
    progress_records = relationship("Progress", back_populates="course")
    assessments = relationship("Assessment", back_populates="course")
    
    # Self-referencing relationship for prerequisites
    prerequisites = relationship(
        "Course",
        secondary=course_prerequisites,
        primaryjoin=id == course_prerequisites.c.course_id,
        secondaryjoin=id == course_prerequisites.c.prerequisite_id,
        backref="dependent_courses"
    )
    
    def __repr__(self):
        return f"<Course(id={self.id}, title='{self.title}', difficulty='{self.difficulty_level}')>"

class Enrollment(Base):
    """Student enrollment in courses"""
    __tablename__ = "enrollments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    
    # Enrollment status
    status = Column(String(20), default='active')  # 'active', 'completed', 'dropped', 'paused'
    completion_percentage = Column(Float, default=0.0)
    
    # Timestamps
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    last_accessed = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")
    
    def __repr__(self):
        return f"<Enrollment(user_id={self.user_id}, course_id={self.course_id}, status='{self.status}')>"
