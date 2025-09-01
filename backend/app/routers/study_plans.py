"""
Study plan management routes
"""
import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.course import Course, Enrollment
from app.models.study_plan import StudyPlan, StudySession
from app.schemas.study_plan import (
    StudyPlanCreateRequest, StudyPlanResponse, StudyPlanDetailResponse,
    StudySessionCreateRequest, StudySessionResponse,
    AIFeedbackRequest, AIFeedbackResponse
)
from app.utils.auth import get_current_active_user
from app.services.gemini_service import gemini_service

router = APIRouter()

@router.post("/", response_model=StudyPlanResponse, status_code=status.HTTP_201_CREATED)
async def create_study_plan(
    plan_data: StudyPlanCreateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new AI-generated study plan"""
    
    # Verify course exists and user is enrolled
    course = db.query(Course).filter(Course.id == plan_data.course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == plan_data.course_id
    ).first()
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must be enrolled in the course to create a study plan"
        )
    
    # Check if user already has an active study plan for this course
    existing_plan = db.query(StudyPlan).filter(
        StudyPlan.user_id == current_user.id,
        StudyPlan.course_id == plan_data.course_id,
        StudyPlan.status == "active"
    ).first()
    if existing_plan:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active study plan for this course"
        )
    
    # Generate AI study plan
    try:
        ai_plan = await gemini_service.generate_study_plan(
            course_title=course.title,
            course_description=course.description,
            user_level=plan_data.difficulty_preference or "medium",
            learning_goals=plan_data.learning_goals,
            time_commitment=plan_data.time_commitment,
            duration_weeks=plan_data.duration_weeks
        )
        
        # Create study plan
        study_plan = StudyPlan(
            user_id=current_user.id,
            course_id=plan_data.course_id,
            title=ai_plan["title"],
            description=ai_plan["description"],
            ai_generated_plan=json.dumps(ai_plan),
            difficulty_level=ai_plan["difficulty_level"],
            estimated_duration=ai_plan["total_duration_weeks"] * plan_data.time_commitment,
            learning_objectives=json.dumps(ai_plan.get("success_criteria", [])),
            modules=json.dumps(ai_plan.get("modules", [])),
            milestones=json.dumps(ai_plan.get("milestones", [])),
            is_ai_generated=True,
            status="active"
        )
        
        db.add(study_plan)
        db.commit()
        db.refresh(study_plan)
        
        return study_plan
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate study plan: {str(e)}"
        )

@router.get("/", response_model=List[StudyPlanResponse])
async def get_my_study_plans(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's study plans"""
    
    study_plans = db.query(StudyPlan).filter(
        StudyPlan.user_id == current_user.id
    ).all()
    
    return study_plans

@router.get("/{plan_id}", response_model=StudyPlanDetailResponse)
async def get_study_plan(
    plan_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get detailed study plan"""
    
    study_plan = db.query(StudyPlan).filter(
        StudyPlan.id == plan_id,
        StudyPlan.user_id == current_user.id
    ).first()
    if not study_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study plan not found"
        )
    
    return study_plan

@router.put("/{plan_id}/start")
async def start_study_plan(
    plan_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Start a study plan"""
    
    study_plan = db.query(StudyPlan).filter(
        StudyPlan.id == plan_id,
        StudyPlan.user_id == current_user.id
    ).first()
    if not study_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study plan not found"
        )
    
    if study_plan.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Study plan is not in active status"
        )
    
    study_plan.started_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Study plan started successfully"}

@router.put("/{plan_id}/complete")
async def complete_study_plan(
    plan_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mark study plan as completed"""
    
    study_plan = db.query(StudyPlan).filter(
        StudyPlan.id == plan_id,
        StudyPlan.user_id == current_user.id
    ).first()
    if not study_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study plan not found"
        )
    
    study_plan.status = "completed"
    study_plan.completion_percentage = 100
    study_plan.completed_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Study plan completed successfully"}

@router.put("/{plan_id}/progress")
async def update_study_progress(
    plan_id: int,
    completion_percentage: int,
    current_module: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update study plan progress"""
    
    if completion_percentage < 0 or completion_percentage > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Completion percentage must be between 0 and 100"
        )
    
    study_plan = db.query(StudyPlan).filter(
        StudyPlan.id == plan_id,
        StudyPlan.user_id == current_user.id
    ).first()
    if not study_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study plan not found"
        )
    
    study_plan.completion_percentage = completion_percentage
    study_plan.current_module = current_module
    
    if completion_percentage == 100:
        study_plan.status = "completed"
        study_plan.completed_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Progress updated successfully"}

@router.post("/{plan_id}/sessions", response_model=StudySessionResponse, status_code=status.HTTP_201_CREATED)
async def create_study_session(
    plan_id: int,
    session_data: StudySessionCreateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Record a study session"""
    
    # Verify study plan exists and belongs to user
    study_plan = db.query(StudyPlan).filter(
        StudyPlan.id == plan_id,
        StudyPlan.user_id == current_user.id
    ).first()
    if not study_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study plan not found"
        )
    
    # Create study session
    session = StudySession(
        study_plan_id=plan_id,
        user_id=current_user.id,
        session_title=session_data.session_title,
        module_name=session_data.module_name,
        duration_minutes=session_data.duration_minutes,
        content_covered=session_data.content_covered,
        notes=session_data.notes,
        difficulty_rating=session_data.difficulty_rating,
        satisfaction_rating=session_data.satisfaction_rating,
        started_at=datetime.utcnow(),
        ended_at=datetime.utcnow()
    )
    
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return session

@router.get("/{plan_id}/sessions", response_model=List[StudySessionResponse])
async def get_study_sessions(
    plan_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get study sessions for a plan"""
    
    # Verify study plan exists and belongs to user
    study_plan = db.query(StudyPlan).filter(
        StudyPlan.id == plan_id,
        StudyPlan.user_id == current_user.id
    ).first()
    if not study_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study plan not found"
        )
    
    sessions = db.query(StudySession).filter(
        StudySession.study_plan_id == plan_id
    ).order_by(StudySession.created_at.desc()).all()
    
    return sessions

@router.post("/{plan_id}/feedback", response_model=AIFeedbackResponse)
async def get_ai_feedback(
    plan_id: int,
    feedback_request: AIFeedbackRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get AI-generated learning feedback"""
    
    # Verify study plan exists and belongs to user
    study_plan = db.query(StudyPlan).filter(
        StudyPlan.id == plan_id,
        StudyPlan.user_id == current_user.id
    ).first()
    if not study_plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study plan not found"
        )
    
    # Get recent study sessions
    recent_sessions = db.query(StudySession).filter(
        StudySession.study_plan_id == plan_id
    ).order_by(StudySession.created_at.desc()).limit(10).all()
    
    # Prepare data for AI analysis
    progress_data = {
        "completion_percentage": study_plan.completion_percentage,
        "current_module": study_plan.current_module,
        "total_study_time": sum(session.duration_minutes for session in recent_sessions),
        "average_session_duration": sum(session.duration_minutes for session in recent_sessions) / len(recent_sessions) if recent_sessions else 0,
        "difficulty_ratings": [session.difficulty_rating for session in recent_sessions if session.difficulty_rating],
        "satisfaction_ratings": [session.satisfaction_rating for session in recent_sessions if session.satisfaction_rating]
    }
    
    performance_data = [
        {
            "session_title": session.session_title,
            "duration": session.duration_minutes,
            "difficulty_rating": session.difficulty_rating,
            "satisfaction_rating": session.satisfaction_rating
        }
        for session in recent_sessions
    ]
    
    learning_goals = json.loads(study_plan.learning_objectives) if study_plan.learning_objectives else []
    
    try:
        feedback = await gemini_service.provide_learning_feedback(
            user_progress=progress_data,
            recent_performance=performance_data,
            learning_goals=learning_goals
        )
        
        return feedback
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate feedback: {str(e)}"
        )
