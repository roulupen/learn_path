"""
Course-related Pydantic schemas
"""
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class CourseBase(BaseModel):
    """Base course schema"""
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    short_description: Optional[str] = Field(None, max_length=500)
    category: str = Field(..., min_length=1, max_length=100)
    difficulty_level: str = Field(..., pattern="^(beginner|intermediate|advanced)$")
    estimated_duration: int = Field(..., gt=0)  # hours

class CourseCreateRequest(CourseBase):
    """Course creation request schema"""
    course_content: Optional[str] = None
    price: Optional[float] = Field(0.0, ge=0)
    is_free: bool = True

class CourseUpdateRequest(BaseModel):
    """Course update request schema"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, min_length=1)
    short_description: Optional[str] = Field(None, max_length=500)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    difficulty_level: Optional[str] = Field(None, pattern="^(beginner|intermediate|advanced)$")
    estimated_duration: Optional[int] = Field(None, gt=0)
    course_content: Optional[str] = None
    price: Optional[float] = Field(None, ge=0)
    is_free: Optional[bool] = None
    is_published: Optional[bool] = None

class CourseResponse(CourseBase):
    """Course response schema"""
    id: int
    instructor_id: int
    thumbnail_url: Optional[str] = None
    price: float
    is_free: bool
    is_published: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class EnrollmentRequest(BaseModel):
    """Course enrollment request schema"""
    course_id: int

class EnrollmentResponse(BaseModel):
    """Course enrollment response schema"""
    id: int
    user_id: int
    course_id: int
    status: str
    completion_percentage: float
    enrolled_at: datetime
    last_accessed: Optional[datetime] = None
    
    class Config:
        from_attributes = True
