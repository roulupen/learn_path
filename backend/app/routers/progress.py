"""
Progress tracking routes
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.database import get_db
from app.models.user import User
from app.models.course import Course, Enrollment
from app.models.progress import Progress, LearningGoal, Achievement
from app.utils.auth import get_current_active_user

router = APIRouter()

@router.get("/courses/{course_id}")
async def get_course_progress(
    course_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's progress for a specific course"""
    
    # Verify enrollment
    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == course_id
    ).first()
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not enrolled in this course"
        )
    
    # Get or create progress record
    progress = db.query(Progress).filter(
        Progress.user_id == current_user.id,
        Progress.course_id == course_id
    ).first()
    
    if not progress:
        # Create initial progress record
        course = db.query(Course).filter(Course.id == course_id).first()
        progress = Progress(
            user_id=current_user.id,
            course_id=course_id,
            total_modules=10,  # Default, should be based on actual course structure
            completion_percentage=0.0
        )
        db.add(progress)
        db.commit()
        db.refresh(progress)
    
    return {
        "course_id": course_id,
        "completion_percentage": progress.completion_percentage,
        "modules_completed": progress.modules_completed,
        "total_modules": progress.total_modules,
        "total_study_time": progress.total_study_time,
        "last_accessed": progress.last_accessed,
        "streak_days": progress.streak_days,
        "average_score": progress.average_score,
        "assessments_taken": progress.assessments_taken,
        "assessments_passed": progress.assessments_passed,
        "current_module": progress.current_module,
        "current_lesson": progress.current_lesson,
        "started_at": progress.started_at,
        "completed_at": progress.completed_at
    }

@router.put("/courses/{course_id}")
async def update_course_progress(
    course_id: int,
    completion_percentage: float,
    modules_completed: int,
    current_module: Optional[str] = None,
    current_lesson: Optional[str] = None,
    study_time_minutes: Optional[int] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update user's progress for a course"""
    
    if completion_percentage < 0 or completion_percentage > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Completion percentage must be between 0 and 100"
        )
    
    # Verify enrollment
    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == course_id
    ).first()
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not enrolled in this course"
        )
    
    # Get or create progress record
    progress = db.query(Progress).filter(
        Progress.user_id == current_user.id,
        Progress.course_id == course_id
    ).first()
    
    if not progress:
        progress = Progress(
            user_id=current_user.id,
            course_id=course_id,
            total_modules=10  # Default
        )
        db.add(progress)
    
    # Update progress
    progress.completion_percentage = completion_percentage
    progress.modules_completed = modules_completed
    progress.last_accessed = datetime.utcnow()
    
    if current_module:
        progress.current_module = current_module
    if current_lesson:
        progress.current_lesson = current_lesson
    if study_time_minutes:
        progress.total_study_time += study_time_minutes
    
    # Update streak
    if progress.last_accessed:
        days_since_last = (datetime.utcnow() - progress.last_accessed).days
        if days_since_last == 1:
            progress.streak_days += 1
        elif days_since_last > 1:
            progress.streak_days = 1
    else:
        progress.streak_days = 1
    
    # Mark as completed if 100%
    if completion_percentage >= 100 and not progress.completed_at:
        progress.completed_at = datetime.utcnow()
        enrollment.status = "completed"
        enrollment.completed_at = datetime.utcnow()
    
    # Update enrollment progress
    enrollment.completion_percentage = completion_percentage
    enrollment.last_accessed = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Progress updated successfully"}

@router.get("/dashboard")
async def get_progress_dashboard(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's overall learning progress dashboard"""
    
    # Get all enrollments
    enrollments = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id
    ).all()
    
    # Get progress for each course
    progress_records = db.query(Progress).filter(
        Progress.user_id == current_user.id
    ).all()
    
    # Calculate overall statistics
    total_courses = len(enrollments)
    completed_courses = len([e for e in enrollments if e.status == "completed"])
    active_courses = len([e for e in enrollments if e.status == "active"])
    
    total_study_time = sum(p.total_study_time for p in progress_records)
    current_streak = max([p.streak_days for p in progress_records], default=0)
    
    # Get recent achievements
    recent_achievements = db.query(Achievement).filter(
        Achievement.user_id == current_user.id
    ).order_by(Achievement.earned_at.desc()).limit(5).all()
    
    # Get learning goals
    learning_goals = db.query(LearningGoal).filter(
        LearningGoal.user_id == current_user.id,
        LearningGoal.status == "active"
    ).all()
    
    return {
        "total_courses": total_courses,
        "completed_courses": completed_courses,
        "active_courses": active_courses,
        "completion_rate": (completed_courses / total_courses * 100) if total_courses > 0 else 0,
        "total_study_time_hours": total_study_time / 60,
        "current_streak_days": current_streak,
        "recent_achievements": [
            {
                "title": a.title,
                "description": a.description,
                "badge_type": a.badge_type,
                "earned_at": a.earned_at
            }
            for a in recent_achievements
        ],
        "active_learning_goals": [
            {
                "id": g.id,
                "title": g.title,
                "description": g.description,
                "target_completion_date": g.target_completion_date,
                "priority_level": g.priority_level
            }
            for g in learning_goals
        ],
        "course_progress": [
            {
                "course_id": p.course_id,
                "completion_percentage": p.completion_percentage,
                "modules_completed": p.modules_completed,
                "total_modules": p.total_modules,
                "last_accessed": p.last_accessed
            }
            for p in progress_records
        ]
    }

@router.post("/goals", status_code=status.HTTP_201_CREATED)
async def create_learning_goal(
    title: str,
    description: Optional[str] = None,
    course_id: Optional[int] = None,
    target_completion_date: Optional[str] = None,
    target_score: Optional[float] = None,
    target_study_hours: Optional[int] = None,
    priority_level: str = "medium",
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new learning goal"""
    
    if priority_level not in ["low", "medium", "high"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Priority level must be 'low', 'medium', or 'high'"
        )
    
    # Parse target completion date
    target_date = None
    if target_completion_date:
        try:
            target_date = datetime.fromisoformat(target_completion_date)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use ISO format (YYYY-MM-DD)"
            )
    
    # Verify course exists if provided
    if course_id:
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
    
    goal = LearningGoal(
        user_id=current_user.id,
        course_id=course_id,
        title=title,
        description=description,
        target_completion_date=target_date,
        target_score=target_score,
        target_study_hours=target_study_hours,
        priority_level=priority_level
    )
    
    db.add(goal)
    db.commit()
    db.refresh(goal)
    
    return {
        "id": goal.id,
        "title": goal.title,
        "description": goal.description,
        "status": goal.status,
        "created_at": goal.created_at
    }

@router.get("/goals")
async def get_learning_goals(
    status: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's learning goals"""
    
    query = db.query(LearningGoal).filter(LearningGoal.user_id == current_user.id)
    
    if status:
        query = query.filter(LearningGoal.status == status)
    
    goals = query.order_by(LearningGoal.created_at.desc()).all()
    
    return [
        {
            "id": g.id,
            "title": g.title,
            "description": g.description,
            "course_id": g.course_id,
            "target_completion_date": g.target_completion_date,
            "target_score": g.target_score,
            "target_study_hours": g.target_study_hours,
            "priority_level": g.priority_level,
            "status": g.status,
            "is_achieved": g.is_achieved,
            "created_at": g.created_at,
            "achieved_at": g.achieved_at
        }
        for g in goals
    ]

@router.put("/goals/{goal_id}/complete")
async def complete_learning_goal(
    goal_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mark a learning goal as completed"""
    
    goal = db.query(LearningGoal).filter(
        LearningGoal.id == goal_id,
        LearningGoal.user_id == current_user.id
    ).first()
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learning goal not found"
        )
    
    goal.status = "completed"
    goal.is_achieved = True
    goal.achieved_at = datetime.utcnow()
    
    # Create achievement
    achievement = Achievement(
        user_id=current_user.id,
        title=f"Goal Achieved: {goal.title}",
        description=f"Successfully completed learning goal: {goal.title}",
        badge_type="goal_completion",
        points_awarded=10
    )
    
    db.add(achievement)
    db.commit()
    
    return {"message": "Learning goal marked as completed"}

@router.get("/achievements")
async def get_achievements(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's achievements"""
    
    achievements = db.query(Achievement).filter(
        Achievement.user_id == current_user.id
    ).order_by(Achievement.earned_at.desc()).all()
    
    return [
        {
            "id": a.id,
            "title": a.title,
            "description": a.description,
            "badge_type": a.badge_type,
            "badge_icon": a.badge_icon,
            "points_awarded": a.points_awarded,
            "earned_at": a.earned_at
        }
        for a in achievements
    ]
