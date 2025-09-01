import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  AppBar,
  Toolbar,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material'
import {
  Logout,
  School,
  PlayArrow,
  Lock,
  CheckCircle,
  Assessment,
  AutoFixHigh,
  Home,
} from '@mui/icons-material'

import { learningApiService, User, Course, Plan, DayStatus } from '../../services/learningApiService'

interface Props {
  user: User
  course: Course
  onStartDay: (day: number, isReview?: boolean) => void
  onViewProgress: () => void
  onBackToDashboard: () => void
  onLogout: () => void
}

function StudyPlanPage({ user, course, onStartDay, onViewProgress, onBackToDashboard, onLogout }: Props) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [dayStatuses, setDayStatuses] = useState<DayStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadStudyPlan()
  }, [])

  const loadStudyPlan = async () => {
    try {
      // Load both study plans and day progression status
      const [plansData, progressData] = await Promise.all([
        learningApiService.getPlan(user.username, course.course_name),
        learningApiService.getCourseProgress(user.username, course.course_name)
      ])
      
      setPlans(plansData.sort((a, b) => a.day_number - b.day_number))
      setDayStatuses(progressData)
      
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to load study plan')
    } finally {
      setLoading(false)
    }
  }

  const getDayStatus = (day: number): DayStatus | undefined => {
    return dayStatuses.find(status => status.day_number === day)
  }

  const isDayUnlocked = (day: number) => {
    const status = getDayStatus(day)
    return status?.is_unlocked || false
  }

  const isDayCompleted = (day: number) => {
    const status = getDayStatus(day)
    return status?.is_completed || false
  }

  const isDayCurrent = (day: number) => {
    const status = getDayStatus(day)
    return status?.is_current || false
  }

  const canRegenerateDay = (day: number) => {
    const status = getDayStatus(day)
    return status?.can_regenerate || false
  }

  const handleStartDay = (day: number) => {
    if (isDayUnlocked(day)) {
      const isReview = isDayCompleted(day)
      onStartDay(day, isReview)
    }
  }

  const handleRegenerateDay = (day: number) => {
    if (canRegenerateDay(day)) {
      // Navigate to question customization page for regeneration
      onStartDay(day, false)
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
            <School sx={{ mr: 2 }} />
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              LearnPath - {course.course_name}
            </Typography>
            <Button color="inherit" onClick={onBackToDashboard} startIcon={<Home />}>
              Dashboard
            </Button>
            <Button color="inherit" onClick={onViewProgress} startIcon={<Assessment />}>
              Progress
            </Button>
            <IconButton color="inherit" onClick={onLogout}>
              <Logout />
            </IconButton>
          </Toolbar>
        </AppBar>

      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Your {course.duration_days}-Day Study Plan
          </Typography>
          <Typography variant="h6" color="primary" gutterBottom>
            {course.course_name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back, {user.name}! Complete each day's lessons to unlock the next.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <List>
          {plans.map((plan) => (
            <Card key={plan.id} sx={{ mb: 2 }}>
              <CardContent>
                <ListItem>
                  <ListItemIcon>
                    {isDayCompleted(plan.day_number) ? (
                      <CheckCircle color="success" />
                    ) : isDayCurrent(plan.day_number) ? (
                      <PlayArrow color="primary" />
                    ) : isDayUnlocked(plan.day_number) ? (
                      <PlayArrow color="secondary" />
                    ) : (
                      <Lock color="disabled" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h6">
                          Day {plan.day_number}
                        </Typography>
                        <Chip
                          label={
                            isDayCompleted(plan.day_number) ? 'Completed' :
                            isDayCurrent(plan.day_number) ? 'Current' :
                            isDayUnlocked(plan.day_number) ? 'Available' : 'Locked'
                          }
                          color={
                            isDayCompleted(plan.day_number) ? 'success' :
                            isDayCurrent(plan.day_number) ? 'primary' :
                            isDayUnlocked(plan.day_number) ? 'secondary' : 'default'
                          }
                          size="small"
                        />
                        {isDayCompleted(plan.day_number) && (
                          <Chip
                            label={`${getDayStatus(plan.day_number)?.completion_percentage || 0}%`}
                            color="success"
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          {plan.content.substring(0, 200)}...
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {/* Main Action Button */}
                          <Button
                            variant={isDayUnlocked(plan.day_number) ? 'contained' : 'outlined'}
                            disabled={!isDayUnlocked(plan.day_number)}
                            onClick={() => handleStartDay(plan.day_number)}
                            startIcon={
                              isDayCompleted(plan.day_number) ? <Assessment /> :
                              isDayUnlocked(plan.day_number) ? <PlayArrow /> : <Lock />
                            }
                          >
                            {isDayCompleted(plan.day_number) ? 'Review Results' :
                             isDayUnlocked(plan.day_number) ? 'Start Day' : 'Complete Previous Days'}
                          </Button>
                          
                          {/* Regenerate Button - Show if questions exist but not completed */}
                          {getDayStatus(plan.day_number)?.can_regenerate && (
                            <Button
                              variant="outlined"
                              color="secondary"
                              onClick={() => handleRegenerateDay(plan.day_number)}
                              startIcon={<AutoFixHigh />}
                              size="small"
                            >
                              Regenerate Questions
                            </Button>
                          )}
                          
                          {/* Question Status Info */}
                          {isDayUnlocked(plan.day_number) && !isDayCompleted(plan.day_number) && (
                            <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                              {getDayStatus(plan.day_number)?.total_questions || 0} questions available
                              {getDayStatus(plan.day_number)?.has_progress && 
                                ` (${getDayStatus(plan.day_number)?.answered_questions || 0} answered)`
                              }
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              </CardContent>
            </Card>
          ))}
        </List>

        {plans.length === 0 && !loading && (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <School sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No study plan found
              </Typography>
              <Typography variant="body1" color="text.secondary">
                There seems to be an issue loading your study plan.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  )
}

export default StudyPlanPage

