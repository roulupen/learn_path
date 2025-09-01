import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Chip,
  Card,
  CardContent,
  Grid,
  Avatar,
  Rating,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import {
  School,
  Person,
  AccessTime,
  Star,
  PlayArrow,
  CheckCircle,
  Assignment,
} from '@mui/icons-material'

// Mock course detail data
const mockCourseDetail = {
  id: 1,
  title: 'React Advanced Patterns',
  description: 'Master advanced React development techniques including custom hooks, context patterns, performance optimization, and modern state management. This comprehensive course will take you from intermediate to advanced React developer.',
  short_description: 'Master advanced React development techniques',
  category: 'Web Development',
  difficulty_level: 'advanced',
  estimated_duration: 40,
  instructor: { 
    full_name: 'John Doe',
    bio: 'Senior React Developer with 8+ years experience at top tech companies'
  },
  price: 99.99,
  is_free: false,
  rating: 4.8,
  students: 1250,
  modules: [
    'Advanced Hooks Patterns',
    'Context and State Management',
    'Performance Optimization',
    'Testing Strategies',
    'Build Tools and Deployment',
  ],
  learning_objectives: [
    'Master advanced React hooks and custom hook patterns',
    'Implement efficient state management solutions',
    'Optimize React applications for performance',
    'Write comprehensive tests for React components',
    'Deploy React applications to production',
  ],
  prerequisites: [
    'Solid understanding of JavaScript ES6+',
    'Basic React knowledge (components, props, state)',
    'Familiarity with modern development tools',
  ],
}

function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false)
  const [isEnrolled, setIsEnrolled] = useState(false)

  const course = mockCourseDetail // In real app, fetch by courseId

  const handleEnroll = () => {
    setEnrollDialogOpen(true)
  }

  const confirmEnroll = () => {
    // In real app, call API to enroll
    setIsEnrolled(true)
    setEnrollDialogOpen(false)
    // Navigate to course content or study plan creation
    navigate('/study-plans')
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'success'
      case 'intermediate': return 'warning'
      case 'advanced': return 'error'
      default: return 'default'
    }
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          onClick={() => navigate('/courses')}
          sx={{ mb: 2 }}
        >
          ← Back to Courses
        </Button>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Typography variant="h3" gutterBottom>
              {course.title}
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {course.short_description}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Chip
                label={course.category}
                variant="outlined"
              />
              <Chip
                label={course.difficulty_level}
                color={getDifficultyColor(course.difficulty_level) as any}
              />
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccessTime sx={{ fontSize: 20, mr: 0.5 }} />
                <Typography variant="body2">
                  {course.estimated_duration} hours
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Rating value={course.rating} precision={0.1} readOnly />
              <Typography variant="body2" sx={{ ml: 1, mr: 2 }}>
                {course.rating} ({course.students} students)
              </Typography>
              <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                {course.instructor.full_name.charAt(0)}
              </Avatar>
              <Typography variant="body2">
                {course.instructor.full_name}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h4" color="primary" gutterBottom>
                  {course.is_free ? 'Free' : `$${course.price}`}
                </Typography>
                
                {isEnrolled ? (
                  <Box>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      startIcon={<PlayArrow />}
                      sx={{ mb: 2 }}
                      onClick={() => navigate('/study-plans')}
                    >
                      Continue Learning
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Assignment />}
                      onClick={() => navigate('/study-plans')}
                    >
                      Create Study Plan
                    </Button>
                  </Box>
                ) : (
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleEnroll}
                  >
                    Enroll Now
                  </Button>
                )}
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    This course includes:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Lifetime access" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="AI-generated study plans" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Progress tracking" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Certificate of completion" />
                    </ListItem>
                  </List>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Course Content */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          {/* Description */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                About This Course
              </Typography>
              <Typography variant="body1" paragraph>
                {course.description}
              </Typography>
            </CardContent>
          </Card>

          {/* Learning Objectives */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                What You'll Learn
              </Typography>
              <List>
                {course.learning_objectives.map((objective, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary={objective} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Course Modules */}
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Course Curriculum
              </Typography>
              <List>
                {course.modules.map((module, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <School />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`Module ${index + 1}: ${module}`}
                      secondary={`Estimated: ${Math.ceil(course.estimated_duration / course.modules.length)} hours`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          {/* Prerequisites */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Prerequisites
              </Typography>
              <List dense>
                {course.prerequisites.map((prereq, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckCircle fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={prereq} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Instructor */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Instructor
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ width: 60, height: 60, mr: 2 }}>
                  {course.instructor.full_name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {course.instructor.full_name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Star sx={{ fontSize: 16, mr: 0.5, color: 'warning.main' }} />
                    <Typography variant="body2">
                      4.9 instructor rating
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {course.instructor.bio}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Enrollment Confirmation Dialog */}
      <Dialog open={enrollDialogOpen} onClose={() => setEnrollDialogOpen(false)}>
        <DialogTitle>Confirm Enrollment</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to enroll in "{course.title}"?
            {!course.is_free && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                <Typography variant="body2">
                  This course costs ${course.price}. You will be charged upon confirmation.
                </Typography>
              </Box>
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEnrollDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={confirmEnroll} variant="contained">
            {course.is_free ? 'Enroll for Free' : `Pay $${course.price} & Enroll`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default CourseDetailPage
