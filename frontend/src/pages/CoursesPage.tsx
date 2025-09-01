import React, { useState } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Rating,
} from '@mui/material'
import { School, Person, AccessTime } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

// Mock course data
const mockCourses = [
  {
    id: 1,
    title: 'React Advanced Patterns',
    description: 'Learn advanced React patterns including hooks, context, and performance optimization techniques.',
    short_description: 'Master advanced React development techniques',
    category: 'Web Development',
    difficulty_level: 'advanced',
    estimated_duration: 40,
    instructor: { full_name: 'John Doe' },
    price: 99.99,
    is_free: false,
    thumbnail_url: null,
    rating: 4.8,
    students: 1250,
  },
  {
    id: 2,
    title: 'Machine Learning Fundamentals',
    description: 'Introduction to machine learning concepts, algorithms, and practical applications.',
    short_description: 'Get started with machine learning',
    category: 'Data Science',
    difficulty_level: 'beginner',
    estimated_duration: 60,
    instructor: { full_name: 'Jane Smith' },
    price: 0,
    is_free: true,
    thumbnail_url: null,
    rating: 4.6,
    students: 2100,
  },
  {
    id: 3,
    title: 'Python Web Development',
    description: 'Build web applications using Python, FastAPI, and modern development practices.',
    short_description: 'Create web apps with Python',
    category: 'Backend Development',
    difficulty_level: 'intermediate',
    estimated_duration: 50,
    instructor: { full_name: 'Mike Johnson' },
    price: 79.99,
    is_free: false,
    thumbnail_url: null,
    rating: 4.7,
    students: 890,
  },
  {
    id: 4,
    title: 'UI/UX Design Principles',
    description: 'Learn the fundamentals of user interface and user experience design.',
    short_description: 'Master UI/UX design basics',
    category: 'Design',
    difficulty_level: 'beginner',
    estimated_duration: 30,
    instructor: { full_name: 'Sarah Wilson' },
    price: 0,
    is_free: true,
    thumbnail_url: null,
    rating: 4.9,
    students: 1800,
  },
]

function CoursesPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('')

  const categories = ['Web Development', 'Data Science', 'Backend Development', 'Design', 'Mobile Development']
  const difficulties = ['beginner', 'intermediate', 'advanced']

  const filteredCourses = mockCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !categoryFilter || course.category === categoryFilter
    const matchesDifficulty = !difficultyFilter || course.difficulty_level === difficultyFilter
    
    return matchesSearch && matchesCategory && matchesDifficulty
  })

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'success'
      case 'intermediate': return 'warning'
      case 'advanced': return 'error'
      default: return 'default'
    }
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Explore Courses
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Discover new skills and advance your learning journey
      </Typography>

      {/* Filters */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search courses..."
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map(category => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Difficulty</InputLabel>
              <Select
                value={difficultyFilter}
                label="Difficulty"
                onChange={(e) => setDifficultyFilter(e.target.value)}
              >
                <MenuItem value="">All Levels</MenuItem>
                {difficulties.map(difficulty => (
                  <MenuItem key={difficulty} value={difficulty}>
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setSearchTerm('')
                setCategoryFilter('')
                setDifficultyFilter('')
              }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Results */}
      <Typography variant="h6" gutterBottom>
        {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
      </Typography>

      <Grid container spacing={3}>
        {filteredCourses.map((course) => (
          <Grid item xs={12} sm={6} md={4} key={course.id}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                }
              }}
            >
              <CardMedia
                sx={{ 
                  height: 200, 
                  bgcolor: 'primary.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <School sx={{ fontSize: 60, color: 'white' }} />
              </CardMedia>
              
              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                  <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
                    {course.title}
                  </Typography>
                  <Chip
                    label={course.difficulty_level}
                    color={getDifficultyColor(course.difficulty_level) as any}
                    size="small"
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {course.short_description}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Person sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {course.instructor.full_name}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AccessTime sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {course.estimated_duration} hours
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Rating value={course.rating} precision={0.1} size="small" readOnly />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    ({course.students} students)
                  </Typography>
                </Box>
                
                <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" color="primary">
                    {course.is_free ? 'Free' : `$${course.price}`}
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => navigate(`/courses/${course.id}`)}
                  >
                    View Course
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredCourses.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <School sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No courses found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Try adjusting your search criteria or browse all courses
          </Typography>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => {
              setSearchTerm('')
              setCategoryFilter('')
              setDifficultyFilter('')
            }}
          >
            Show All Courses
          </Button>
        </Box>
      )}
    </Box>
  )
}

export default CoursesPage
