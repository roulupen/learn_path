import React from 'react'
import {
  Box,
  Typography,
  Chip,
  Divider,
} from '@mui/material'
import {
  Code,
  BugReport,
  Speed,
  Lightbulb,
  School,
} from '@mui/icons-material'
import CodeBlock from './CodeBlock'

interface ProgrammingQuestionProps {
  question: string
  questionType?: string
  difficulty: string
  points: number
  codeSnippet?: string
  options?: string[]
  showCodeFirst?: boolean
}

function ProgrammingQuestion({
  question,
  questionType,
  difficulty,
  points,
  codeSnippet,
  options,
  showCodeFirst = false,
}: ProgrammingQuestionProps) {
  const getQuestionTypeIcon = (type?: string) => {
    switch (type) {
      case 'code_analysis':
        return <Code color="primary" />
      case 'debugging':
        return <BugReport color="error" />
      case 'algorithm':
        return <Speed color="warning" />
      case 'best_practice':
        return <Lightbulb color="success" />
      default:
        return <School color="info" />
    }
  }

  const getQuestionTypeLabel = (type?: string) => {
    switch (type) {
      case 'code_analysis':
        return 'Code Analysis'
      case 'debugging':
        return 'Debugging'
      case 'algorithm':
        return 'Algorithm'
      case 'best_practice':
        return 'Best Practice'
      default:
        return 'Conceptual'
    }
  }

  const getQuestionTypeColor = (type?: string) => {
    switch (type) {
      case 'code_analysis':
        return 'primary'
      case 'debugging':
        return 'error'
      case 'algorithm':
        return 'warning'
      case 'best_practice':
        return 'success'
      default:
        return 'info'
    }
  }

  const getDifficultyColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'beginner':
        return 'success'
      case 'intermediate':
        return 'warning'
      case 'advanced':
        return 'error'
      default:
        return 'default'
    }
  }

  const renderQuestionText = (text: string) => {
    // Split text by code markers (backticks) and render accordingly
    const parts = text.split(/(`[^`]+`)/)
    
    return parts.map((part, index) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        // This is inline code
        const code = part.slice(1, -1)
        return (
          <Box
            key={index}
            component="code"
            sx={{
              backgroundColor: '#f0f0f0',
              padding: '2px 6px',
              borderRadius: 1,
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              fontSize: '0.9em',
              color: '#d63384',
              border: '1px solid #e0e0e0',
            }}
          >
            {code}
          </Box>
        )
      }
      return part
    })
  }

  return (
    <Box>
      {/* Question Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {questionType && (
          <Chip
            icon={getQuestionTypeIcon(questionType)}
            label={getQuestionTypeLabel(questionType)}
            color={getQuestionTypeColor(questionType) as any}
            size="small"
            variant="outlined"
          />
        )}
        <Chip
          label={difficulty}
          color={getDifficultyColor(difficulty) as any}
          size="small"
        />
        <Chip
          label={`${points} points`}
          variant="outlined"
          size="small"
          sx={{ fontWeight: 'bold' }}
        />
      </Box>

      {/* Code Snippet (if showCodeFirst is true) */}
      {showCodeFirst && codeSnippet && (
        <Box sx={{ mb: 3 }}>
          <CodeBlock
            code={codeSnippet}
            language="python"
            questionType={questionType}
            title="Code to Analyze"
          />
        </Box>
      )}

      {/* Question Text */}
      <Typography 
        variant="h6" 
        gutterBottom
        sx={{ 
          lineHeight: 1.6,
          '& code': {
            backgroundColor: '#f0f0f0',
            padding: '2px 6px',
            borderRadius: 1,
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            fontSize: '0.9em',
            color: '#d63384',
            border: '1px solid #e0e0e0',
          }
        }}
      >
        {renderQuestionText(question)}
      </Typography>

      {/* Code Snippet (if showCodeFirst is false) */}
      {!showCodeFirst && codeSnippet && (
        <Box sx={{ mt: 2, mb: 2 }}>
          <CodeBlock
            code={codeSnippet}
            language="python"
            questionType={questionType}
            title="Code to Analyze"
          />
        </Box>
      )}

      {/* Options */}
      {options && options.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Select the correct answer:
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default ProgrammingQuestion
