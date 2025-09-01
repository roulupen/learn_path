import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
} from '@mui/material'
import { School } from '@mui/icons-material'

import { learningApiService, User } from '../../services/learningApiService'

interface Props {
  onLogin: (user: User) => void
}

function LoginRegisterPage({ onLogin }: Props) {
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Login form
  const [loginUsername, setLoginUsername] = useState('')
  
  // Register form
  const [registerData, setRegisterData] = useState({
    name: '',
    username: '',
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginUsername.trim()) {
      setError('Please enter a username')
      return
    }

    setLoading(true)
    setError('')

    try {
      const user = await learningApiService.login(loginUsername)
      onLogin(user)
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!registerData.name.trim() || !registerData.username.trim()) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      const user = await learningApiService.register(registerData.name, registerData.username)
      onLogin(user)
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <Card sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
            <School sx={{ mr: 1, fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4" color="primary">
              LearnPath
            </Typography>
          </Box>

          <Tabs
            value={activeTab}
            onChange={(_, newValue) => {
              setActiveTab(newValue)
              setError('')
            }}
            centered
            sx={{ mb: 3 }}
          >
            <Tab label="Login" />
            <Tab label="Register" />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {activeTab === 0 ? (
            // Login Form
            <Box component="form" onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="Username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                disabled={loading}
                sx={{ mb: 2 }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </Box>
          ) : (
            // Register Form
            <Box component="form" onSubmit={handleRegister}>
              <TextField
                fullWidth
                label="Full Name"
                value={registerData.name}
                onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                disabled={loading}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Username"
                value={registerData.username}
                onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                disabled={loading}
                sx={{ mb: 2 }}
                helperText="Choose a unique username"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Creating Account...' : 'Register'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default LoginRegisterPage
