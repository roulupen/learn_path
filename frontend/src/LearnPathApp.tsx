import React, { useState, useEffect } from 'react'
import { Box, Container, Snackbar, Alert } from '@mui/material'
import { sessionManager, trackActivity } from './utils/sessionManager'

// Learning pages for the LearnPath application
import LoginRegisterPage from './pages/learning/LoginRegisterPage'
import DashboardPage from './pages/learning/DashboardPage'
import CourseSelectionPage from './pages/learning/CourseSelectionPage'
import StudyPlanPage from './pages/learning/StudyPlanPage'
import QuestionCustomizationPage from './pages/learning/QuestionCustomizationPage'
import QuestionPage from './pages/learning/QuestionPage'
import ProgressDashboard from './pages/learning/ProgressDashboard'
import ReviewPage from './pages/learning/ReviewPage'

type Page = 'login' | 'dashboard' | 'course-selection' | 'study-plan' | 'question-customization' | 'questions' | 'progress' | 'review'

interface User {
  id: number
  name: string
  username: string
}

interface Course {
  id: number
  course_name: string
  duration_days: number
  user_id: number
}

interface CourseOverview {
  id: number
  course_name: string
  duration_days: number
  current_day: number
  completion_percentage: number
  total_questions: number
  answered_questions: number
  earned_points: number
  total_points: number
  last_activity: string
}

function LearnPathApp() {
  const [currentPage, setCurrentPage] = useState<Page>('login')
  const [user, setUser] = useState<User | null>(null)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [currentDay, setCurrentDay] = useState(1)
  const [sessionWarning, setSessionWarning] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(15)

  // Initialize session on app load
  useEffect(() => {
    const savedSession = sessionManager.getSession()
    if (savedSession) {
      setUser(savedSession.user)
      setCurrentPage('dashboard')
      console.log('Session restored for user:', savedSession.user.username)
    }

    // Set up session expiration handler
    sessionManager.setOnSessionExpired(() => {
      console.log('Session expired - logging out user')
      handleLogout()
    })

    // Set up session warning (show warning at 2 minutes remaining)
    const warningInterval = setInterval(() => {
      const remaining = sessionManager.getTimeRemaining()
      setTimeRemaining(remaining)
      
      if (remaining <= 2 && remaining > 0 && sessionManager.isLoggedIn()) {
        setSessionWarning(true)
      } else {
        setSessionWarning(false)
      }
    }, 30000) // Check every 30 seconds

    return () => {
      clearInterval(warningInterval)
    }
  }, [])

  const handleLogin = (userData: User) => {
    setUser(userData)
    sessionManager.saveSession(userData)
    setCurrentPage('dashboard')
    console.log('User logged in and session saved:', userData.username)
  }

  const handleCourseSelection = (course: Course) => {
    setSelectedCourse(course)
    setCurrentPage('study-plan')
  }

  const handleStartDay = (day: number, isReview: boolean = false) => {
    setCurrentDay(day)
    if (isReview) {
      setCurrentPage('review')
    } else {
      setCurrentPage('question-customization')
    }
  }

  const handleSelectCourseFromDashboard = (courseOverview: CourseOverview) => {
    // Convert CourseOverview to Course for compatibility
    const course: Course = {
      id: courseOverview.id,
      course_name: courseOverview.course_name,
      duration_days: courseOverview.duration_days,
      user_id: user!.id
    }
    setSelectedCourse(course)
    setCurrentDay(courseOverview.current_day)
    setCurrentPage('study-plan')
  }

  const handleCreateNewCourse = () => {
    setCurrentPage('course-selection')
  }

  const handleQuestionsGenerated = () => {
    setCurrentPage('questions')
  }

  const handleDayComplete = () => {
    setCurrentPage('progress')
  }

  const handleBackToStudyPlan = () => {
    setCurrentPage('study-plan')
  }

  const handleBackToDashboard = () => {
    setSelectedCourse(null)
    setCurrentDay(1)
    setCurrentPage('dashboard')
  }

  const handleViewProgress = () => {
    setCurrentPage('progress')
  }

  const handleLogout = async () => {
    console.log('User logging out:', user?.username)
    
    // Call backend logout endpoint
    if (user) {
      try {
        const { learningApiService } = await import('./services/learningApiService')
        await learningApiService.logout(user.username)
      } catch (error) {
        console.error('Error during logout:', error)
        // Continue with logout even if backend call fails
      }
    }
    
    sessionManager.clearSession()
    setUser(null)
    setSelectedCourse(null)
    setCurrentDay(1)
    setCurrentPage('login')
    setSessionWarning(false)
  }

  const handleExtendSession = () => {
    sessionManager.extendSession()
    setSessionWarning(false)
    console.log('Session extended by user')
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ minHeight: '100vh', py: 4 }}>
        {currentPage === 'login' && (
          <LoginRegisterPage onLogin={handleLogin} />
        )}
        
        {currentPage === 'dashboard' && user && (
          <DashboardPage
            user={user}
            onSelectCourse={handleSelectCourseFromDashboard}
            onCreateNewCourse={handleCreateNewCourse}
            onLogout={handleLogout}
          />
        )}
        
        {currentPage === 'course-selection' && user && (
          <CourseSelectionPage 
            user={user}
            onCourseSelected={handleCourseSelection}
            onLogout={handleLogout}
          />
        )}
        
        {currentPage === 'study-plan' && user && selectedCourse && (
          <StudyPlanPage
            user={user}
            course={selectedCourse}
            onStartDay={handleStartDay}
            onViewProgress={handleViewProgress}
            onBackToDashboard={handleBackToDashboard}
            onLogout={handleLogout}
          />
        )}
        
        {currentPage === 'question-customization' && user && selectedCourse && (
          <QuestionCustomizationPage
            user={user}
            course={selectedCourse}
            dayNumber={currentDay}
            onQuestionsGenerated={handleQuestionsGenerated}
            onBack={handleBackToStudyPlan}
            onBackToDashboard={handleBackToDashboard}
          />
        )}
        
        {currentPage === 'questions' && user && selectedCourse && (
          <QuestionPage
            user={user}
            course={selectedCourse}
            currentDay={currentDay}
            onDayComplete={handleDayComplete}
            onBackToStudyPlan={handleBackToStudyPlan}
            onBackToDashboard={handleBackToDashboard}
          />
        )}
        
        {currentPage === 'progress' && user && selectedCourse && (
          <ProgressDashboard
            user={user}
            course={selectedCourse}
            onBackToStudyPlan={handleBackToStudyPlan}
            onBackToDashboard={handleBackToDashboard}
            onLogout={handleLogout}
          />
        )}
        
        {currentPage === 'review' && user && selectedCourse && (
          <ReviewPage
            user={user}
            course={selectedCourse}
            dayNumber={currentDay}
            onBack={handleBackToStudyPlan}
            onBackToDashboard={handleBackToDashboard}
          />
        )}

        {/* Session Warning */}
        <Snackbar
          open={sessionWarning}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          onClose={() => setSessionWarning(false)}
        >
          <Alert
            severity="warning"
            action={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <button
                  onClick={handleExtendSession}
                  style={{
                    background: '#fff',
                    border: '1px solid #ff9800',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    cursor: 'pointer'
                  }}
                >
                  Extend Session
                </button>
                <button
                  onClick={handleLogout}
                  style={{
                    background: '#f44336',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    cursor: 'pointer'
                  }}
                >
                  Logout
                </button>
              </Box>
            }
          >
            ⚠️ Your session will expire in {timeRemaining} minute{timeRemaining !== 1 ? 's' : ''}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  )
}

export default LearnPathApp
