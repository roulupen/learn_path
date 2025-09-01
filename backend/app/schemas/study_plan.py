"""
Study plan related Pydantic schemas
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class StudyPlanCreateRequest(BaseModel):
    """Study plan creation request schema"""
    course_id: int
    learning_goals: List[str] = Field(..., min_items=1)
    time_commitment: int = Field(..., gt=0)  # hours per week
    duration_weeks: int = Field(12, gt=0, le=52)
    difficulty_preference: Optional[str] = Field("medium", pattern="^(easy|medium|hard)$")

class StudyPlanResponse(BaseModel):
    """Study plan response schema"""
    id: int
    user_id: int
    course_id: int
    title: str
    description: Optional[str] = None
    difficulty_level: str
    estimated_duration: int
    status: str
    completion_percentage: int
    current_module: int
    is_ai_generated: bool
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class StudyPlanDetailResponse(StudyPlanResponse):
    """Detailed study plan response with full content"""
    ai_generated_plan: str
    learning_objectives: Optional[str] = None
    modules: Optional[str] = None
    milestones: Optional[str] = None

class StudySessionCreateRequest(BaseModel):
    """Study session creation request"""
    study_plan_id: int
    session_title: str = Field(..., min_length=1, max_length=200)
    module_name: Optional[str] = Field(None, max_length=100)
    duration_minutes: int = Field(..., gt=0)
    content_covered: Optional[str] = None
    notes: Optional[str] = None
    difficulty_rating: Optional[int] = Field(None, ge=1, le=5)
    satisfaction_rating: Optional[int] = Field(None, ge=1, le=5)

class StudySessionResponse(BaseModel):
    """Study session response schema"""
    id: int
    study_plan_id: int
    user_id: int
    session_title: str
    module_name: Optional[str] = None
    duration_minutes: int
    content_covered: Optional[str] = None
    notes: Optional[str] = None
    difficulty_rating: Optional[int] = None
    satisfaction_rating: Optional[int] = None
    started_at: datetime
    ended_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class AIFeedbackRequest(BaseModel):
    """Request for AI-generated learning feedback"""
    study_plan_id: int
    include_recommendations: bool = True

class AIFeedbackResponse(BaseModel):
    """AI-generated learning feedback response"""
    overall_assessment: str
    strengths: List[str]
    areas_for_improvement: List[str]
    specific_recommendations: List[Dict[str, Any]]
    motivational_message: str
    next_steps: List[str]
    estimated_improvement_time: str
