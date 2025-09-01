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
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material'
import {
  ArrowBack,
  CheckCircle,
  Cancel,
  School,
  Assessment,
  Home,
} from '@mui/icons-material'

import { learningApiService, User, Course, QuestionReview } from '../../services/learningApiService'
import ProgrammingQuestion from '../../components/ProgrammingQuestion'

interface Props {
  user: User
  course: Course
  dayNumber: number
  onBack: () => void
  onBackToDashboard: () => void
}

function ReviewPage({ user, course, dayNumber, onBack, onBackToDashboard }: Props) {
  const [questions, setQuestions] = useState<QuestionReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadReview()
  }, [])

  const loadReview = async () => {
    try {
      const reviewData = await learningApiService.getQuestionsReview(
        user.username,
        course.course_name,
        dayNumber
      )
      setQuestions(reviewData)
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to load review')
    } finally {
      setLoading(false)
    }
  }

  const parseOptions = (optionsStr?: string): string[] => {
    if (!optionsStr) return []
    try {
      return JSON.parse(optionsStr)
    } catch {
      return []
    }
  }

  const getTotalScore = () => {
    return questions.reduce((sum, q) => sum + q.earned_points, 0)
  }

  const getTotalPossible = () => {
    return questions.reduce((sum, q) => sum + q.points, 0)
  }

  const getCorrectCount = () => {
    return questions.filter(q => q.is_correct).length
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
          <IconButton edge="start" color="inherit" onClick={onBack}>
            <ArrowBack />
          </IconButton>
          <School sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Day {dayNumber} Review - {course.course_name}
          </Typography>
          <Button color="inherit" onClick={onBackToDashboard} startIcon={<Home />}>
            Dashboard
          </Button>
          <Assessment />
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Day {dayNumber} Results
          </Typography>
          <Typography variant="h6" color="primary" gutterBottom>
            {course.course_name}
          </Typography>
          
          {/* Score Summary */}
          <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="h5">
                    {getTotalScore()} / {getTotalPossible()} Points
                  </Typography>
                  <Typography variant="body1">
                    {getCorrectCount()} / {questions.length} Questions Correct
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={`${Math.round((getTotalScore() / getTotalPossible()) * 100)}% Score`}
                    color="secondary"
                    size="large"
                  />
                  <Chip
                    label={`${Math.round((getCorrectCount() / questions.length) * 100)}% Accuracy`}
                    color="secondary"
                    size="large"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Questions Review */}
        <Typography variant="h5" gutterBottom>
          Question Review
        </Typography>
        
        <List>
          {questions.map((question, index) => {
            const options = parseOptions(question.options)
            
            return (
              <Card key={question.id} sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Typography variant="h6">
                      Question {index + 1}
                    </Typography>
                    <Chip
                      icon={question.is_correct ? <CheckCircle /> : <Cancel />}
                      label={question.is_correct ? 'Correct' : 'Incorrect'}
                      color={question.is_correct ? 'success' : 'error'}
                      size="small"
                    />
                    <Chip
                      label={`${question.earned_points}/${question.points} points`}
                      color={question.is_correct ? 'success' : 'default'}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={question.difficulty}
                      color="primary"
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  <ProgrammingQuestion
                    question={question.question}
                    questionType={question.question_type}
                    difficulty={question.difficulty}
                    points={question.points}
                    codeSnippet={question.code_snippet}
                    showCodeFirst={question.question_type === 'code_analysis' || question.question_type === 'debugging'}
                  />

                  {options.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Answer Options:
                      </Typography>
                      {options.map((option, optIndex) => {
                        const optionLetter = option.charAt(0)
                        const isUserAnswer = question.user_answer === optionLetter
                        const isCorrectAnswer = question.correct_answer === optionLetter
                        
                        return (
                          <Box
                            key={optIndex}
                            sx={{
                              p: 1,
                              mb: 1,
                              borderRadius: 1,
                              bgcolor: 
                                isCorrectAnswer ? 'success.light' :
                                isUserAnswer && !isCorrectAnswer ? 'error.light' :
                                'grey.100',
                              border: 
                                isUserAnswer ? '2px solid' : '1px solid',
                              borderColor:
                                isCorrectAnswer ? 'success.main' :
                                isUserAnswer && !isCorrectAnswer ? 'error.main' :
                                'grey.300'
                            }}
                          >
                            <Typography 
                              variant="body2"
                              sx={{ 
                                fontWeight: isUserAnswer || isCorrectAnswer ? 'bold' : 'normal',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                              }}
                            >
                              {option}
                              {isUserAnswer && (
                                <Chip 
                                  label="Your Answer" 
                                  size="small" 
                                  color={isCorrectAnswer ? 'success' : 'error'}
                                />
                              )}
                              {isCorrectAnswer && !isUserAnswer && (
                                <Chip 
                                  label="Correct Answer" 
                                  size="small" 
                                  color="success"
                                />
                              )}
                            </Typography>
                          </Box>
                        )
                      })}
                    </Box>
                  )}

                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Your Answer: <strong>{question.user_answer || 'Not answered'}</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Correct Answer: <strong>{question.correct_answer}</strong>
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )
          })}
        </List>

        {questions.length === 0 && !loading && (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Assessment sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No review data found
              </Typography>
              <Typography variant="body1" color="text.secondary">
                There seems to be an issue loading your review data.
              </Typography>
            </CardContent>
          </Card>
        )}

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button
            variant="contained"
            onClick={onBack}
            startIcon={<ArrowBack />}
            size="large"
          >
            Back to Study Plan
          </Button>
        </Box>
      </Box>
    </Box>
  )
}

export default ReviewPage
