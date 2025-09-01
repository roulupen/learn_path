import React, { useState, useEffect } from 'react'
import { Box, Typography, Chip } from '@mui/material'
import { AccessTime } from '@mui/icons-material'
import { sessionManager } from '../utils/sessionManager'

function SessionStatus() {
  const [timeRemaining, setTimeRemaining] = useState(15)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const updateStatus = () => {
      const remaining = sessionManager.getTimeRemaining()
      const loggedIn = sessionManager.isLoggedIn()
      
      setTimeRemaining(remaining)
      setIsActive(loggedIn)
    }

    // Update immediately
    updateStatus()

    // Update every 30 seconds
    const interval = setInterval(updateStatus, 30000)

    return () => clearInterval(interval)
  }, [])

  if (!isActive) return null

  const getColor = () => {
    if (timeRemaining <= 2) return 'error'
    if (timeRemaining <= 5) return 'warning'
    return 'success'
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <AccessTime sx={{ fontSize: 16 }} />
      <Chip
        label={`${timeRemaining}m left`}
        color={getColor() as any}
        size="small"
        variant="outlined"
      />
    </Box>
  )
}

export default SessionStatus
