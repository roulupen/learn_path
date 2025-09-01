import React from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from '@mui/material'
import {
  School,
  Assignment,
  TrendingUp,
  EmojiEvents,
  PlayArrow,
  Add,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'

// Mock data - in real app, this would come from API
const mockStats = {
  totalCourses: 5,
  completedCourses: 2,
  activeCourses: 3,
  totalStudyTime: 47, // hours
  currentStreak: 7, // days
}

const mockEnrollments = [
  {
    id: 1,
    course: { title: 'React Advanced Patterns', category: 'Web Development' },
    completion_percentage: 75,
    last_accessed: '2024-01-15',
  },
  {
    id: 2,
    course: { title: 'Machine Learning Basics', category: 'Data Science' },
    completion_percentage: 45,
    last_accessed: '2024-01-14',
  },
  {
    id: 3,
    course: { title: 'Python for Beginners', category: 'Programming' },
    completion_percentage: 100,
    last_accessed: '2024-01-10',
  },
]

const mockAchievements = [
  {
    title: 'First Course Completed',
    description: 'Completed your first course!',
    earned_at: '2024-01-10',
    badge_type: 'completion',
  },
  {
    title: '7-Day Streak',
    description: 'Studied for 7 consecutive days',
    earned_at: '2024-01-15',
    badge_type: 'streak',
  },
]

function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <Box>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {getGreeting()}, {user?.full_name?.split(' ')[0]}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Ready to continue your learning journey?
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <School sx={{ mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h4">{mockStats.totalCourses}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Courses
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EmojiEvents sx={{ mr: 2, color: 'success.main' }} />
                <Box>
                  <Typography variant="h4">{mockStats.completedCourses}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUp sx={{ mr: 2, color: 'info.main' }} />
                <Box>
                  <Typography variant="h4">{mockStats.totalStudyTime}h</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Study Time
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Assignment sx={{ mr: 2, color: 'warning.main' }} />
                <Box>
                  <Typography variant="h4">{mockStats.currentStreak}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Day Streak
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Continue Learning */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Continue Learning</Typography>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => navigate('/courses')}
                >
                  Browse Courses
                </Button>
              </Box>
              
              <List>
                {mockEnrollments.filter(e => e.completion_percentage < 100).map((enrollment) => (
                  <ListItem
                    key={enrollment.id}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <School />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={enrollment.course.title}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {enrollment.course.category}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={enrollment.completion_percentage}
                              sx={{ flexGrow: 1, mr: 2 }}
                            />
                            <Typography variant="body2">
                              {enrollment.completion_percentage}%
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<PlayArrow />}
                      onClick={() => navigate(`/courses/${enrollment.id}`)}
                    >
                      Continue
                    </Button>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Achievements & Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Achievements
              </Typography>
              <List dense>
                {mockAchievements.map((achievement, index) => (
                  <ListItem key={index}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}>
                        <EmojiEvents sx={{ fontSize: 16 }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={achievement.title}
                      secondary={achievement.description}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/study-plans')}
                >
                  Create Study Plan
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/progress')}
                >
                  View Progress
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/courses')}
                >
                  Explore Courses
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default DashboardPage
