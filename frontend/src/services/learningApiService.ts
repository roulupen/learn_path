import api from './api'

// Types matching the backend schemas
export interface User {
  id: number
  name: string
  username: string
}

export interface Course {
  id: number
  course_name: string
  duration_days: number
  user_id: number
}

export interface Plan {
  id: number
  day_number: number
  content: string
  course_id: number
}

export interface Question {
  id: number
  day_number: number
  question: string
  difficulty: string
  points: number
  options?: string
  question_type?: string
  code_snippet?: string
}

export interface SubmitAnswerResponse {
  is_correct: boolean
  earned_points: number
  correct_answer: string
  feedback: string
}

export interface Progress {
  user_id: number
  course_id: number
  total_questions: number
  answered_questions: number
  earned_points: number
  total_points: number
  completion_percentage: number
  current_day: number
}

export interface CourseOverview {
  id: number
  course_name: string
  duration_days: number
  current_day: number
  completion_percentage: number
  total_questions: number
  answered_questions: number
  earned_points: number
  total_points: number
  last_activity: string
}

export interface RegenerateQuestionsRequest {
  username: string
  course_name: string
  day_number: number
  num_questions: number
  focus_areas?: string[]
  difficulty_preference?: 'easier' | 'balanced' | 'harder'
  question_types?: string[]
  special_instructions?: string
}

export interface GenerateQuestionsRequest {
  username: string
  course_name: string
  day_number: number
  num_questions: number
}

export interface CreateCourseRequest {
  username: string
  course_name: string
  course_description?: string
  duration_days: number
}

export interface AvailableCourse {
  name: string
  description: string
  suggested_duration: number
  difficulty_level: string
}

export interface DayStatus {
  day_number: number
  is_unlocked: boolean
  is_completed: boolean
  is_current: boolean
  total_questions: number
  answered_questions: number
  completion_percentage: number
  can_regenerate: boolean
  has_questions: boolean
  has_progress: boolean
  needs_questions: boolean
  can_continue: boolean
}

export interface QuestionReview {
  id: number
  day_number: number
  question: string
  difficulty: string
  points: number
  options?: string
  user_answer?: string
  correct_answer: string
  is_correct?: boolean
  earned_points: number
}

class LearningApiService {
  // User management
  async register(name: string, username: string): Promise<User> {
    const response = await api.post<User>('/api/register', {
      name,
      username
    })
    return response.data
  }

  async login(username: string): Promise<User> {
    const response = await api.post<User>('/api/login', {
      username
    })
    return response.data
  }

  async logout(username: string): Promise<void> {
    await api.post('/api/logout', { username })
  }

  // Available courses
  async getAvailableCourses(): Promise<AvailableCourse[]> {
    const response = await api.get<AvailableCourse[]>('/api/available-courses')
    return response.data
  }

  // Create custom course
  async createCourse(courseData: CreateCourseRequest): Promise<Course> {
    const response = await api.post<Course>('/api/create-course', courseData)
    return response.data
  }

  // Course management
  async generatePlan(username: string, course_name: string, duration_days: number): Promise<Course> {
    const response = await api.post<Course>('/api/generate-plan', {
      username,
      course_name,
      duration_days
    })
    return response.data
  }

  async getPlan(username: string, course_name: string): Promise<Plan[]> {
    const response = await api.get<Plan[]>(`/api/plan/${username}/${course_name}`)
    return response.data
  }

  // Questions
  async generateQuestions(requestData: GenerateQuestionsRequest): Promise<Question[]> {
    const response = await api.post<Question[]>('/api/generate-questions', requestData)
    return response.data
  }

  async getQuestions(username: string, course_name: string, day: number): Promise<Question[]> {
    const response = await api.get<Question[]>(`/api/questions/${username}/${course_name}/${day}`)
    return response.data
  }

  async submitAnswer(username: string, question_id: number, user_answer: string): Promise<SubmitAnswerResponse> {
    const response = await api.post<SubmitAnswerResponse>('/api/submit-answer', {
      username,
      question_id,
      user_answer
    })
    return response.data
  }

  // Progress tracking
  async getProgress(username: string, course_name: string): Promise<Progress> {
    const response = await api.get<Progress>(`/api/progress/${username}/${course_name}`)
    return response.data
  }

  // Dashboard
  async getDashboard(username: string): Promise<CourseOverview[]> {
    const response = await api.get<CourseOverview[]>(`/api/dashboard/${username}`)
    return response.data
  }

  // Question regeneration
  async regenerateQuestions(request: RegenerateQuestionsRequest): Promise<Question[]> {
    const response = await api.post<Question[]>('/api/regenerate-questions', request)
    return response.data
  }

  // Course progress and day management
  async getCourseProgress(username: string, course_name: string): Promise<DayStatus[]> {
    const response = await api.get<DayStatus[]>(`/api/course-progress/${username}/${course_name}`)
    return response.data
  }

  async getQuestionsReview(username: string, course_name: string, day: number): Promise<QuestionReview[]> {
    const response = await api.get<QuestionReview[]>(`/api/questions-review/${username}/${course_name}/${day}`)
    return response.data
  }
}

export const learningApiService = new LearningApiService()
