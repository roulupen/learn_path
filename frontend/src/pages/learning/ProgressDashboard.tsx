import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Grid,
  LinearProgress,
  Alert,
  CircularProgress,
} from '@mui/material'
import {
  ArrowBack,
  Logout,
  School,
  TrendingUp,
  EmojiEvents,
  Assignment,
  Home,
} from '@mui/icons-material'

import { learningApiService, User, Course, Progress } from '../../services/learningApiService'

interface Props {
  user: User
  course: Course
  onBackToStudyPlan: () => void
  onBackToDashboard: () => void
  onLogout: () => void
}

function ProgressDashboard({ user, course, onBackToStudyPlan, onBackToDashboard, onLogout }: Props) {
  const [progress, setProgress] = useState<Progress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadProgress()
  }, [])

  const loadProgress = async () => {
    try {
      const progressData = await learningApiService.getProgress(user.username, course.course_name)
      setProgress(progressData)
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to load progress')
    } finally {
      setLoading(false)
    }
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
            <IconButton color="inherit" onClick={onBackToStudyPlan}>
              <ArrowBack />
            </IconButton>
            <School sx={{ mr: 2 }} />
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Progress Dashboard
            </Typography>
            <Button color="inherit" onClick={onBackToDashboard} startIcon={<Home />}>
              Dashboard
            </Button>
            <IconButton color="inherit" onClick={onLogout}>
              <Logout />
            </IconButton>
          </Toolbar>
        </AppBar>

      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Your Learning Progress
          </Typography>
          <Typography variant="h6" color="primary" gutterBottom>
            {course.course_name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your learning journey and celebrate your achievements!
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {progress ? (
          <Grid container spacing={3}>
            {/* Overall Progress */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    Overall Progress
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        Completion
                      </Typography>
                      <Typography variant="body2">
                        {Math.round(progress.completion_percentage)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={progress.completion_percentage}
                      sx={{ height: 12, borderRadius: 6 }}
                    />
                  </Box>
                  <Typography variant="body1" color="text.secondary">
                    {progress.completion_percentage >= 100 
                      ? `Course completed! All ${course.duration_days} days finished.`
                      : `You're currently on Day ${progress.current_day} of ${course.duration_days}`
                    }
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Stats Cards */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Assignment sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h4">{progress.answered_questions}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Questions Answered
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    out of {progress.total_questions}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <EmojiEvents sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                  <Typography variant="h4">{progress.earned_points}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Points Earned
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    out of {progress.total_points}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <TrendingUp sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                  <Typography variant="h4">{progress.current_day}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Current Day
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    of {course.duration_days} days
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Detailed Progress */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    Detailed Statistics
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="h6" color="primary">
                          {Math.round((progress.earned_points / progress.total_points) * 100)}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Score Percentage
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="h6" color="primary">
                          {Math.round((progress.current_day / course.duration_days) * 100)}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Course Progress
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Motivational Message */}
            <Grid item xs={12}>
              <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom>
                    {progress.completion_percentage >= 100
                      ? '🎉 Congratulations! You completed the course!'
                      : progress.completion_percentage >= 75
                      ? '🔥 You\'re almost there! Keep going!'
                      : progress.completion_percentage >= 50
                      ? '💪 Great progress! You\'re halfway through!'
                      : progress.completion_percentage >= 25
                      ? '🌟 Nice start! You\'re making good progress!'
                      : '🚀 Welcome to your learning journey!'}
                  </Typography>
                  <Typography variant="body2">
                    {progress.completion_percentage >= 100
                      ? 'You\'ve mastered all the concepts. Well done!'
                      : `You have ${progress.total_questions - progress.answered_questions} questions left to complete.`}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Action Button */}
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={onBackToStudyPlan}
                  sx={{ px: 4, py: 1.5 }}
                >
                  {progress.completion_percentage >= 100
                    ? 'Review Study Plan'
                    : 'Continue Learning'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        ) : (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <TrendingUp sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No progress data available
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Start answering questions to see your progress here.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  )
}

export default ProgressDashboard
