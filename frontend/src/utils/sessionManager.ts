/**
 * Session Management Utility
 * Handles user sessions with 15-minute timeout and activity tracking
 */

export interface SessionData {
  user: any
  loginTime: number
  lastActivity: number
  expiresAt: number
}

class SessionManager {
  private readonly SESSION_KEY = 'learnpath_session'
  private readonly TIMEOUT_DURATION = 15 * 60 * 1000 // 15 minutes in milliseconds
  private activityTimer: NodeJS.Timeout | null = null
  private onSessionExpired: (() => void) | null = null

  /**
   * Save user session data
   */
  saveSession(user: any): void {
    const now = Date.now()
    const sessionData: SessionData = {
      user,
      loginTime: now,
      lastActivity: now,
      expiresAt: now + this.TIMEOUT_DURATION
    }

    localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData))
    this.startActivityTimer()
    
    console.log('Session saved:', {
      user: user.username,
      expiresAt: new Date(sessionData.expiresAt).toLocaleTimeString()
    })
  }

  /**
   * Get current session data if valid
   */
  getSession(): SessionData | null {
    try {
      const sessionStr = localStorage.getItem(this.SESSION_KEY)
      if (!sessionStr) return null

      const sessionData: SessionData = JSON.parse(sessionStr)
      const now = Date.now()

      // Check if session has expired
      if (now > sessionData.expiresAt) {
        console.log('Session expired at:', new Date(sessionData.expiresAt).toLocaleTimeString())
        this.clearSession()
        return null
      }

      return sessionData
    } catch (error) {
      console.error('Error reading session:', error)
      this.clearSession()
      return null
    }
  }

  /**
   * Update last activity and extend session
   */
  updateActivity(): void {
    const sessionData = this.getSession()
    if (!sessionData) return

    const now = Date.now()
    sessionData.lastActivity = now
    sessionData.expiresAt = now + this.TIMEOUT_DURATION

    localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData))
    this.startActivityTimer()

    console.log('Activity updated, session extended to:', new Date(sessionData.expiresAt).toLocaleTimeString())
  }

  /**
   * Clear session data
   */
  clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY)
    this.stopActivityTimer()
    console.log('Session cleared')
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return this.getSession() !== null
  }

  /**
   * Get current user if logged in
   */
  getCurrentUser(): any | null {
    const session = this.getSession()
    return session?.user || null
  }

  /**
   * Set callback for session expiration
   */
  setOnSessionExpired(callback: () => void): void {
    this.onSessionExpired = callback
  }

  /**
   * Start activity timer to check for session expiration
   */
  private startActivityTimer(): void {
    this.stopActivityTimer()
    
    this.activityTimer = setTimeout(() => {
      const session = this.getSession()
      if (!session) {
        // Session already expired or cleared
        return
      }

      const now = Date.now()
      if (now > session.expiresAt) {
        console.log('Session timeout - logging out user')
        this.clearSession()
        if (this.onSessionExpired) {
          this.onSessionExpired()
        }
      } else {
        // Session still valid, check again later
        this.startActivityTimer()
      }
    }, 60000) // Check every minute
  }

  /**
   * Stop activity timer
   */
  private stopActivityTimer(): void {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer)
      this.activityTimer = null
    }
  }

  /**
   * Get time remaining in session (in minutes)
   */
  getTimeRemaining(): number {
    const session = this.getSession()
    if (!session) return 0

    const now = Date.now()
    const remaining = session.expiresAt - now
    return Math.max(0, Math.floor(remaining / 60000)) // Convert to minutes
  }

  /**
   * Extend session by full timeout duration
   */
  extendSession(): void {
    this.updateActivity()
  }
}

// Create singleton instance
export const sessionManager = new SessionManager()

// Activity tracking functions
export const trackActivity = () => {
  sessionManager.updateActivity()
}

// Auto-track common user activities
if (typeof window !== 'undefined') {
  // Track mouse movements, clicks, and keyboard activity
  const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
  
  let lastActivityTime = 0
  const throttleDelay = 30000 // Only update every 30 seconds to avoid spam

  const handleActivity = () => {
    const now = Date.now()
    if (now - lastActivityTime > throttleDelay) {
      trackActivity()
      lastActivityTime = now
    }
  }

  activityEvents.forEach(event => {
    document.addEventListener(event, handleActivity, true)
  })
}
