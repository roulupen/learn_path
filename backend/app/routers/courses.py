"""
Course management routes
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.course import Course, Enrollment
from app.schemas.course import (
    CourseCreateRequest, CourseUpdateRequest, CourseResponse,
    EnrollmentRequest, EnrollmentResponse
)
from app.utils.auth import get_current_active_user, require_role

router = APIRouter()

@router.get("/", response_model=List[CourseResponse])
async def get_courses(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    category: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all published courses with optional filtering"""
    
    query = db.query(Course).filter(Course.is_published == True)
    
    # Apply filters
    if category:
        query = query.filter(Course.category.ilike(f"%{category}%"))
    if difficulty:
        query = query.filter(Course.difficulty_level == difficulty)
    if search:
        query = query.filter(
            (Course.title.ilike(f"%{search}%")) |
            (Course.description.ilike(f"%{search}%"))
        )
    
    courses = query.offset(skip).limit(limit).all()
    return courses

@router.post("/", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    course_data: CourseCreateRequest,
    current_user: User = Depends(require_role("instructor")),
    db: Session = Depends(get_db)
):
    """Create a new course (instructors only)"""
    
    db_course = Course(
        title=course_data.title,
        description=course_data.description,
        short_description=course_data.short_description,
        instructor_id=current_user.id,
        category=course_data.category,
        difficulty_level=course_data.difficulty_level,
        estimated_duration=course_data.estimated_duration,
        course_content=course_data.course_content,
        price=course_data.price,
        is_free=course_data.is_free
    )
    
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    
    return db_course

@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(course_id: int, db: Session = Depends(get_db)):
    """Get course by ID"""
    
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Only show published courses unless user is the instructor or admin
    if not course.is_published:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    return course

@router.put("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: int,
    course_data: CourseUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update course (instructor or admin only)"""
    
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Check permissions
    if course.instructor_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this course"
        )
    
    # Update fields if provided
    update_data = course_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(course, field, value)
    
    db.commit()
    db.refresh(course)
    
    return course

@router.delete("/{course_id}")
async def delete_course(
    course_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete course (instructor or admin only)"""
    
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Check permissions
    if course.instructor_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this course"
        )
    
    db.delete(course)
    db.commit()
    
    return {"message": "Course deleted successfully"}

@router.post("/{course_id}/enroll", response_model=EnrollmentResponse)
async def enroll_in_course(
    course_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Enroll in a course"""
    
    # Check if course exists and is published
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.is_published == True
    ).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found or not available"
        )
    
    # Check if already enrolled
    existing_enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == course_id
    ).first()
    if existing_enrollment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already enrolled in this course"
        )
    
    # Create enrollment
    enrollment = Enrollment(
        user_id=current_user.id,
        course_id=course_id,
        status="active"
    )
    
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    
    return enrollment

@router.delete("/{course_id}/enroll")
async def unenroll_from_course(
    course_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Unenroll from a course"""
    
    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id,
        Enrollment.course_id == course_id
    ).first()
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not enrolled in this course"
        )
    
    db.delete(enrollment)
    db.commit()
    
    return {"message": "Successfully unenrolled from course"}

@router.get("/my-courses/enrolled", response_model=List[EnrollmentResponse])
async def get_my_enrollments(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user's course enrollments"""
    
    enrollments = db.query(Enrollment).filter(
        Enrollment.user_id == current_user.id
    ).all()
    
    return enrollments

@router.get("/my-courses/teaching", response_model=List[CourseResponse])
async def get_my_courses(
    current_user: User = Depends(require_role("instructor")),
    db: Session = Depends(get_db)
):
    """Get courses taught by current instructor"""
    
    courses = db.query(Course).filter(
        Course.instructor_id == current_user.id
    ).all()
    
    return courses
