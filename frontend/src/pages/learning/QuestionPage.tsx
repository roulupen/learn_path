import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  AppBar,
  Toolbar,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
  LinearProgress,
} from '@mui/material'
import {
  ArrowBack,
  Logout,
  School,
  CheckCircle,
  Cancel,
  Home,
} from '@mui/icons-material'

import { learningApiService, User, Course, Question, SubmitAnswerResponse } from '../../services/learningApiService'
import ProgrammingQuestion from '../../components/ProgrammingQuestion'

interface Props {
  user: User
  course: Course
  currentDay: number
  onDayComplete: () => void
  onBackToStudyPlan: () => void
  onBackToDashboard: () => void
}

function QuestionPage({ user, course, currentDay, onDayComplete, onBackToStudyPlan, onBackToDashboard }: Props) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState<SubmitAnswerResponse | null>(null)
  const [dayScore, setDayScore] = useState(0)
  const [answeredQuestions, setAnsweredQuestions] = useState<number[]>([])

  useEffect(() => {
    loadQuestions()
  }, [])

  const loadQuestions = async () => {
    try {
      const questionsData = await learningApiService.getQuestions(
        user.username,
        course.course_name,
        currentDay
      )
      setQuestions(questionsData)
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to load questions')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer) {
      setError('Please select an answer')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const result = await learningApiService.submitAnswer(
        user.username,
        questions[currentQuestionIndex].id,
        selectedAnswer
      )
      
      setFeedback(result)
      setDayScore(prev => prev + result.earned_points)
      setAnsweredQuestions(prev => [...prev, currentQuestionIndex])
      
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to submit answer')
    } finally {
      setSubmitting(false)
    }
  }

  const handleNextQuestion = () => {
    setFeedback(null)
    setSelectedAnswer('')
    setError('')
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      // Day completed
      onDayComplete()
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'success'
      case 'intermediate': return 'warning'
      case 'advanced': return 'error'
      default: return 'default'
    }
  }

  const parseOptions = (optionsString?: string): string[] => {
    if (!optionsString) return []
    try {
      return JSON.parse(optionsString)
    } catch {
      return []
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    )
  }

  if (questions.length === 0) {
    return (
      <Box>
        <AppBar position="static">
          <Toolbar>
            <IconButton color="inherit" onClick={onBackToStudyPlan}>
              <ArrowBack />
            </IconButton>
            <School sx={{ mr: 2 }} />
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Day {currentDay} Questions
            </Typography>
            <Button color="inherit" onClick={onBackToDashboard} startIcon={<Home />}>
              Dashboard
            </Button>
          </Toolbar>
        </AppBar>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Alert severity="info">
            No questions available for Day {currentDay}
          </Alert>
        </Box>
      </Box>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const options = parseOptions(currentQuestion.options)
  const progress = ((currentQuestionIndex + (feedback ? 1 : 0)) / questions.length) * 100

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <IconButton color="inherit" onClick={onBackToStudyPlan}>
            <ArrowBack />
          </IconButton>
          <School sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Day {currentDay} - Question {currentQuestionIndex + 1} of {questions.length}
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            Score: {dayScore} pts
          </Typography>
          <Button color="inherit" onClick={onBackToDashboard} startIcon={<Home />}>
            Dashboard
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        {/* Progress Bar */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Progress: {Math.round(progress)}%
          </Typography>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Card>
          <CardContent sx={{ p: 4 }}>
            <ProgrammingQuestion
              question={currentQuestion.question}
              questionType={currentQuestion.question_type}
              difficulty={currentQuestion.difficulty}
              points={currentQuestion.points}
              codeSnippet={currentQuestion.code_snippet}
              showCodeFirst={currentQuestion.question_type === 'code_analysis' || currentQuestion.question_type === 'debugging'}
            />

            {feedback ? (
              // Show feedback
              <Box sx={{ mt: 3 }}>
                <Alert
                  severity={feedback.is_correct ? 'success' : 'error'}
                  icon={feedback.is_correct ? <CheckCircle /> : <Cancel />}
                  sx={{ mb: 2 }}
                >
                  <Typography variant="h6">
                    {feedback.is_correct ? 'Correct!' : 'Incorrect'}
                  </Typography>
                  <Typography variant="body2">
                    {feedback.feedback}
                  </Typography>
                  {feedback.earned_points > 0 && (
                    <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                      +{feedback.earned_points} points earned!
                    </Typography>
                  )}
                </Alert>

                <Button
                  variant="contained"
                  onClick={handleNextQuestion}
                  size="large"
                >
                  {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Complete Day'}
                </Button>
              </Box>
            ) : (
              // Show question options
              <Box sx={{ mt: 3 }}>
                {options.length > 0 ? (
                  <RadioGroup
                    value={selectedAnswer}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                  >
                    {options.map((option, index) => (
                      <FormControlLabel
                        key={index}
                        value={option.charAt(0)} // Extract A, B, C, D
                        control={<Radio />}
                        label={option}
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </RadioGroup>
                ) : (
                  <Typography color="text.secondary">
                    No options provided for this question
                  </Typography>
                )}

                <Button
                  variant="contained"
                  onClick={handleSubmitAnswer}
                  disabled={!selectedAnswer || submitting}
                  size="large"
                  sx={{ mt: 3 }}
                  startIcon={submitting ? <CircularProgress size={20} /> : null}
                >
                  {submitting ? 'Submitting...' : 'Submit Answer'}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}

export default QuestionPage
