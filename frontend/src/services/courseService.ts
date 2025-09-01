import api from './api'

export interface Course {
  id: number
  title: string
  description: string
  short_description?: string
  instructor_id: number
  category: string
  difficulty_level: 'beginner' | 'intermediate' | 'advanced'
  estimated_duration: number
  thumbnail_url?: string
  price: number
  is_free: boolean
  is_published: boolean
  created_at: string
  updated_at?: string
}

export interface Enrollment {
  id: number
  user_id: number
  course_id: number
  status: 'active' | 'completed' | 'dropped' | 'paused'
  completion_percentage: number
  enrolled_at: string
  completed_at?: string
  last_accessed?: string
}

export interface CourseFilters {
  category?: string
  difficulty?: string
  search?: string
  skip?: number
  limit?: number
}

class CourseService {
  async getCourses(filters: CourseFilters = {}): Promise<Course[]> {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })

    const response = await api.get<Course[]>(`/api/courses?${params}`)
    return response.data
  }

  async getCourse(courseId: number): Promise<Course> {
    const response = await api.get<Course>(`/api/courses/${courseId}`)
    return response.data
  }

  async enrollInCourse(courseId: number): Promise<Enrollment> {
    const response = await api.post<Enrollment>(`/api/courses/${courseId}/enroll`)
    return response.data
  }

  async unenrollFromCourse(courseId: number): Promise<void> {
    await api.delete(`/api/courses/${courseId}/enroll`)
  }

  async getMyEnrollments(): Promise<Enrollment[]> {
    const response = await api.get<Enrollment[]>('/api/courses/my-courses/enrolled')
    return response.data
  }

  async getMyCourses(): Promise<Course[]> {
    const response = await api.get<Course[]>('/api/courses/my-courses/teaching')
    return response.data
  }

  async createCourse(courseData: Partial<Course>): Promise<Course> {
    const response = await api.post<Course>('/api/courses', courseData)
    return response.data
  }

  async updateCourse(courseId: number, courseData: Partial<Course>): Promise<Course> {
    const response = await api.put<Course>(`/api/courses/${courseId}`, courseData)
    return response.data
  }

  async deleteCourse(courseId: number): Promise<void> {
    await api.delete(`/api/courses/${courseId}`)
  }
}

export const courseService = new CourseService()
