"""
Core Learning API routes for the LearnPath system
"""
import json
import logging
import random
import time
import re
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.utils.logger import loggers, log_llm_request, log_llm_response, log_llm_error, log_user_activity, log_performance_metric

# Get specialized loggers
logger = loggers['main']
gemini_logger = loggers['gemini']
user_activity_logger = loggers['user_activity']
performance_logger = loggers['performance']

from app.database import get_db
from app.models.core_models import User, Course, Plan, Question, Progress
from app.schemas.learning_schemas import (
    UserRegisterRequest, UserLoginRequest, UserResponse,
    CourseSelectionRequest, GeneratePlanRequest, CourseResponse,
    PlanResponse, QuestionResponse,
    SubmitAnswerRequest, SubmitAnswerResponse,
    ProgressResponse, DailyProgressResponse,
    CourseOverviewResponse, RegenerateQuestionsRequest,
    CreateCourseRequest, GenerateQuestionsRequest, AvailableCourseResponse,
    DayStatusResponse, QuestionReviewResponse, QuestionEvaluationResponse
)
from app.services.gemini_service import gemini_service
from app.utils.prompt_loader import prompt_loader

router = APIRouter()

def randomize_question_options(question_data: dict) -> dict:
    """Randomize the position of the correct answer in question options"""
    if not question_data.get("options") or not question_data.get("correct_answer"):
        return question_data
    
    options = question_data["options"]
    current_correct = question_data["correct_answer"]
    
    # If options is a string (JSON), parse it
    if isinstance(options, str):
        try:
            options = json.loads(options)
        except:
            return question_data
    
    if not isinstance(options, list) or len(options) < 2:
        return question_data
    
    # Find current correct answer index
    current_index = None
    for i, option in enumerate(options):
        if option.startswith(f"{current_correct})"):
            current_index = i
            break
    
    if current_index is None:
        return question_data
    
    # Choose a random new position
    new_positions = ['A', 'B', 'C', 'D'][:len(options)]
    new_correct = random.choice(new_positions)
    new_index = ord(new_correct) - ord('A')
    
    # If same position, return as is
    if new_index == current_index:
        return question_data
    
    # Swap the correct answer to new position
    correct_option_text = options[current_index]
    target_option_text = options[new_index]
    
    # Update the option prefixes
    correct_option_text = correct_option_text.replace(f"{current_correct})", f"{new_correct})")
    target_option_text = target_option_text.replace(f"{new_correct})", f"{current_correct})")
    
    # Swap in the list
    options[current_index] = target_option_text
    options[new_index] = correct_option_text
    
    # Update the question data
    question_data["correct_answer"] = new_correct
    question_data["options"] = options
    
    return question_data

def clean_markdown_code_block(code_snippet: str) -> str:
    """Clean markdown code blocks and return clean code"""
    if not code_snippet or not isinstance(code_snippet, str):
        return ""
    
    # Log the original code snippet for debugging
    logger.debug(f"Cleaning code snippet: {repr(code_snippet)}")
    
    # Remove markdown code block syntax
    # Pattern: ```python\n...``` or ```\n...```
    code_block_pattern = r'```(?:python|javascript|java|c\+\+|c#|php|ruby|go|rust|swift|kotlin|scala|r|matlab|julia|bash|shell|sql|html|css|js|ts|jsx|tsx)?\n(.*?)\n```'
    
    match = re.search(code_block_pattern, code_snippet, re.DOTALL)
    if match:
        # Extract the code content and clean it
        code_content = match.group(1)
        # Remove any remaining markdown artifacts
        code_content = re.sub(r'^```.*?\n', '', code_content, flags=re.MULTILINE)
        code_content = re.sub(r'\n```$', '', code_content, flags=re.MULTILINE)
        cleaned = code_content.strip()
        logger.debug(f"Cleaned markdown code: {repr(cleaned)}")
        return cleaned
    
    # If no markdown pattern found, return as is (might be plain code)
    cleaned = code_snippet.strip()
    logger.debug(f"No markdown pattern found, returning as-is: {repr(cleaned)}")
    return cleaned

def get_day_status(user_id: int, course_id: int, day_number: int, total_days: int, db: Session) -> dict:
    """Get the status of a specific day including completion and unlock status"""
    
    # Get all questions for this day
    day_questions = db.query(Question).filter(
        Question.course_id == course_id,
        Question.day_number == day_number
    ).all()
    
    total_questions = len(day_questions)
    
    # Get user's progress for this day
    answered_progress = db.query(Progress).filter(
        Progress.user_id == user_id,
        Progress.course_id == course_id,
        Progress.question_id.in_([q.id for q in day_questions])
    ).all()
    
    answered_questions = len(answered_progress)
    
    # Day is completed if all questions are answered
    is_completed = total_questions > 0 and answered_questions == total_questions
    
    # Day is unlocked if:
    # 1. It's day 1, OR
    # 2. Previous day is completed
    is_unlocked = day_number == 1
    if day_number > 1:
        prev_day_status = get_day_status(user_id, course_id, day_number - 1, total_days, db)
        is_unlocked = prev_day_status["is_completed"]
    
    # Current day is the first unlocked but not completed day
    is_current = is_unlocked and not is_completed
    
    # Determine regeneration and action status
    has_questions = total_questions > 0
    has_progress = answered_questions > 0
    can_regenerate = is_unlocked and has_questions and not is_completed
    needs_questions = is_unlocked and not has_questions
    can_continue = is_unlocked and has_questions and has_progress and not is_completed
    
    completion_percentage = (answered_questions / total_questions * 100) if total_questions > 0 else 0
    
    return {
        "day_number": day_number,
        "is_unlocked": is_unlocked,
        "is_current": is_current,
        "is_completed": is_completed,
        "total_questions": total_questions,
        "answered_questions": answered_questions,
        "completion_percentage": completion_percentage,
        "can_regenerate": can_regenerate,
        "has_questions": has_questions,
        "has_progress": has_progress,
        "needs_questions": needs_questions,
        "can_continue": can_continue
    }

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserRegisterRequest, db: Session = Depends(get_db)):
    """Register a new user with name and username only"""
    
    start_time = time.time()
    
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        log_user_activity(
            user_activity_logger, 
            user_data.username, 
            'registration_failed', 
            {'reason': 'username_exists'}
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    # Create new user
    db_user = User(
        name=user_data.name,
        username=user_data.username
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    processing_time = time.time() - start_time
    
    # Log successful registration
    log_user_activity(
        user_activity_logger,
        user_data.username,
        'user_registered',
        {'user_id': db_user.id, 'name': user_data.name}
    )
    
    log_performance_metric(
        performance_logger,
        'user_registration_time',
        processing_time,
        {'username': user_data.username}
    )
    
    logger.info(f"New user registered: {user_data.username} (ID: {db_user.id})")
    
    return db_user

@router.post("/login", response_model=UserResponse)
async def login_user(login_data: UserLoginRequest, db: Session = Depends(get_db)):
    """Login user with username and load previous progress"""
    
    start_time = time.time()
    
    user = db.query(User).filter(User.username == login_data.username).first()
    if not user:
        log_user_activity(
            user_activity_logger,
            login_data.username,
            'login_failed',
            {'reason': 'user_not_found'}
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    processing_time = time.time() - start_time
    
    # Log successful login with session info
    log_user_activity(
        user_activity_logger,
        login_data.username,
        'user_logged_in',
        {
            'user_id': user.id, 
            'name': user.name,
            'session_timeout_minutes': 15,
            'login_timestamp': time.time()
        }
    )
    
    log_performance_metric(
        performance_logger,
        'user_login_time',
        processing_time,
        {'username': login_data.username}
    )
    
    logger.info(f"User logged in: {login_data.username} (ID: {user.id})")
    
    return user

@router.post("/logout")
async def logout_user(request: dict, db: Session = Depends(get_db)):
    """Logout user and log session termination"""
    
    username = request.get("username")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username is required"
        )
    
    user = db.query(User).filter(User.username == username).first()
    if user:
        log_user_activity(
            user_activity_logger,
            username,
            'user_logged_out',
            {
                'user_id': user.id,
                'logout_timestamp': time.time(),
                'logout_type': 'manual'
            }
        )
        logger.info(f"User logged out manually: {username}")
    
    return {"message": "Logged out successfully"}

@router.get("/available-courses", response_model=List[AvailableCourseResponse])
async def get_available_courses():
    """Get list of available course templates"""
    
    available_courses = [
        {
            "name": "Python Programming",
            "description": "Learn Python from basics to advanced concepts including data structures, OOP, and web development",
            "suggested_duration": 20,
            "difficulty_level": "Beginner to Intermediate"
        },
        {
            "name": "Pytorch Programming",
            "description": "Learn pytroch from basics to advanced concepts",
            "suggested_duration": 20,
            "difficulty_level": "Beginner to Advanced"
        },
        {
            "name": "Machine Learning",
            "description": "Comprehensive ML course covering algorithms, data preprocessing, model training, and deployment",
            "suggested_duration": 30,
            "difficulty_level": "Intermediate to Advanced"
        },
        {
            "name": "Web Development",
            "description": "Full-stack web development with HTML, CSS, JavaScript, React, and backend technologies",
            "suggested_duration": 25,
            "difficulty_level": "Beginner to Intermediate"
        },
        {
            "name": "Data Science",
            "description": "Data analysis, visualization, statistics, and machine learning for data-driven insights",
            "suggested_duration": 30,
            "difficulty_level": "Intermediate"
        },
        {
            "name": "JavaScript Fundamentals",
            "description": "Master JavaScript basics, ES6+, DOM manipulation, and asynchronous programming",
            "suggested_duration": 15,
            "difficulty_level": "Beginner"
        },
        {
            "name": "Database Design",
            "description": "SQL, database design principles, normalization, and query optimization",
            "suggested_duration": 20,
            "difficulty_level": "Beginner to Intermediate"
        }
    ]
    
    logger.info("Available courses retrieved")
    return available_courses

@router.post("/create-course", response_model=CourseResponse, status_code=status.HTTP_201_CREATED)
async def create_custom_course(course_data: CreateCourseRequest, db: Session = Depends(get_db)):
    """Create a new custom course"""
    
    start_time = time.time()
    
    # Get user
    user = db.query(User).filter(User.username == course_data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if course name already exists for this user
    existing_course = db.query(Course).filter(
        Course.course_name == course_data.course_name,
        Course.user_id == user.id
    ).first()
    
    if existing_course:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Course with this name already exists for user"
        )
    
    # Create new course
    new_course = Course(
        course_name=course_data.course_name,
        course_description=course_data.course_description,
        duration_days=course_data.duration_days,
        user_id=user.id,
        is_custom=True
    )
    
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    
    processing_time = time.time() - start_time
    
    # Log course creation
    log_user_activity(
        user_activity_logger,
        course_data.username,
        'custom_course_created',
        {
            'course_id': new_course.id,
            'course_name': course_data.course_name,
            'duration_days': course_data.duration_days,
            'is_custom': True
        }
    )
    
    log_performance_metric(
        performance_logger,
        'course_creation_time',
        processing_time,
        {'username': course_data.username}
    )
    
    logger.info(f"Custom course created: {course_data.course_name} for user {course_data.username}")
    
    return new_course

@router.get("/dashboard/{username}", response_model=List[CourseOverviewResponse])
async def get_user_dashboard(username: str, db: Session = Depends(get_db)):
    """Get enrolled courses overview for user dashboard"""
    
    start_time = time.time()
    
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get all courses for this user
    courses = db.query(Course).filter(Course.user_id == user.id).all()
    
    course_overviews = []
    for course in courses:
        # Calculate progress metrics
        total_questions = db.query(Question).filter(Question.course_id == course.id).count()
        answered_questions = db.query(Progress).filter(
            Progress.user_id == user.id,
            Progress.course_id == course.id
        ).count()
        
        total_points = db.query(func.sum(Question.points)).filter(Question.course_id == course.id).scalar() or 0
        earned_points = db.query(func.sum(Progress.earned_points)).filter(
            Progress.user_id == user.id,
            Progress.course_id == course.id
        ).scalar() or 0
        
        completion_percentage = (answered_questions / total_questions * 100) if total_questions > 0 else 0
        
        # Calculate current day using the new day progression system
        current_day = 1
        all_completed = True
        
        for day in range(1, course.duration_days + 1):
            day_status = get_day_status(user.id, course.id, day, course.duration_days, db)
            if day_status["is_current"]:
                current_day = day
                all_completed = False
                break
            elif not day_status["is_completed"]:
                all_completed = False
                
        # If all days are completed, show the last day
        if all_completed:
            current_day = course.duration_days
        
        # Get last activity (most recent progress entry)
        last_progress = db.query(Progress).filter(
            Progress.user_id == user.id,
            Progress.course_id == course.id
        ).order_by(Progress.id.desc()).first()
        
        last_activity = "Never" if not last_progress else "Recent"
        
        course_overview = CourseOverviewResponse(
            id=course.id,
            course_name=course.course_name,
            duration_days=course.duration_days,
            current_day=min(current_day, course.duration_days),
            completion_percentage=completion_percentage,
            total_questions=total_questions,
            answered_questions=answered_questions,
            earned_points=earned_points,
            total_points=total_points,
            last_activity=last_activity
        )
        course_overviews.append(course_overview)
    
    processing_time = time.time() - start_time
    
    # Log dashboard access
    log_user_activity(
        user_activity_logger,
        username,
        'dashboard_accessed',
        {
            'courses_count': len(courses),
            'total_questions': sum(c.total_questions for c in course_overviews),
            'total_points': sum(c.earned_points for c in course_overviews)
        }
    )
    
    log_performance_metric(
        performance_logger,
        'dashboard_load_time',
        processing_time,
        {'username': username, 'courses_count': len(courses)}
    )
    
    logger.info(f"Dashboard loaded for {username}: {len(courses)} courses")
    
    return course_overviews

@router.get("/course-progress/{username}/{course_name}", response_model=List[DayStatusResponse])
async def get_course_progress(username: str, course_name: str, db: Session = Depends(get_db)):
    """Get progress status for all days in a course"""
    
    start_time = time.time()
    
    # Get user and course
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    course = db.query(Course).filter(
        Course.user_id == user.id,
        Course.course_name == course_name
    ).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Get status for all days
    day_statuses = []
    for day in range(1, course.duration_days + 1):
        day_status = get_day_status(user.id, course.id, day, course.duration_days, db)
        day_statuses.append(DayStatusResponse(**day_status))
    
    processing_time = time.time() - start_time
    
    # Log course progress access
    log_user_activity(
        user_activity_logger,
        username,
        'course_progress_accessed',
        {
            'course_name': course_name,
            'total_days': course.duration_days,
            'completed_days': len([d for d in day_statuses if d.is_completed]),
            'current_day': next((d.day_number for d in day_statuses if d.is_current), 1)
        }
    )
    
    log_performance_metric(
        performance_logger,
        'course_progress_load_time',
        processing_time,
        {'username': username, 'course': course_name}
    )
    
    logger.info(f"Course progress loaded for {username}: {course_name}")
    
    return day_statuses

@router.post("/generate-plan", response_model=CourseResponse)
async def generate_plan(plan_data: GeneratePlanRequest, db: Session = Depends(get_db)):
    """Generate study plan using LLM"""
    
    start_time = time.time()
    
    # Find user
    user = db.query(User).filter(User.username == plan_data.username).first()
    if not user:
        log_user_activity(
            user_activity_logger,
            plan_data.username,
            'generate_plan_failed',
            {'reason': 'user_not_found', 'course': plan_data.course_name}
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if course already exists for this user
    existing_course = db.query(Course).filter(
        Course.user_id == user.id,
        Course.course_name == plan_data.course_name
    ).first()
    
    if existing_course:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Course already exists for this user"
        )
    
    # Create course
    course = Course(
        course_name=plan_data.course_name,
        duration_days=plan_data.duration_days,
        user_id=user.id
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    
    # Generate study plan using Gemini AI
    try:
        prompt = prompt_loader.get_study_plan_prompt(
            course_name=plan_data.course_name,
            duration_days=plan_data.duration_days
        )
        
        # Generate content using Gemini
        import google.generativeai as genai
        response = gemini_service.model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.8,  # Higher creativity for varied questions
                max_output_tokens=6000,  # More space for detailed content
            )
        )
        print(f'Study Plan Generatation: {response.text}')
        
        content = response.text
        # Clean up the response
        content = content.strip()
        if content.startswith('```json'):
            content = content[7:]
        if content.endswith('```'):
            content = content[:-3]
        content = content.strip()
        
        study_plan = json.loads(content)
        
        # Save only the study plans to database (questions will be generated adaptively later)
        for day_data in study_plan["days"]:
            # Create daily plan
            plan = Plan(
                day_number=day_data["day"],
                content=f"Objectives: {', '.join(day_data['objectives'])}\n\nContent: {day_data['content']}",
                course_id=course.id
            )
            db.add(plan)
        
        db.commit()
        
        # Log successful study plan creation
        processing_time = time.time() - start_time
        log_user_activity(
            user_activity_logger,
            plan_data.username,
            'study_plan_generated',
            {
                'course_name': plan_data.course_name,
                'duration_days': plan_data.duration_days,
                'course_id': course.id,
                'ai_generated': True
            }
        )
        
        log_performance_metric(
            performance_logger,
            'study_plan_creation_time',
            processing_time,
            {
                'course': plan_data.course_name,
                'duration_days': plan_data.duration_days,
                'username': plan_data.username
            }
        )
        
        logger.info(f"Study plan created for {plan_data.username}: {plan_data.course_name} ({plan_data.duration_days} days)")
        
    except Exception as e:
        # Log the error
        processing_time = time.time() - start_time
        log_user_activity(
            user_activity_logger,
            plan_data.username,
            'study_plan_generation_failed',
            {
                'course_name': plan_data.course_name,
                'error': str(e),
                'fallback_used': True
            }
        )
        
        logger.error(f"AI study plan generation failed for {plan_data.course_name}: {str(e)}")
        
        # Fallback: Create simple study plans (no questions - they'll be generated adaptively later)
        for day in range(1, plan_data.duration_days + 1):
            plan = Plan(
                day_number=day,
                content=f"Day {day}: Study {plan_data.course_name} fundamentals and core concepts",
                course_id=course.id
            )
            db.add(plan)
        
        db.commit()
        
        logger.info(f"Fallback study plan created for {plan_data.username}: {plan_data.course_name}")
    
    return course

@router.get("/plan/{username}/{course_name}", response_model=List[PlanResponse])
async def get_plan(username: str, course_name: str, db: Session = Depends(get_db)):
    """Fetch study plan for user and course"""
    
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    course = db.query(Course).filter(
        Course.user_id == user.id,
        Course.course_name == course_name
    ).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    plans = db.query(Plan).filter(Plan.course_id == course.id).order_by(Plan.day_number).all()
    return plans

@router.post("/generate-questions", response_model=List[QuestionResponse])
async def generate_questions_for_day(request: GenerateQuestionsRequest, db: Session = Depends(get_db)):
    """Generate questions for a specific day when user selects it"""
    
    start_time = time.time()
    
    # Get user and course
    user = db.query(User).filter(User.username == request.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    course = db.query(Course).filter(
        Course.user_id == user.id,
        Course.course_name == request.course_name
    ).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Check if day is unlocked
    day_status = get_day_status(user.id, course.id, request.day_number, course.duration_days, db)
    if not day_status["is_unlocked"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Day {request.day_number} is not unlocked yet. Complete previous days first."
        )
    
    # Check if questions already exist for this day
    existing_questions = db.query(Question).filter(
        Question.course_id == course.id,
        Question.day_number == request.day_number
    ).all()
    
    if existing_questions:
        # Return existing questions
        logger.info(f"Returning existing questions for {request.username}, course {request.course_name}, day {request.day_number}")
        return existing_questions
    
    # Get study plan content for the day
    plan = db.query(Plan).filter(
        Plan.course_id == course.id,
        Plan.day_number == request.day_number
    ).first()
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Study plan not found for day {request.day_number}"
        )
    
    # Generate questions using AI
    questions = await generate_adaptive_questions(
        course_name=request.course_name,
        day_number=request.day_number,
        total_days=course.duration_days,
        course_content=plan.content,
        user_accuracy=0.0,  # New day, no previous accuracy
        recent_accuracy=0.0,
        total_questions_answered=0,
        num_questions=request.num_questions
    )
    
    # Save questions to database
    question_objects = []
    for q_data in questions:
        # Ensure all required fields are present with random correct answer
        correct_answer = q_data.get("correct_answer", random.choice(['A', 'B', 'C', 'D']))
        if not correct_answer:
            correct_answer = random.choice(['A', 'B', 'C', 'D'])
            
        # Log the code snippet before cleaning
        raw_code_snippet = q_data.get("code_snippet", "")
        logger.info(f"Raw code snippet from LLM: {repr(raw_code_snippet)}")
        
        cleaned_code_snippet = clean_markdown_code_block(raw_code_snippet)
        logger.info(f"Cleaned code snippet: {repr(cleaned_code_snippet)}")
        
        question = Question(
            day_number=request.day_number,
            question=q_data.get("question", "Sample question"),
            difficulty=q_data.get("difficulty", "beginner"),
            points=q_data.get("points", 10),
            correct_answer=correct_answer,
            options=json.dumps(q_data.get("options", ["A) Default option"])),
            question_type=q_data.get("question_type", "conceptual"),
            code_snippet=cleaned_code_snippet,
            course_id=course.id
        )
        db.add(question)
        question_objects.append(question)
    
    db.commit()
    
    # Refresh objects to get IDs
    for question in question_objects:
        db.refresh(question)
    
    processing_time = time.time() - start_time
    
    # Log question generation
    log_user_activity(
        user_activity_logger,
        request.username,
        'questions_generated',
        {
            'course_name': request.course_name,
            'day_number': request.day_number,
            'num_questions': len(question_objects),
            'ai_generated': True
        }
    )
    
    log_performance_metric(
        performance_logger,
        'question_generation_time',
        processing_time,
        {
            'course': request.course_name,
            'day': request.day_number,
            'num_questions': len(question_objects)
        }
    )
    
    logger.info(f"Generated {len(question_objects)} questions for {request.username}, course {request.course_name}, day {request.day_number}")
    
    return question_objects

@router.get("/questions-review/{username}/{course_name}/{day}", response_model=List[QuestionReviewResponse])
async def get_questions_review(username: str, course_name: str, day: int, db: Session = Depends(get_db)):
    """Get questions with user answers and correct answers for review (completed days only)"""
    
    start_time = time.time()
    
    # Get user and course
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    course = db.query(Course).filter(
        Course.user_id == user.id,
        Course.course_name == course_name
    ).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Check if day is completed
    day_status = get_day_status(user.id, course.id, day, course.duration_days, db)
    if not day_status["is_completed"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Day must be completed to view review"
        )
    
    # Get all questions for this day
    questions = db.query(Question).filter(
        Question.course_id == course.id,
        Question.day_number == day
    ).order_by(Question.id).all()
    
    if not questions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No questions found for this day"
        )
    
    # Get user's progress for these questions
    progress_map = {}
    progress_records = db.query(Progress).filter(
        Progress.user_id == user.id,
        Progress.course_id == course.id,
        Progress.question_id.in_([q.id for q in questions])
    ).all()
    
    for progress in progress_records:
        progress_map[progress.question_id] = progress
    
    # Build review responses
    review_questions = []
    for question in questions:
        progress = progress_map.get(question.id)
        
        review_question = QuestionReviewResponse(
            id=question.id,
            day_number=question.day_number,
            question=question.question,
            difficulty=question.difficulty,
            points=question.points,
            options=question.options,
            correct_answer=question.correct_answer,
            user_answer=progress.user_answer if progress else None,
            is_correct=progress.is_correct if progress else None,
            earned_points=progress.earned_points if progress else 0
        )
        review_questions.append(review_question)
    
    processing_time = time.time() - start_time
    
    # Log review access
    log_user_activity(
        user_activity_logger,
        username,
        'questions_review_accessed',
        {
            'course_name': course_name,
            'day_number': day,
            'questions_count': len(questions),
            'user_score': sum(q.earned_points for q in review_questions),
            'total_points': sum(q.points for q in review_questions)
        }
    )
    
    log_performance_metric(
        performance_logger,
        'questions_review_load_time',
        processing_time,
        {'username': username, 'course': course_name, 'day': day}
    )
    
    logger.info(f"Questions review loaded for {username}: {course_name} day {day}")
    
    return review_questions

@router.get("/questions/{username}/{course_name}/{day}", response_model=List[QuestionResponse])
async def get_questions(username: str, course_name: str, day: int, db: Session = Depends(get_db)):
    """Get personalized questions for a specific day based on user's study patterns"""
    
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    course = db.query(Course).filter(
        Course.user_id == user.id,
        Course.course_name == course_name
    ).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Check if day is unlocked using the new day status system
    day_status = get_day_status(user.id, course.id, day, course.duration_days, db)
    if not day_status["is_unlocked"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Day {day} is not unlocked yet. Complete previous days first."
        )
    
    # Get existing questions for this day
    existing_questions = db.query(Question).filter(
        Question.course_id == course.id,
        Question.day_number == day
    ).all()
    
    # If questions don't exist, generate adaptive questions using AI
    if not existing_questions:
        try:
            # Get user's performance history for personalization
            user_progress = db.query(Progress).filter(
                Progress.user_id == user.id,
                Progress.course_id == course.id
            ).all()
            
            # Calculate user's performance metrics
            total_answered = len(user_progress)
            correct_answers = len([p for p in user_progress if p.is_correct])
            accuracy_rate = (correct_answers / total_answered * 100) if total_answered > 0 else 0
            
            # Get recent performance (last 5 questions)
            recent_progress = sorted(user_progress, key=lambda x: x.id, reverse=True)[:5]
            recent_accuracy = (len([p for p in recent_progress if p.is_correct]) / len(recent_progress) * 100) if recent_progress else 0
            
            # Get course content for context
            course_plan = db.query(Plan).filter(
                Plan.course_id == course.id,
                Plan.day_number == day
            ).first()
            
            course_content = course_plan.content if course_plan else f"Day {day} content for {course_name}"
            
            # Generate adaptive questions using Gemini AI
            adaptive_questions = await generate_adaptive_questions(
                course_name=course_name,
                day_number=day,
                total_days=course.duration_days,
                course_content=course_content,
                user_accuracy=accuracy_rate,
                recent_accuracy=recent_accuracy,
                total_questions_answered=total_answered
            )
            
            # Save generated questions to database
            for q_data in adaptive_questions:
                question = Question(
                    day_number=day,
                    question=q_data["question"],
                    difficulty=q_data["difficulty"],
                    points=q_data["points"],
                    correct_answer=q_data["correct_answer"],
                    options=json.dumps(q_data.get("options", [])),
                    course_id=course.id
                )
                db.add(question)
            
            db.commit()
            
            # Refresh the query to get the newly created questions
            existing_questions = db.query(Question).filter(
                Question.course_id == course.id,
                Question.day_number == day
            ).all()
            
        except Exception as e:
            # Fallback to basic questions if AI generation fails
            logger.error(f"Failed to generate adaptive questions: {str(e)}")
            # Create basic fallback questions
            for i in range(3):
                question = Question(
                    day_number=day,
                    question=f"Day {day} - Question {i+1} about {course_name}",
                    difficulty="intermediate",
                    points=15,
                    correct_answer="A",
                    options=json.dumps(["A) Correct answer", "B) Wrong", "C) Wrong", "D) Wrong"]),
                    course_id=course.id
                )
                db.add(question)
            db.commit()
            
            existing_questions = db.query(Question).filter(
                Question.course_id == course.id,
                Question.day_number == day
            ).all()
    
    return existing_questions

@router.post("/regenerate-questions", response_model=List[QuestionResponse])
async def regenerate_questions(regen_data: RegenerateQuestionsRequest, db: Session = Depends(get_db)):
    """Regenerate questions based on user preferences"""
    
    start_time = time.time()
    
    user = db.query(User).filter(User.username == regen_data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    course = db.query(Course).filter(
        Course.user_id == user.id,
        Course.course_name == regen_data.course_name
    ).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Check if day can be regenerated (must be unlocked but not completed)
    day_status = get_day_status(user.id, course.id, regen_data.day_number, course.duration_days, db)
    if not day_status["can_regenerate"]:
        if day_status["is_completed"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Day {regen_data.day_number} is completed and cannot be regenerated. Use review mode to see results."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Day {regen_data.day_number} is not unlocked yet. Complete previous days first."
            )
    
    # Delete existing questions for this day
    existing_questions = db.query(Question).filter(
        Question.course_id == course.id,
        Question.day_number == regen_data.day_number
    ).all()
    
    for question in existing_questions:
        # Also delete any progress for these questions
        db.query(Progress).filter(Progress.question_id == question.id).delete()
        db.delete(question)
    
    db.commit()
    
    # Get user's performance history for personalization
    user_progress = db.query(Progress).filter(
        Progress.user_id == user.id,
        Progress.course_id == course.id
    ).all()
    
    # Calculate user's performance metrics
    total_answered = len(user_progress)
    correct_answers = len([p for p in user_progress if p.is_correct])
    accuracy_rate = (correct_answers / total_answered * 100) if total_answered > 0 else 0
    
    # Get recent performance (last 5 questions)
    recent_progress = sorted(user_progress, key=lambda x: x.id, reverse=True)[:5]
    recent_accuracy = (len([p for p in recent_progress if p.is_correct]) / len(recent_progress) * 100) if recent_progress else 0
    
    # Get course content for context
    course_plan = db.query(Plan).filter(
        Plan.course_id == course.id,
        Plan.day_number == regen_data.day_number
    ).first()
    
    course_content = course_plan.content if course_plan else f"Day {regen_data.day_number} content for {regen_data.course_name}"
    
    try:
        # Generate customized questions using Gemini AI with user preferences
        custom_questions = await generate_custom_questions(
            course_name=regen_data.course_name,
            day_number=regen_data.day_number,
            total_days=course.duration_days,
            course_content=course_content,
            user_accuracy=accuracy_rate,
            recent_accuracy=recent_accuracy,
            total_questions_answered=total_answered,
            focus_areas=regen_data.focus_areas,
            difficulty_preference=regen_data.difficulty_preference,
            question_types=regen_data.question_types,
            special_instructions=regen_data.special_instructions,
            num_questions=regen_data.num_questions
        )
        
        # Save generated questions to database
        new_questions = []
        for q_data in custom_questions:
            # Ensure all required fields are present with random correct answer
            correct_answer = q_data.get("correct_answer", random.choice(['A', 'B', 'C', 'D']))
            if not correct_answer:
                correct_answer = random.choice(['A', 'B', 'C', 'D'])
                
            # Log the code snippet before cleaning
            raw_code_snippet = q_data.get("code_snippet", "")
            logger.info(f"Regenerate - Raw code snippet from LLM: {repr(raw_code_snippet)}")
            
            cleaned_code_snippet = clean_markdown_code_block(raw_code_snippet)
            logger.info(f"Regenerate - Cleaned code snippet: {repr(cleaned_code_snippet)}")
                
            question = Question(
                day_number=regen_data.day_number,
                question=q_data.get("question", "Sample question"),
                difficulty=q_data.get("difficulty", "beginner"),
                points=q_data.get("points", 10),
                correct_answer=correct_answer,
                options=json.dumps(q_data.get("options", ["A) Default option"])),
                question_type=q_data.get("question_type", "conceptual"),
                code_snippet=cleaned_code_snippet,
                course_id=course.id
            )
            db.add(question)
            new_questions.append(question)
        
        db.commit()
        
        # Refresh to get IDs
        for question in new_questions:
            db.refresh(question)
        
        processing_time = time.time() - start_time
        
        # Log successful regeneration
        log_user_activity(
            user_activity_logger,
            regen_data.username,
            'questions_regenerated',
            {
                'course_name': regen_data.course_name,
                'day_number': regen_data.day_number,
                'question_count': len(new_questions),
                'focus_areas': regen_data.focus_areas,
                'difficulty_preference': regen_data.difficulty_preference,
                'special_instructions': regen_data.special_instructions
            }
        )
        
        log_performance_metric(
            performance_logger,
            'questions_regeneration_time',
            processing_time,
            {
                'course': regen_data.course_name,
                'day': regen_data.day_number,
                'question_count': len(new_questions)
            }
        )
        
        logger.info(f"Regenerated {len(new_questions)} questions for {regen_data.username}: {regen_data.course_name} day {regen_data.day_number}")
        
        return new_questions
        
    except Exception as e:
        processing_time = time.time() - start_time
        
        log_user_activity(
            user_activity_logger,
            regen_data.username,
            'questions_regeneration_failed',
            {
                'course_name': regen_data.course_name,
                'day_number': regen_data.day_number,
                'error': str(e)
            }
        )
        
        logger.error(f"Failed to regenerate questions for {regen_data.username}: {str(e)}")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to regenerate questions. Please try again."
        )

@router.post("/evaluate-question", response_model=QuestionEvaluationResponse)
async def evaluate_programming_question(
    question_data: dict,
    db: Session = Depends(get_db)
):
    """Evaluate a programming question using LLM for quality assessment"""
    
    start_time = time.time()
    
    try:
        # Extract question data
        course_name = question_data.get("course_name", "Programming Course")
        day_number = question_data.get("day_number", 1)
        question_type = question_data.get("question_type", "conceptual")
        difficulty = question_data.get("difficulty", "beginner")
        question = question_data.get("question", "")
        options = question_data.get("options", "")
        correct_answer = question_data.get("correct_answer", "")
        explanation = question_data.get("explanation", "")
        code_snippet = clean_markdown_code_block(question_data.get("code_snippet", ""))
        
        # Generate evaluation prompt
        prompt = prompt_loader.get_programming_question_evaluation_prompt(
            course_name=course_name,
            day_number=day_number,
            question_type=question_type,
            difficulty=difficulty,
            question=question,
            options=options,
            correct_answer=correct_answer,
            explanation=explanation,
            code_snippet=code_snippet
        )
        
        # Log the evaluation request
        log_llm_request(
            gemini_logger,
            prompt,
            {
                'course_name': course_name,
                'day_number': day_number,
                'question_type': question_type,
                'difficulty': difficulty
            }
        )
        
        # Get evaluation from Gemini AI
        import google.generativeai as genai
        response = gemini_service.model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.3,  # Lower temperature for consistent evaluation
                max_output_tokens=2000,
            )
        )
        
        content = response.text.strip()
        if content.startswith('```json'):
            content = content[7:]
        if content.endswith('```'):
            content = content[:-3]
        content = content.strip()
        
        evaluation = json.loads(content)
        
        # Log the evaluation response
        log_llm_response(
            gemini_logger,
            content,
            {
                'course_name': course_name,
                'day_number': day_number,
                'overall_score': evaluation.get('overall_score', 0)
            }
        )
        
        processing_time = time.time() - start_time
        
        # Log performance metric
        log_performance_metric(
            performance_logger,
            'question_evaluation_time',
            processing_time,
            {'course_name': course_name, 'day_number': day_number}
        )
        
        logger.info(f"Question evaluated for {course_name} day {day_number}: Score {evaluation.get('overall_score', 0)}")
        
        return QuestionEvaluationResponse(**evaluation)
        
    except Exception as e:
        processing_time = time.time() - start_time
        
        log_user_activity(
            user_activity_logger,
            "system",
            'question_evaluation_failed',
            {
                'course_name': course_name if 'course_name' in locals() else 'unknown',
                'day_number': day_number if 'day_number' in locals() else 0,
                'error': str(e)
            }
        )
        
        logger.error(f"Failed to evaluate question: {str(e)}")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to evaluate question. Please try again."
        )

async def generate_custom_questions(
    course_name: str,
    day_number: int,
    total_days: int,
    course_content: str,
    user_accuracy: float,
    recent_accuracy: float,
    total_questions_answered: int,
    focus_areas: List[str],
    difficulty_preference: str,
    question_types: List[str],
    special_instructions: str,
    num_questions: int = 10
) -> List[dict]:
    """Generate custom questions based on user preferences and study patterns"""
    
    # Adjust difficulty based on user preference
    if difficulty_preference == "easier":
        difficulty_adjustment = "easier with more detailed explanations"
        base_points = 8
    elif difficulty_preference == "harder":
        difficulty_adjustment = "more challenging with complex scenarios"
        base_points = 25
    else:  # balanced
        difficulty_adjustment = "balanced difficulty"
        base_points = 15
    
    # Determine focus based on user input
    if focus_areas:
        focus = f"specifically focus on: {', '.join(focus_areas)}"
    else:
        focus = "general understanding of the topic"
    
    # Question type preferences
    if question_types:
        type_instruction = f"Emphasize {', '.join(question_types)} questions"
    else:
        type_instruction = "Include a mix of conceptual, practical, and analytical questions"
    
    prompt = prompt_loader.get_custom_questions_prompt(
        course_name=course_name,
        day_number=day_number,
        total_days=total_days,
        course_content=course_content,
        focus_areas=focus,
        difficulty_preference=difficulty_preference,
        question_types=type_instruction,
        special_instructions=special_instructions or "",
        num_questions=num_questions
    )
    
    try:
        start_time = time.time()
        
        # Log the custom question generation request
        user_context = {
            'course_name': course_name,
            'day_number': day_number,
            'user_accuracy': user_accuracy,
            'recent_accuracy': recent_accuracy,
            'focus_areas': focus_areas,
            'difficulty_preference': difficulty_preference,
            'question_types': question_types,
            'special_instructions': special_instructions
        }
        
        log_llm_request(gemini_logger, prompt, user_context)
        
        import google.generativeai as genai
        generation_config = genai.types.GenerationConfig(
            temperature=0.9,  # High creativity for varied questions
            max_output_tokens=3500,
        )
        
        response = gemini_service.model.generate_content(prompt, generation_config=generation_config)
        
        processing_time = time.time() - start_time
        content = response.text.strip()
        
        # Log the raw response
        log_llm_response(
            gemini_logger,
            content,
            generation_config={'temperature': 0.9, 'max_output_tokens': 3500},
            processing_time=processing_time
        )
        
        # Clean up response
        if content.startswith('```json'):
            content = content[7:]
        if content.endswith('```'):
            content = content[:-3]
        content = content.strip()
        
        questions = json.loads(content)
        
        # Validate and fix each question
        validated_questions = []
        for i, q in enumerate(questions):
            if isinstance(q, dict):
                # Ensure all required fields exist with random correct answer
                default_correct = random.choice(['A', 'B', 'C', 'D'])
                validated_q = {
                    "question": q.get("question", f"Sample question {i+1}"),
                    "difficulty": q.get("difficulty", "beginner"),
                    "points": q.get("points", 10),
                    "correct_answer": q.get("correct_answer", default_correct),
                    "options": q.get("options", [
                        "A) Default option A", 
                        "B) Default option B", 
                        "C) Default option C", 
                        "D) Default option D"
                    ]),
                    "explanation": q.get("explanation", "Default explanation"),
                    "question_type": q.get("question_type", "conceptual"),
                    "code_snippet": q.get("code_snippet", "")
                }
                
                # Ensure correct_answer is not None or empty
                if not validated_q["correct_answer"]:
                    validated_q["correct_answer"] = random.choice(['A', 'B', 'C', 'D'])
                
                # Randomize the question options if using defaults
                if q.get("question", "").startswith("Sample question") or not q.get("correct_answer"):
                    validated_q = randomize_question_options(validated_q)
                    
                validated_questions.append(validated_q)
        
        questions = validated_questions
        
        # Log success metrics
        log_performance_metric(
            performance_logger,
            'custom_questions_generation_time',
            processing_time,
            {
                'course': course_name,
                'day': day_number,
                'question_count': len(questions),
                'difficulty_preference': difficulty_preference
            }
        )
        
        gemini_logger.info(f"CUSTOM_QUESTIONS_SUCCESS: Generated {len(questions)} custom questions for {course_name} day {day_number}")
        logger.info(f"Generated {len(questions)} custom questions for {course_name} day {day_number} in {processing_time:.2f}s")
        
        return questions
        
    except Exception as e:
        processing_time = time.time() - start_time if 'start_time' in locals() else 0
        
        # Log the error
        log_llm_error(
            gemini_logger, 
            e, 
            prompt if 'prompt' in locals() else None, 
            user_context if 'user_context' in locals() else None
        )
        
        logger.error(f"Failed to generate custom questions for {course_name} day {day_number}: {str(e)}")
        
        # Fallback questions
        return [
            {
                "question": f"What is a key concept from today's lesson on {course_name}?",
                "difficulty": "intermediate",
                "points": base_points,
                "correct_answer": "A",
                "options": ["A) Key concept", "B) Wrong", "C) Wrong", "D) Wrong"],
                "explanation": "This tests understanding of the main concept."
            }
        ]

async def generate_adaptive_questions(
    course_name: str,
    day_number: int,
    total_days: int,
    course_content: str,
    user_accuracy: float,
    recent_accuracy: float,
    total_questions_answered: int,
    num_questions: int = 10
) -> List[dict]:
    """Generate adaptive questions based on user's study patterns and performance"""
    
    # Determine difficulty adjustment based on performance
    if recent_accuracy >= 80:
        difficulty_adjustment = "slightly harder"
        base_points = 20
    elif recent_accuracy >= 60:
        difficulty_adjustment = "balanced"
        base_points = 15
    else:
        difficulty_adjustment = "slightly easier with more explanation"
        base_points = 10
    
    # Determine question focus based on progress
    if total_questions_answered < 5:
        focus = "fundamental concepts with clear explanations"
    elif total_questions_answered < 15:
        focus = "practical applications and examples"
    else:
        focus = "advanced problem-solving and critical thinking"
    
    prompt = prompt_loader.get_adaptive_questions_prompt(
        course_name=course_name,
        day_number=day_number,
        total_days=total_days,
        course_content=course_content,
        user_accuracy=user_accuracy,
        recent_accuracy=recent_accuracy,
        total_questions_answered=total_questions_answered,
        num_questions=num_questions
    )
    
    try:
        start_time = time.time()
        
        # Log the adaptive question generation request
        user_context = {
            'course_name': course_name,
            'day_number': day_number,
            'user_accuracy': user_accuracy,
            'recent_accuracy': recent_accuracy,
            'total_questions_answered': total_questions_answered,
            'difficulty_adjustment': difficulty_adjustment,
            'focus': focus
        }
        
        log_llm_request(gemini_logger, prompt, user_context)
        
        import google.generativeai as genai
        generation_config = genai.types.GenerationConfig(
            temperature=0.9,  # High creativity for varied questions
            max_output_tokens=3000,
        )
        
        response = gemini_service.model.generate_content(prompt, generation_config=generation_config)
        
        processing_time = time.time() - start_time
        content = response.text.strip()
        
        # Log the raw response
        log_llm_response(
            gemini_logger,
            content,
            generation_config={'temperature': 0.9, 'max_output_tokens': 3000},
            processing_time=processing_time
        )
        
        # Clean up response
        if content.startswith('```json'):
            content = content[7:]
        if content.endswith('```'):
            content = content[:-3]
        content = content.strip()
        
        questions = json.loads(content)
        
        # Validate and fix each question
        validated_questions = []
        for i, q in enumerate(questions):
            if isinstance(q, dict):
                # Ensure all required fields exist with random correct answer
                default_correct = random.choice(['A', 'B', 'C', 'D'])
                validated_q = {
                    "question": q.get("question", f"Sample question {i+1}"),
                    "difficulty": q.get("difficulty", "beginner"),
                    "points": q.get("points", 10),
                    "correct_answer": q.get("correct_answer", default_correct),
                    "options": q.get("options", [
                        "A) Default option A", 
                        "B) Default option B", 
                        "C) Default option C", 
                        "D) Default option D"
                    ]),
                    "explanation": q.get("explanation", "Default explanation"),
                    "question_type": q.get("question_type", "conceptual"),
                    "code_snippet": q.get("code_snippet", "")
                }
                
                # Ensure correct_answer is not None or empty
                if not validated_q["correct_answer"]:
                    validated_q["correct_answer"] = random.choice(['A', 'B', 'C', 'D'])
                
                # Randomize the question options if using defaults
                if q.get("question", "").startswith("Sample question") or not q.get("correct_answer"):
                    validated_q = randomize_question_options(validated_q)
                    
                validated_questions.append(validated_q)
        
        questions = validated_questions
        
        # Log success metrics
        log_performance_metric(
            performance_logger,
            'adaptive_questions_generation_time',
            processing_time,
            {
                'course': course_name,
                'day': day_number,
                'question_count': len(questions),
                'user_accuracy': user_accuracy
            }
        )
        
        gemini_logger.info(f"ADAPTIVE_QUESTIONS_SUCCESS: Generated {len(questions)} questions for {course_name} day {day_number}")
        logger.info(f"Generated {len(questions)} adaptive questions for {course_name} day {day_number} in {processing_time:.2f}s")
        
        return questions
        
    except Exception as e:
        processing_time = time.time() - start_time if 'start_time' in locals() else 0
        
        # Log the error
        log_llm_error(
            gemini_logger, 
            e, 
            prompt if 'prompt' in locals() else None, 
            user_context if 'user_context' in locals() else None
        )
        
        log_performance_metric(
            performance_logger,
            'adaptive_questions_generation_error',
            processing_time,
            {
                'course': course_name,
                'day': day_number,
                'error': str(e)
            }
        )
        
        logger.error(f"Failed to generate adaptive questions for {course_name} day {day_number}: {str(e)}")
        
        # Fallback questions with random correct answers
        correct_pos = random.choice(['A', 'B', 'C', 'D'])
        options = ["Wrong option 1", "Wrong option 2", "Wrong option 3", "Wrong option 4"]
        correct_idx = ord(correct_pos) - ord('A')
        options[correct_idx] = f"Key concept from {course_name}"
        
        # Format options with letters
        formatted_options = [f"{chr(65+j)}) {opt}" for j, opt in enumerate(options)]
        
        return [
            {
                "question": f"What is a key concept from today's lesson on {course_name}?",
                "difficulty": "intermediate",
                "points": base_points,
                "correct_answer": correct_pos,
                "options": formatted_options,
                "explanation": f"This tests understanding of the main concept from {course_name}."
            }
        ]

@router.post("/submit-answer", response_model=SubmitAnswerResponse)
async def submit_answer(answer_data: SubmitAnswerRequest, db: Session = Depends(get_db)):
    """Submit answer and update score"""
    
    start_time = time.time()
    
    user = db.query(User).filter(User.username == answer_data.username).first()
    if not user:
        log_user_activity(
            user_activity_logger,
            answer_data.username,
            'submit_answer_failed',
            {'reason': 'user_not_found', 'question_id': answer_data.question_id}
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    question = db.query(Question).filter(Question.id == answer_data.question_id).first()
    if not question:
        log_user_activity(
            user_activity_logger,
            answer_data.username,
            'submit_answer_failed',
            {'reason': 'question_not_found', 'question_id': answer_data.question_id}
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    # Check if already answered - allow re-attempts
    existing_progress = db.query(Progress).filter(
        Progress.user_id == user.id,
        Progress.question_id == answer_data.question_id
    ).first()
    
    # Check answer
    is_correct = answer_data.user_answer.strip().upper() == question.correct_answer.strip().upper()
    earned_points = question.points if is_correct else 0
    
    if existing_progress:
        # Update existing progress record (re-attempt)
        existing_progress.is_correct = is_correct
        existing_progress.earned_points = earned_points
        existing_progress.user_answer = answer_data.user_answer
        existing_progress.updated_at = datetime.utcnow() if hasattr(existing_progress, 'updated_at') else None
        
        log_user_activity(
            user_activity_logger,
            answer_data.username,
            'answer_reattempted',
            {
                'question_id': question.id,
                'day_number': question.day_number,
                'difficulty': question.difficulty,
                'is_correct': is_correct,
                'earned_points': earned_points,
                'user_answer': answer_data.user_answer,
                'correct_answer': question.correct_answer,
                'previous_answer': existing_progress.user_answer
            }
        )
    else:
        # Create new progress record (first attempt)
        progress = Progress(
            user_id=user.id,
            course_id=question.course_id,
            question_id=question.id,
            is_correct=is_correct,
            earned_points=earned_points,
            user_answer=answer_data.user_answer
        )
        db.add(progress)
        
        log_user_activity(
            user_activity_logger,
            answer_data.username,
            'answer_submitted',
            {
                'question_id': question.id,
                'day_number': question.day_number,
                'difficulty': question.difficulty,
                'is_correct': is_correct,
                'earned_points': earned_points,
                'user_answer': answer_data.user_answer,
                'correct_answer': question.correct_answer
            }
        )
    
    db.commit()
    
    processing_time = time.time() - start_time
    
    # Log user activity
    log_user_activity(
        user_activity_logger,
        answer_data.username,
        'answer_submitted',
        {
            'question_id': question.id,
            'day_number': question.day_number,
            'difficulty': question.difficulty,
            'is_correct': is_correct,
            'earned_points': earned_points,
            'user_answer': answer_data.user_answer,
            'correct_answer': question.correct_answer
        }
    )
    
    # Log performance metrics
    log_performance_metric(
        performance_logger,
        'answer_submission_time',
        processing_time,
        {
            'username': answer_data.username,
            'question_difficulty': question.difficulty,
            'is_correct': is_correct
        }
    )
    
    feedback = "Correct! Well done!" if is_correct else f"Incorrect. The correct answer is: {question.correct_answer}"
    
    logger.info(f"Answer submitted by {answer_data.username}: Q{question.id} - {'CORRECT' if is_correct else 'INCORRECT'} ({earned_points} points)")
    
    return SubmitAnswerResponse(
        is_correct=is_correct,
        earned_points=earned_points,
        correct_answer=question.correct_answer,
        feedback=feedback
    )

@router.get("/progress/{username}/{course_name}", response_model=ProgressResponse)
async def get_progress(username: str, course_name: str, db: Session = Depends(get_db)):
    """Get user progress for a course"""
    
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    course = db.query(Course).filter(
        Course.user_id == user.id,
        Course.course_name == course_name
    ).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Calculate progress
    total_questions = db.query(Question).filter(Question.course_id == course.id).count()
    answered_questions = db.query(Progress).filter(
        Progress.user_id == user.id,
        Progress.course_id == course.id
    ).count()
    
    total_points = db.query(func.sum(Question.points)).filter(Question.course_id == course.id).scalar() or 0
    earned_points = db.query(func.sum(Progress.earned_points)).filter(
        Progress.user_id == user.id,
        Progress.course_id == course.id
    ).scalar() or 0
    
    completion_percentage = (answered_questions / total_questions * 100) if total_questions > 0 else 0
    
    # Calculate current day
    current_day = 1
    for day in range(1, course.duration_days + 1):
        day_questions = db.query(Question).filter(
            Question.course_id == course.id,
            Question.day_number == day
        ).count()
        
        day_answered = db.query(Progress).filter(
            Progress.user_id == user.id,
            Progress.course_id == course.id
        ).join(Question).filter(Question.day_number == day).count()
        
        if day_answered < day_questions:
            current_day = day
            break
        else:
            current_day = day + 1
    
    return ProgressResponse(
        user_id=user.id,
        course_id=course.id,
        total_questions=total_questions,
        answered_questions=answered_questions,
        earned_points=earned_points,
        total_points=total_points,
        completion_percentage=completion_percentage,
        current_day=min(current_day, course.duration_days)
    )
