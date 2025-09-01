import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  AppBar,
  Toolbar,
  IconButton,
  Alert,
  CircularProgress,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
} from '@mui/material'
import {
  ArrowBack,
  AutoFixHigh,
  School,
  Settings,
  PlayArrow,
  Home,
} from '@mui/icons-material'

import { learningApiService, User, Course, Question } from '../../services/learningApiService'

interface Props {
  user: User
  course: Course
  dayNumber: number
  onQuestionsGenerated: (questions: Question[]) => void
  onBack: () => void
  onBackToDashboard: () => void
}

const focusAreaOptions = [
  'Basic Syntax',
  'Data Structures',
  'Control Flow',
  'Functions & Methods',
  'Error Handling',
  'Object-Oriented Programming',
  'File I/O Operations',
  'Testing & Debugging',
  'Performance Optimization',
  'Code Organization'
]

const questionTypeOptions = [
  { value: 'code_analysis', label: 'Code Analysis (25 pts)' },
  { value: 'debugging', label: 'Debugging (25 pts)' },
  { value: 'algorithm', label: 'Algorithm Logic (20 pts)' },
  { value: 'best_practice', label: 'Best Practices (20 pts)' },
  { value: 'conceptual', label: 'Conceptual Understanding (15 pts)' }
]

function QuestionCustomizationPage({ user, course, dayNumber, onQuestionsGenerated, onBack, onBackToDashboard }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [existingQuestions, setExistingQuestions] = useState<Question[]>([])
  const [checkingExisting, setCheckingExisting] = useState(true)
  
  const [preferences, setPreferences] = useState({
    difficulty_preference: 'balanced' as 'easier' | 'balanced' | 'harder',
    focus_areas: [] as string[],
    question_types: [] as string[],
    special_instructions: '',
  })

  useEffect(() => {
    checkExistingQuestions()
  }, [])

  const checkExistingQuestions = async () => {
    try {
      const questions = await learningApiService.getQuestions(
        user.username,
        course.course_name,
        dayNumber
      )
      setExistingQuestions(questions)
    } catch (error: any) {
      // If no questions exist, that's fine - we'll generate new ones
      console.log('No existing questions found')
    } finally {
      setCheckingExisting(false)
    }
  }

  const handleFocusAreaToggle = (area: string) => {
    setPreferences(prev => ({
      ...prev,
      focus_areas: prev.focus_areas.includes(area)
        ? prev.focus_areas.filter(a => a !== area)
        : [...prev.focus_areas, area]
    }))
  }

  const handleQuestionTypeToggle = (type: string) => {
    setPreferences(prev => ({
      ...prev,
      question_types: prev.question_types.includes(type)
        ? prev.question_types.filter(t => t !== type)
        : [...prev.question_types, type]
    }))
  }

  const handleGenerateQuestions = async () => {
    setLoading(true)
    setError('')

    try {
      const questions = await learningApiService.regenerateQuestions({
        username: user.username,
        course_name: course.course_name,
        day_number: dayNumber,
        focus_areas: preferences.focus_areas,
        difficulty_preference: preferences.difficulty_preference,
        question_types: preferences.question_types,
        special_instructions: preferences.special_instructions,
      })

      onQuestionsGenerated(questions)
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to generate questions')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
              <AppBar position="static">
          <Toolbar>
            <IconButton color="inherit" onClick={onBack}>
              <ArrowBack />
            </IconButton>
            <Settings sx={{ mr: 2 }} />
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Customize Day {dayNumber} Questions
            </Typography>
            <Button color="inherit" onClick={onBackToDashboard} startIcon={<Home />}>
              Dashboard
            </Button>
          </Toolbar>
        </AppBar>

      <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <AutoFixHigh sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              <Typography variant="h4" gutterBottom>
                Customize Your Questions
              </Typography>
              <Typography variant="h6" color="primary" gutterBottom>
                {course.course_name} - Day {dayNumber}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Tell our AI how you'd like your questions to be tailored for optimal learning
              </Typography>
            </Box>

            {/* Existing Questions Section */}
            {checkingExisting ? (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <CircularProgress size={24} />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Checking for existing questions...
                </Typography>
              </Box>
            ) : existingQuestions.length > 0 ? (
              <Box sx={{ mb: 4, p: 3, bgcolor: 'info.light', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom color="info.dark">
                  📚 Existing Questions Found
                </Typography>
                <Typography variant="body2" color="info.dark" sx={{ mb: 2 }}>
                  You already have {existingQuestions.length} questions for Day {dayNumber}. 
                  You can either continue with these questions or regenerate new ones.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => onQuestionsGenerated(existingQuestions)}
                    startIcon={<PlayArrow />}
                  >
                    Continue with Existing Questions
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => setExistingQuestions([])}
                    startIcon={<AutoFixHigh />}
                  >
                    Regenerate New Questions
                  </Button>
                </Box>
              </Box>
            ) : null}

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Only show customization form if no existing questions or user chose to regenerate */}
            {existingQuestions.length === 0 && (
              <>
                {/* Difficulty Preference */}
                <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Difficulty Level
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Difficulty Preference</InputLabel>
                <Select
                  value={preferences.difficulty_preference}
                  label="Difficulty Preference"
                  onChange={(e) => setPreferences(prev => ({ 
                    ...prev, 
                    difficulty_preference: e.target.value as any 
                  }))}
                >
                  <MenuItem value="easier">Easier - More explanations and simpler concepts</MenuItem>
                  <MenuItem value="balanced">Balanced - Mix of easy and challenging questions</MenuItem>
                  <MenuItem value="harder">Harder - Complex scenarios and advanced concepts</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Focus Areas */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Focus Areas
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select topics you want to emphasize (optional)
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {focusAreaOptions.map((area) => (
                  <Chip
                    key={area}
                    label={area}
                    onClick={() => handleFocusAreaToggle(area)}
                    color={preferences.focus_areas.includes(area) ? 'primary' : 'default'}
                    variant={preferences.focus_areas.includes(area) ? 'filled' : 'outlined'}
                    clickable
                  />
                ))}
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Question Types */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Question Types
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Choose the types of questions you prefer (optional)
              </Typography>
              <FormGroup>
                {questionTypeOptions.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    control={
                      <Checkbox
                        checked={preferences.question_types.includes(option.value)}
                        onChange={() => handleQuestionTypeToggle(option.value)}
                      />
                    }
                    label={option.label}
                  />
                ))}
              </FormGroup>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Special Instructions */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Special Instructions
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Any specific requests or learning goals?"
                placeholder="e.g., Focus on practical examples, include more code snippets, relate to my job in marketing..."
                value={preferences.special_instructions}
                onChange={(e) => setPreferences(prev => ({ 
                  ...prev, 
                  special_instructions: e.target.value 
                }))}
              />
            </Box>

            {/* Generate Button */}
            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleGenerateQuestions}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <AutoFixHigh />}
                sx={{ px: 4, py: 1.5 }}
              >
                {loading ? 'Generating Custom Questions...' : 'Generate My Questions'}
              </Button>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                🤖 Our AI will create personalized questions based on your preferences
              </Typography>
            </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}

export default QuestionCustomizationPage
