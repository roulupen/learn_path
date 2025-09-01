"""
Google Gemini AI integration service for AI-powered features
"""
import json
import logging
from typing import List, Dict, Any, Optional
import google.generativeai as genai
from app.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GeminiAIService:
    """Service for Google Gemini AI integration"""
    
    def __init__(self):
        if not settings.GEMINI_API_KEY:
            logger.warning("Gemini API key not configured. AI features will be disabled.")
            self.model = None
        else:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel('gemini-pro')
    
    def _is_available(self) -> bool:
        """Check if Gemini AI service is available"""
        return self.model is not None
    
    async def generate_study_plan(
        self,
        course_title: str,
        course_description: str,
        user_level: str,
        learning_goals: List[str],
        time_commitment: int,  # hours per week
        duration_weeks: int = 12
    ) -> Dict[str, Any]:
        """Generate a personalized study plan using AI"""
        
        if not self._is_available():
            return self._fallback_study_plan(course_title, user_level, duration_weeks)
        
        try:
            prompt = f"""
            Create a detailed, personalized study plan for the following course:
            
            Course: {course_title}
            Description: {course_description}
            Student Level: {user_level}
            Learning Goals: {', '.join(learning_goals)}
            Time Commitment: {time_commitment} hours per week
            Duration: {duration_weeks} weeks
            
            Please provide a comprehensive study plan in JSON format with the following structure:
            {{
                "title": "Study Plan Title",
                "description": "Brief description of the study plan",
                "total_duration_weeks": {duration_weeks},
                "weekly_time_commitment": {time_commitment},
                "difficulty_level": "{user_level}",
                "modules": [
                    {{
                        "week": 1,
                        "title": "Module Title",
                        "description": "Module description",
                        "learning_objectives": ["objective1", "objective2"],
                        "topics": ["topic1", "topic2"],
                        "activities": ["activity1", "activity2"],
                        "estimated_hours": 4,
                        "resources": ["resource1", "resource2"]
                    }}
                ],
                "milestones": [
                    {{
                        "week": 4,
                        "title": "Milestone Title",
                        "description": "Milestone description",
                        "deliverables": ["deliverable1", "deliverable2"]
                    }}
                ],
                "assessment_strategy": "Description of how progress will be assessed",
                "success_criteria": ["criteria1", "criteria2"]
            }}
            
            Make sure the plan is practical, progressive, and tailored to the student's level and goals.
            """
            
            system_prompt = "You are an expert educational consultant who creates personalized learning plans. Always respond with valid JSON only, no additional text."
            full_prompt = f"{system_prompt}\n\n{prompt}"
            
            response = self.model.generate_content(
                full_prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.7,
                    max_output_tokens=2000,
                )
            )
            
            content = response.text
            # Clean up the response to ensure it's valid JSON
            content = content.strip()
            if content.startswith('```json'):
                content = content[7:]
            if content.endswith('```'):
                content = content[:-3]
            content = content.strip()
            
            study_plan = json.loads(content)
            
            logger.info(f"Generated AI study plan for course: {course_title}")
            return study_plan
            
        except Exception as e:
            logger.error(f"Error generating study plan: {str(e)}")
            return self._fallback_study_plan(course_title, user_level, duration_weeks)
    
    async def generate_practice_questions(
        self,
        topic: str,
        difficulty_level: str,
        question_count: int = 5,
        question_types: List[str] = None
    ) -> List[Dict[str, Any]]:
        """Generate practice questions for a topic"""
        
        if not self._is_available():
            return self._fallback_questions(topic, question_count)
        
        if question_types is None:
            question_types = ["multiple_choice", "true_false", "short_answer"]
        
        try:
            prompt = f"""
            Generate {question_count} practice questions about: {topic}
            Difficulty level: {difficulty_level}
            Question types: {', '.join(question_types)}
            
            Provide the questions in JSON format:
            [
                {{
                    "question": "Question text",
                    "type": "multiple_choice",
                    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
                    "correct_answer": "A",
                    "explanation": "Explanation of the correct answer",
                    "difficulty": "{difficulty_level}",
                    "points": 1
                }}
            ]
            
            For true_false questions, use options: ["True", "False"]
            For short_answer questions, omit the options field and provide the correct_answer as text.
            """
            
            system_prompt = "You are an expert educator who creates high-quality practice questions. Always respond with valid JSON only, no additional text."
            full_prompt = f"{system_prompt}\n\n{prompt}"
            
            response = self.model.generate_content(
                full_prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.8,
                    max_output_tokens=1500,
                )
            )
            
            content = response.text
            # Clean up the response to ensure it's valid JSON
            content = content.strip()
            if content.startswith('```json'):
                content = content[7:]
            if content.endswith('```'):
                content = content[:-3]
            content = content.strip()
            
            questions = json.loads(content)
            
            logger.info(f"Generated {len(questions)} practice questions for topic: {topic}")
            return questions
            
        except Exception as e:
            logger.error(f"Error generating practice questions: {str(e)}")
            return self._fallback_questions(topic, question_count)
    
    async def provide_learning_feedback(
        self,
        user_progress: Dict[str, Any],
        recent_performance: List[Dict[str, Any]],
        learning_goals: List[str]
    ) -> Dict[str, Any]:
        """Provide personalized learning feedback and recommendations"""
        
        if not self._is_available():
            return self._fallback_feedback(user_progress)
        
        try:
            prompt = f"""
            Analyze the student's learning progress and provide personalized feedback:
            
            Progress Data: {json.dumps(user_progress)}
            Recent Performance: {json.dumps(recent_performance)}
            Learning Goals: {', '.join(learning_goals)}
            
            Provide feedback in JSON format:
            {{
                "overall_assessment": "Overall progress assessment",
                "strengths": ["strength1", "strength2"],
                "areas_for_improvement": ["area1", "area2"],
                "specific_recommendations": [
                    {{
                        "category": "study_habits",
                        "recommendation": "Specific recommendation",
                        "priority": "high|medium|low"
                    }}
                ],
                "motivational_message": "Encouraging message for the student",
                "next_steps": ["step1", "step2"],
                "estimated_improvement_time": "Time estimate for seeing improvement"
            }}
            """
            
            system_prompt = "You are a supportive learning coach who provides constructive feedback and motivation. Always respond with valid JSON only, no additional text."
            full_prompt = f"{system_prompt}\n\n{prompt}"
            
            response = self.model.generate_content(
                full_prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.7,
                    max_output_tokens=1000,
                )
            )
            
            content = response.text
            # Clean up the response to ensure it's valid JSON
            content = content.strip()
            if content.startswith('```json'):
                content = content[7:]
            if content.endswith('```'):
                content = content[:-3]
            content = content.strip()
            
            feedback = json.loads(content)
            
            logger.info("Generated personalized learning feedback")
            return feedback
            
        except Exception as e:
            logger.error(f"Error generating learning feedback: {str(e)}")
            return self._fallback_feedback(user_progress)
    
    async def suggest_learning_resources(
        self,
        topic: str,
        learning_style: str,
        difficulty_level: str
    ) -> List[Dict[str, Any]]:
        """Suggest additional learning resources"""
        
        if not self._is_available():
            return self._fallback_resources(topic)
        
        try:
            prompt = f"""
            Suggest learning resources for:
            Topic: {topic}
            Learning Style: {learning_style}
            Difficulty Level: {difficulty_level}
            
            Provide suggestions in JSON format:
            [
                {{
                    "type": "video|article|book|exercise|tool",
                    "title": "Resource title",
                    "description": "Brief description",
                    "url": "URL if available (use placeholder if not)",
                    "estimated_time": "Time to consume/complete",
                    "difficulty": "{difficulty_level}",
                    "why_recommended": "Why this resource is good for this student"
                }}
            ]
            
            Provide 5-7 diverse resources that cater to different learning preferences.
            """
            
            system_prompt = "You are an educational resource curator who knows the best learning materials. Always respond with valid JSON only, no additional text."
            full_prompt = f"{system_prompt}\n\n{prompt}"
            
            response = self.model.generate_content(
                full_prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.8,
                    max_output_tokens=1200,
                )
            )
            
            content = response.text
            # Clean up the response to ensure it's valid JSON
            content = content.strip()
            if content.startswith('```json'):
                content = content[7:]
            if content.endswith('```'):
                content = content[:-3]
            content = content.strip()
            
            resources = json.loads(content)
            
            logger.info(f"Generated {len(resources)} learning resource suggestions for: {topic}")
            return resources
            
        except Exception as e:
            logger.error(f"Error generating learning resources: {str(e)}")
            return self._fallback_resources(topic)
    
    def _fallback_study_plan(self, course_title: str, user_level: str, duration_weeks: int) -> Dict[str, Any]:
        """Fallback study plan when AI is not available"""
        return {
            "title": f"Study Plan for {course_title}",
            "description": f"A structured {duration_weeks}-week study plan",
            "total_duration_weeks": duration_weeks,
            "weekly_time_commitment": 5,
            "difficulty_level": user_level,
            "modules": [
                {
                    "week": i,
                    "title": f"Week {i}: Introduction to Core Concepts",
                    "description": f"Focus on fundamental concepts for week {i}",
                    "learning_objectives": ["Understand basic concepts", "Apply knowledge"],
                    "topics": ["Core topic 1", "Core topic 2"],
                    "activities": ["Reading", "Practice exercises"],
                    "estimated_hours": 5,
                    "resources": ["Course materials", "Additional readings"]
                } for i in range(1, duration_weeks + 1)
            ],
            "milestones": [
                {
                    "week": duration_weeks // 2,
                    "title": "Mid-course Assessment",
                    "description": "Evaluate progress and understanding",
                    "deliverables": ["Complete assessment", "Review progress"]
                }
            ],
            "assessment_strategy": "Regular quizzes and practical exercises",
            "success_criteria": ["Complete all modules", "Pass assessments"]
        }
    
    def _fallback_questions(self, topic: str, count: int) -> List[Dict[str, Any]]:
        """Fallback questions when AI is not available"""
        return [
            {
                "question": f"What is the main concept of {topic}?",
                "type": "multiple_choice",
                "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
                "correct_answer": "A",
                "explanation": "This is a sample question about the topic.",
                "difficulty": "medium",
                "points": 1
            } for _ in range(count)
        ]
    
    def _fallback_feedback(self, user_progress: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback feedback when AI is not available"""
        return {
            "overall_assessment": "You are making steady progress in your learning journey.",
            "strengths": ["Consistent study habits", "Good engagement with materials"],
            "areas_for_improvement": ["Time management", "Practice more exercises"],
            "specific_recommendations": [
                {
                    "category": "study_habits",
                    "recommendation": "Try to study at consistent times each day",
                    "priority": "medium"
                }
            ],
            "motivational_message": "Keep up the great work! Every step forward is progress.",
            "next_steps": ["Continue with current plan", "Focus on weak areas"],
            "estimated_improvement_time": "2-3 weeks with consistent effort"
        }
    
    def _fallback_resources(self, topic: str) -> List[Dict[str, Any]]:
        """Fallback resources when AI is not available"""
        return [
            {
                "type": "article",
                "title": f"Introduction to {topic}",
                "description": f"A comprehensive guide to understanding {topic}",
                "url": "https://example.com/resource",
                "estimated_time": "30 minutes",
                "difficulty": "beginner",
                "why_recommended": "Great starting point for beginners"
            }
        ]

# Global service instance
gemini_service = GeminiAIService()
