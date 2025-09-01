"""
Learning system Pydantic schemas for API validation
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

# User Schemas
class UserRegisterRequest(BaseModel):
    """User registration - only name and username"""
    name: str = Field(..., min_length=1, max_length=100)
    username: str = Field(..., min_length=3, max_length=50)

class UserLoginRequest(BaseModel):
    """User login - only username"""
    username: str

class UserResponse(BaseModel):
    """User response"""
    id: int
    name: str
    username: str
    
    class Config:
        from_attributes = True

# Course Schemas
class CourseSelectionRequest(BaseModel):
    """Course selection with duration"""
    course_name: str
    duration_days: int = Field(..., ge=15, le=30)  # 15, 20, or 30 days
    username: str

class GeneratePlanRequest(BaseModel):
    """Generate study plan request"""
    username: str
    course_name: str
    duration_days: int

class CreateCourseRequest(BaseModel):
    """Create new custom course request"""
    username: str
    course_name: str = Field(..., min_length=1, max_length=200)
    course_description: Optional[str] = Field(None, max_length=1000)
    duration_days: int = Field(..., ge=15, le=30)  # 15, 20, or 30 days

class CourseResponse(BaseModel):
    """Course response"""
    id: int
    course_name: str
    course_description: Optional[str] = None
    duration_days: int
    user_id: int
    is_custom: bool = False
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Plan Schemas
class PlanResponse(BaseModel):
    """Daily plan response"""
    id: int
    day_number: int
    content: str
    course_id: int
    
    class Config:
        from_attributes = True

# Question Schemas
class QuestionResponse(BaseModel):
    """Question response"""
    id: int
    day_number: int
    question: str
    difficulty: str
    points: int
    options: Optional[str] = None
    question_type: Optional[str] = None
    code_snippet: Optional[str] = None
    
    class Config:
        from_attributes = True

class QuestionEvaluationResponse(BaseModel):
    """Question evaluation response from LLM"""
    overall_score: int
    grade: str
    detailed_feedback: Dict[str, Dict[str, Any]]
    recommendations: List[str]
    strengths: List[str]
    areas_for_improvement: List[str]

class SubmitAnswerRequest(BaseModel):
    """Submit answer request"""
    username: str
    question_id: int
    user_answer: str

class SubmitAnswerResponse(BaseModel):
    """Submit answer response"""
    is_correct: bool
    earned_points: int
    correct_answer: str
    feedback: str

# Progress Schemas
class ProgressResponse(BaseModel):
    """Progress tracking response"""
    user_id: int
    course_id: int
    total_questions: int
    answered_questions: int
    earned_points: int
    total_points: int
    completion_percentage: float
    current_day: int
    
class DailyProgressResponse(BaseModel):
    """Daily progress response"""
    day_number: int
    is_unlocked: bool
    is_completed: bool
    questions_answered: int
    total_questions: int
    points_earned: int
    total_points: int

class CourseOverviewResponse(BaseModel):
    """Course overview for dashboard tiles"""
    id: int
    course_name: str
    duration_days: int
    current_day: int
    completion_percentage: float
    total_questions: int
    answered_questions: int
    earned_points: int
    total_points: int
    last_activity: str
    
class GenerateQuestionsRequest(BaseModel):
    """Request to generate questions for a specific day"""
    username: str
    course_name: str
    day_number: int
    num_questions: int = Field(default=10, ge=1, le=20)  # Default 10 questions, max 20

class RegenerateQuestionsRequest(BaseModel):
    """Request to regenerate questions with user preferences"""
    username: str
    course_name: str
    day_number: int
    num_questions: int = Field(default=10, ge=1, le=20)  # Default 10 questions, max 20
    focus_areas: List[str] = []  # What user wants to focus on
    difficulty_preference: str = "balanced"  # "easier", "balanced", "harder"
    question_types: List[str] = []  # "conceptual", "practical", "analytical"
    special_instructions: str = ""  # Any special requests

class AvailableCourseResponse(BaseModel):
    """Available course template response"""
    name: str
    description: str
    suggested_duration: int
    difficulty_level: str

class DayStatusResponse(BaseModel):
    """Day status and progression response"""
    day_number: int
    is_unlocked: bool
    is_completed: bool
    is_current: bool
    total_questions: int
    answered_questions: int
    completion_percentage: float
    can_regenerate: bool
    has_questions: bool
    has_progress: bool
    needs_questions: bool
    can_continue: bool

class QuestionReviewResponse(BaseModel):
    """Question with user answer and correct answer for review"""
    id: int
    day_number: int
    question: str
    difficulty: str
    points: int
    options: Optional[str] = None
    user_answer: Optional[str] = None
    correct_answer: str
    is_correct: Optional[bool] = None
    earned_points: int
    
    class Config:
        from_attributes = True
