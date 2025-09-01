"""
Utility for loading and formatting LLM prompts from template files.
"""
import os
from pathlib import Path
from typing import Dict, Any

class PromptLoader:
    """Loads and formats LLM prompts from template files."""
    
    def __init__(self):
        # Get the prompts directory relative to the backend root
        self.prompts_dir = Path(__file__).parent.parent.parent / "prompts"
        
    def load_prompt(self, prompt_name: str, **kwargs) -> str:
        """
        Load a prompt template and format it with provided parameters.
        
        Args:
            prompt_name: Name of the prompt file (without .txt extension)
            **kwargs: Parameters to format into the prompt template
            
        Returns:
            Formatted prompt string
            
        Raises:
            FileNotFoundError: If prompt file doesn't exist
            KeyError: If required template parameters are missing
        """
        prompt_file = self.prompts_dir / f"{prompt_name}.txt"
        
        if not prompt_file.exists():
            raise FileNotFoundError(f"Prompt file not found: {prompt_file}")
            
        with open(prompt_file, 'r', encoding='utf-8') as f:
            template = f.read()
            
        try:
            return template.format(**kwargs)
        except KeyError as e:
            raise KeyError(f"Missing required parameter for prompt '{prompt_name}': {e}")
    
    def get_study_plan_prompt(self, course_name: str, duration_days: int) -> str:
        """Get formatted study plan generation prompt."""
        return self.load_prompt(
            "study_plan_generation",
            course_name=course_name,
            duration_days=duration_days
        )
    
    def get_adaptive_questions_prompt(
        self,
        course_name: str,
        day_number: int,
        total_days: int,
        course_content: str,
        user_accuracy: float,
        recent_accuracy: float,
        total_questions_answered: int,
        num_questions: int = 10
    ) -> str:
        """Get formatted adaptive questions generation prompt."""
        return self.load_prompt(
            "adaptive_questions_generation",
            course_name=course_name,
            day_number=day_number,
            total_days=total_days,
            course_content=course_content,
            user_accuracy=user_accuracy,
            recent_accuracy=recent_accuracy,
            total_questions_answered=total_questions_answered,
            num_questions=num_questions
        )
    
    def get_custom_questions_prompt(
        self,
        course_name: str,
        day_number: int,
        total_days: int,
        course_content: str,
        focus_areas: str,
        difficulty_preference: str,
        question_types: str,
        special_instructions: str,
        num_questions: int = 10
    ) -> str:
        """Get formatted custom questions generation prompt."""
        return self.load_prompt(
            "custom_questions_generation",
            course_name=course_name,
            day_number=day_number,
            total_days=total_days,
            course_content=course_content,
            focus_areas=focus_areas,
            difficulty_preference=difficulty_preference,
            question_types=question_types,
            special_instructions=special_instructions,
            num_questions=num_questions
        )

    def get_programming_question_evaluation_prompt(
        self,
        course_name: str,
        day_number: int,
        question_type: str,
        difficulty: str,
        question: str,
        options: str,
        correct_answer: str,
        explanation: str,
        code_snippet: str = ""
    ) -> str:
        """Get formatted programming question evaluation prompt"""
        return self.load_prompt(
            "programming_question_evaluation",
            course_name=course_name,
            day_number=day_number,
            question_type=question_type,
            difficulty=difficulty,
            question=question,
            options=options,
            correct_answer=correct_answer,
            explanation=explanation,
            code_snippet=code_snippet
        )

# Global instance
prompt_loader = PromptLoader()
