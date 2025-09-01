import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
} from '@mui/material'
import { Logout, School } from '@mui/icons-material'

import { learningApiService, User, Course } from '../../services/learningApiService'

interface Props {
  user: User
  onCourseSelected: (course: Course) => void
  onLogout: () => void
}

const availableCourses = [
  'JavaScript Fundamentals',
  'React Development',
  'Python Programming',
  'Pytorch Programming',
  'Data Science',
  'Machine Learning',
  'Web Development',
  'Database Design'
]

function CourseSelectionPage({ user, onCourseSelected, onLogout }: Props) {
  const [selectedCourse, setSelectedCourse] = useState('')
  const [duration, setDuration] = useState<number>(15)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGeneratePlan = async () => {
    if (!selectedCourse) {
      setError('Please select a course')
      return
    }

    setLoading(true)
    setError('')

    try {
      const course = await learningApiService.generatePlan(
        user.username,
        selectedCourse,
        duration
      )
      onCourseSelected(course)
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to generate study plan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <School sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            LearnPath
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            Welcome, {user.name}!
          </Typography>
          <IconButton color="inherit" onClick={onLogout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Card sx={{ maxWidth: 500, width: '100%' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom align="center">
              Select Your Course
            </Typography>
            <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
              Choose a course and duration to generate your personalized study plan
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Course</InputLabel>
              <Select
                value={selectedCourse}
                label="Course"
                onChange={(e) => setSelectedCourse(e.target.value)}
                disabled={loading}
              >
                {availableCourses.map((course) => (
                  <MenuItem key={course} value={course}>
                    {course}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 4 }}>
              <InputLabel>Duration</InputLabel>
              <Select
                value={duration}
                label="Duration"
                onChange={(e) => setDuration(e.target.value as number)}
                disabled={loading}
              >
                <MenuItem value={15}>15 Days</MenuItem>
                <MenuItem value={20}>20 Days</MenuItem>
                <MenuItem value={30}>30 Days</MenuItem>
              </Select>
            </FormControl>

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleGeneratePlan}
              disabled={loading || !selectedCourse}
              startIcon={loading ? <CircularProgress size={20} /> : null}
              sx={{ py: 1.5 }}
            >
              {loading ? 'Generating Study Plan...' : 'Generate AI Study Plan'}
            </Button>

            <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
              <Typography variant="body2" align="center">
                🤖 Our AI will create a personalized {duration}-day study plan with:
              </Typography>
              <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                • Daily learning objectives<br/>
                • Progressive difficulty questions<br/>
                • Points-based progress tracking
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}

export default CourseSelectionPage
