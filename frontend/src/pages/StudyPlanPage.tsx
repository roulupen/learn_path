import React, { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material'
import {
  Add,
  PlayArrow,
  Pause,
  CheckCircle,
  Assignment,
  TrendingUp,
} from '@mui/icons-material'

// Mock study plans data
const mockStudyPlans = [
  {
    id: 1,
    title: 'React Advanced Patterns - Intensive Study Plan',
    course: { title: 'React Advanced Patterns', category: 'Web Development' },
    status: 'active',
    completion_percentage: 65,
    current_module: 3,
    total_modules: 5,
    estimated_duration: 8, // weeks
    created_at: '2024-01-01',
    modules: [
      { title: 'Advanced Hooks Patterns', completed: true },
      { title: 'Context and State Management', completed: true },
      { title: 'Performance Optimization', completed: false, current: true },
      { title: 'Testing Strategies', completed: false },
      { title: 'Build Tools and Deployment', completed: false },
    ],
  },
  {
    id: 2,
    title: 'Machine Learning Basics - Beginner Path',
    course: { title: 'Machine Learning Fundamentals', category: 'Data Science' },
    status: 'completed',
    completion_percentage: 100,
    current_module: 4,
    total_modules: 4,
    estimated_duration: 12,
    created_at: '2023-12-01',
    completed_at: '2024-01-10',
  },
]

function StudyPlanPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newPlanData, setNewPlanData] = useState({
    course_id: '',
    learning_goals: [''],
    time_commitment: 5,
    duration_weeks: 12,
    difficulty_preference: 'medium',
  })

  const handleCreatePlan = () => {
    // In real app, call API to create study plan
    console.log('Creating study plan:', newPlanData)
    setCreateDialogOpen(false)
    // Reset form
    setNewPlanData({
      course_id: '',
      learning_goals: [''],
      time_commitment: 5,
      duration_weeks: 12,
      difficulty_preference: 'medium',
    })
  }

  const addLearningGoal = () => {
    setNewPlanData({
      ...newPlanData,
      learning_goals: [...newPlanData.learning_goals, ''],
    })
  }

  const updateLearningGoal = (index: number, value: string) => {
    const updatedGoals = [...newPlanData.learning_goals]
    updatedGoals[index] = value
    setNewPlanData({
      ...newPlanData,
      learning_goals: updatedGoals,
    })
  }

  const removeLearningGoal = (index: number) => {
    const updatedGoals = newPlanData.learning_goals.filter((_, i) => i !== index)
    setNewPlanData({
      ...newPlanData,
      learning_goals: updatedGoals,
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'primary'
      case 'completed': return 'success'
      case 'paused': return 'warning'
      default: return 'default'
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            My Study Plans
          </Typography>
          <Typography variant="body1" color="text.secondary">
            AI-powered personalized learning paths
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Study Plan
        </Button>
      </Box>

      {mockStudyPlans.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <Assignment sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Study Plans Yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Create your first AI-powered study plan to get started
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Your First Study Plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {mockStudyPlans.map((plan) => (
            <Grid item xs={12} key={plan.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h5" gutterBottom>
                        {plan.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {plan.course.title} • {plan.course.category}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Chip
                          label={plan.status}
                          color={getStatusColor(plan.status) as any}
                          size="small"
                        />
                        <Typography variant="body2" color="text.secondary">
                          Created: {new Date(plan.created_at).toLocaleDateString()}
                        </Typography>
                        {plan.completed_at && (
                          <Typography variant="body2" color="text.secondary">
                            • Completed: {new Date(plan.completed_at).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {plan.status === 'active' && (
                        <>
                          <Button
                            variant="contained"
                            startIcon={<PlayArrow />}
                            size="small"
                          >
                            Continue
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<Pause />}
                            size="small"
                          >
                            Pause
                          </Button>
                        </>
                      )}
                      {plan.status === 'completed' && (
                        <Button
                          variant="outlined"
                          startIcon={<CheckCircle />}
                          size="small"
                          disabled
                        >
                          Completed
                        </Button>
                      )}
                    </Box>
                  </Box>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">
                            Progress
                          </Typography>
                          <Typography variant="body2">
                            {plan.completion_percentage}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={plan.completion_percentage}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 4 }}>
                        <Box>
                          <Typography variant="h6">{plan.current_module}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Current Module
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="h6">{plan.total_modules}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Modules
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="h6">{plan.estimated_duration}w</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Duration
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    {plan.modules && (
                      <Grid item xs={12} md={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Module Progress
                        </Typography>
                        <List dense>
                          {plan.modules.slice(0, 3).map((module, index) => (
                            <ListItem key={index} sx={{ py: 0.5 }}>
                              {module.completed ? (
                                <CheckCircle sx={{ color: 'success.main', fontSize: 16, mr: 1 }} />
                              ) : module.current ? (
                                <TrendingUp sx={{ color: 'primary.main', fontSize: 16, mr: 1 }} />
                              ) : (
                                <Box sx={{ width: 16, height: 16, mr: 1, borderRadius: '50%', border: '1px solid', borderColor: 'text.disabled' }} />
                              )}
                              <ListItemText
                                primary={module.title}
                                primaryTypographyProps={{
                                  variant: 'body2',
                                  color: module.current ? 'primary' : 'text.primary',
                                  fontWeight: module.current ? 'medium' : 'normal',
                                }}
                              />
                            </ListItem>
                          ))}
                          {plan.modules.length > 3 && (
                            <ListItem sx={{ py: 0.5 }}>
                              <Typography variant="body2" color="text.secondary">
                                +{plan.modules.length - 3} more modules
                              </Typography>
                            </ListItem>
                          )}
                        </List>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Study Plan Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create AI-Powered Study Plan</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Select Course</InputLabel>
              <Select
                value={newPlanData.course_id}
                label="Select Course"
                onChange={(e) => setNewPlanData({ ...newPlanData, course_id: e.target.value })}
              >
                <MenuItem value="1">React Advanced Patterns</MenuItem>
                <MenuItem value="2">Machine Learning Fundamentals</MenuItem>
                <MenuItem value="3">Python Web Development</MenuItem>
              </Select>
            </FormControl>

            <Typography variant="h6" gutterBottom>
              Learning Goals
            </Typography>
            {newPlanData.learning_goals.map((goal, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  placeholder="What do you want to achieve?"
                  value={goal}
                  onChange={(e) => updateLearningGoal(index, e.target.value)}
                />
                {newPlanData.learning_goals.length > 1 && (
                  <Button
                    color="error"
                    onClick={() => removeLearningGoal(index)}
                  >
                    Remove
                  </Button>
                )}
              </Box>
            ))}
            <Button
              variant="outlined"
              onClick={addLearningGoal}
              sx={{ mb: 3 }}
            >
              Add Learning Goal
            </Button>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Time Commitment (hours/week)"
                  type="number"
                  value={newPlanData.time_commitment}
                  onChange={(e) => setNewPlanData({ ...newPlanData, time_commitment: parseInt(e.target.value) || 5 })}
                  inputProps={{ min: 1, max: 40 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Duration (weeks)"
                  type="number"
                  value={newPlanData.duration_weeks}
                  onChange={(e) => setNewPlanData({ ...newPlanData, duration_weeks: parseInt(e.target.value) || 12 })}
                  inputProps={{ min: 1, max: 52 }}
                />
              </Grid>
            </Grid>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Difficulty Preference</InputLabel>
              <Select
                value={newPlanData.difficulty_preference}
                label="Difficulty Preference"
                onChange={(e) => setNewPlanData({ ...newPlanData, difficulty_preference: e.target.value })}
              >
                <MenuItem value="easy">Easy - Take it slow</MenuItem>
                <MenuItem value="medium">Medium - Balanced pace</MenuItem>
                <MenuItem value="hard">Hard - Challenge me</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreatePlan} 
            variant="contained"
            disabled={!newPlanData.course_id || newPlanData.learning_goals.every(goal => !goal.trim())}
          >
            Generate Study Plan
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default StudyPlanPage
