import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  LinearProgress,
  Chip,
  AppBar,
  Toolbar,
  IconButton,
  Alert,
  CircularProgress,
  Avatar,
} from '@mui/material'
import {
  School,
  Add,
  PlayArrow,
  TrendingUp,
  EmojiEvents,
  Logout,
} from '@mui/icons-material'

import { learningApiService, User, CourseOverview } from '../../services/learningApiService'
import SessionStatus from '../../components/SessionStatus'

interface Props {
  user: User
  onSelectCourse: (course: CourseOverview) => void
  onCreateNewCourse: () => void
  onLogout: () => void
}

function DashboardPage({ user, onSelectCourse, onCreateNewCourse, onLogout }: Props) {
  const [courses, setCourses] = useState<CourseOverview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const coursesData = await learningApiService.getDashboard(user.username)
      setCourses(coursesData)
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyColor = (completion: number) => {
    if (completion >= 80) return 'success'
    if (completion >= 50) return 'warning'
    return 'error'
  }

  const getStatusText = (course: CourseOverview) => {
    if (course.completion_percentage >= 100) return 'Completed'
    if (course.completion_percentage > 0) return 'In Progress'
    return 'Not Started'
  }

  const getStatusColor = (course: CourseOverview) => {
    if (course.completion_percentage >= 100) return 'success'
    if (course.completion_percentage > 0) return 'primary'
    return 'default'
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <School sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            LearnPath Dashboard
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            Welcome back, {user.name}!
          </Typography>
          <SessionStatus />
          <IconButton color="inherit" onClick={onLogout} sx={{ ml: 1 }}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              My Learning Journey
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Continue your courses or start a new learning adventure
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={onCreateNewCourse}
            size="large"
          >
            Start New Course
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {courses.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 8 }}>
            <CardContent>
              <School sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom>
                No Courses Yet
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Start your learning journey by creating your first AI-powered study plan
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<Add />}
                onClick={onCreateNewCourse}
              >
                Create Your First Course
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {courses.map((course) => (
              <Grid item xs={12} sm={6} md={4} key={course.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    {/* Course Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        <School />
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" noWrap>
                          {course.course_name}
                        </Typography>
                        <Chip
                          label={getStatusText(course)}
                          color={getStatusColor(course) as any}
                          size="small"
                        />
                      </Box>
                    </Box>

                    {/* Course Overview */}
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {course.duration_days}-day comprehensive learning program
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Day {course.current_day} of {course.duration_days}
                      </Typography>
                    </Box>

                    {/* Progress Bar */}
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" fontWeight="medium">
                          Progress
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {Math.round(course.completion_percentage)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={course.completion_percentage}
                        color={getDifficultyColor(course.completion_percentage) as any}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    {/* Statistics */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                          <Typography variant="h6" color="primary">
                            {course.answered_questions}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Questions Done
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                          <Typography variant="h6" color="warning.main">
                            {course.earned_points}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Points Earned
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Action Button */}
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      startIcon={<PlayArrow />}
                      onClick={() => onSelectCourse(course)}
                      sx={{ mt: 'auto' }}
                    >
                      {course.completion_percentage >= 100 ? 'Review Course' : 'Continue Learning'}
                    </Button>

                    {/* Last Activity */}
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                      Last activity: {course.last_activity}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Overall Stats */}
        {courses.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
              Overall Progress
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <School sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h4">{courses.length}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Courses
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <TrendingUp sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                    <Typography variant="h4">
                      {courses.reduce((sum, course) => sum + course.answered_questions, 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Questions Answered
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <EmojiEvents sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                    <Typography variant="h4">
                      {courses.reduce((sum, course) => sum + course.earned_points, 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Points
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default DashboardPage
