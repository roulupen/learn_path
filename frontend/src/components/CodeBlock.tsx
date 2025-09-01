import React from 'react'
import {
  Box,
  Paper,
  Typography,
  Chip,
} from '@mui/material'
import {
  Code,
  BugReport,
  Speed,
  Lightbulb,
  School,
} from '@mui/icons-material'

interface CodeBlockProps {
  code: string
  language?: string
  questionType?: string
  title?: string
}

function CodeBlock({ code, language = 'python', questionType, title }: CodeBlockProps) {
  if (!code || code.trim() === '') {
    return null
  }

  // Clean and format the code for better display
  const cleanCode = code
    .replace(/\\n/g, '\n')  // Replace escaped newlines with actual newlines
    .replace(/\\t/g, '  ')  // Replace escaped tabs with spaces
    .replace(/\\"/g, '"')   // Replace escaped quotes
    .replace(/\\'/g, "'")   // Replace escaped single quotes
    .trim()

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

  return (
    <Box sx={{ mb: 3 }}>
      {/* Header with question type and language */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
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
          label={language}
          size="small"
          variant="outlined"
          sx={{ fontFamily: 'monospace' }}
        />
        {title && (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            {title}
          </Typography>
        )}
      </Box>

      {/* Code block */}
      <Paper
        elevation={2}
        sx={{
          backgroundColor: '#f5f5f5',
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        <Box
          component="pre"
          sx={{
            margin: 0,
            padding: 2,
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            fontSize: '0.875rem',
            lineHeight: 1.5,
            color: '#333',
            backgroundColor: 'transparent',
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          <code>{cleanCode}</code>
        </Box>
      </Paper>
    </Box>
  )
}

export default CodeBlock
