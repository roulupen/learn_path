import React from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
} from '@mui/material'
import {
  TrendingUp,
  EmojiEvents,
  School,
  Timer,
  CalendarToday,
  Star,
} from '@mui/icons-material'

// Mock progress data
const mockProgressData = {
  overall: {
    totalCourses: 5,
    completedCourses: 2,
    activeCourses: 3,
    totalStudyTime: 127, // hours
    currentStreak: 12, // days
    completionRate: 68, // percentage
  },
  courseProgress: [
    {
      id: 1,
      title: 'React Advanced Patterns',
      category: 'Web Development',
      completion_percentage: 75,
      modules_completed: 6,
      total_modules: 8,
      last_accessed: '2024-01-15',
      study_time: 32,
    },
    {
      id: 2,
      title: 'Machine Learning Basics',
      category: 'Data Science',
      completion_percentage: 45,
      modules_completed: 4,
      total_modules: 9,
      last_accessed: '2024-01-14',
      study_time: 28,
    },
    {
      id: 3,
      title: 'Python for Beginners',
      category: 'Programming',
      completion_percentage: 100,
      modules_completed: 5,
      total_modules: 5,
      last_accessed: '2024-01-10',
      study_time: 25,
    },
  ],
  achievements: [
    {
      title: 'First Course Completed',
      description: 'Completed your first course successfully',
      badge_type: 'completion',
      earned_at: '2024-01-10',
    },
    {
      title: '7-Day Learning Streak',
      description: 'Studied for 7 consecutive days',
      badge_type: 'streak',
      earned_at: '2024-01-08',
    },
    {
      title: 'Quick Learner',
      description: 'Completed a module in under 2 hours',
      badge_type: 'speed',
      earned_at: '2024-01-05',
    },
    {
      title: '25 Hours Studied',
      description: 'Accumulated 25+ hours of study time',
      badge_type: 'time',
      earned_at: '2024-01-12',
    },
  ],
  weeklyStats: [
    { week: 'Week 1', hours: 8 },
    { week: 'Week 2', hours: 12 },
    { week: 'Week 3', hours: 15 },
    { week: 'Week 4', hours: 18 },
  ],
}

function ProgressPage() {
  const { overall, courseProgress, achievements } = mockProgressData

  const getBadgeIcon = (badgeType: string) => {
    switch (badgeType) {
      case 'completion': return <EmojiEvents />
      case 'streak': return <CalendarToday />
      case 'speed': return <Timer />
      case 'time': return <TrendingUp />
      default: return <Star />
    }
  }

  const getBadgeColor = (badgeType: string) => {
    switch (badgeType) {
      case 'completion': return '#FFD700'
      case 'streak': return '#FF6B35'
      case 'speed': return '#4ECDC4'
      case 'time': return '#45B7D1'
      default: return '#95A5A6'
    }
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Learning Progress
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Track your learning journey and celebrate your achievements
      </Typography>

      {/* Overview Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <School sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4">{overall.totalCourses}</Typography>
              <Typography variant="body2" color="text.secondary">
                Total Courses
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <EmojiEvents sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4">{overall.completedCourses}</Typography>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4">{overall.totalStudyTime}h</Typography>
              <Typography variant="body2" color="text.secondary">
                Study Time
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CalendarToday sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4">{overall.currentStreak}</Typography>
              <Typography variant="body2" color="text.secondary">
                Day Streak
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {overall.completionRate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg. Completion
              </Typography>
              <LinearProgress
                variant="determinate"
                value={overall.completionRate}
                sx={{ mt: 1, height: 6, borderRadius: 3 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Course Progress */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Course Progress
              </Typography>
              <List>
                {courseProgress.map((course) => (
                  <React.Fragment key={course.id}>
                    <ListItem sx={{ py: 2 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <School />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6">
                              {course.title}
                            </Typography>
                            <Chip
                              label={course.completion_percentage === 100 ? 'Completed' : 'In Progress'}
                              color={course.completion_percentage === 100 ? 'success' : 'primary'}
                              size="small"
                            />
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {course.category} • {course.study_time} hours studied
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Box sx={{ flexGrow: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                  <Typography variant="body2">
                                    {course.modules_completed}/{course.total_modules} modules
                                  </Typography>
                                  <Typography variant="body2">
                                    {course.completion_percentage}%
                                  </Typography>
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={course.completion_percentage}
                                  sx={{ height: 6, borderRadius: 3 }}
                                />
                              </Box>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              Last accessed: {new Date(course.last_accessed).toLocaleDateString()}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {course.id !== courseProgress[courseProgress.length - 1].id && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Achievements */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Achievements
              </Typography>
              <List>
                {achievements.map((achievement, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar 
                        sx={{ 
                          bgcolor: getBadgeColor(achievement.badge_type),
                          width: 48,
                          height: 48,
                        }}
                      >
                        {getBadgeIcon(achievement.badge_type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={achievement.title}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {achievement.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Earned: {new Date(achievement.earned_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Study Streak */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Streak
              </Typography>
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h2" color="warning.main" gutterBottom>
                  🔥
                </Typography>
                <Typography variant="h4" gutterBottom>
                  {overall.currentStreak} Days
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Keep it up! Study today to maintain your streak.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default ProgressPage
