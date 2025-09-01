"""
Logging configuration for LearnPath application
"""
import logging
import logging.handlers
import os
from datetime import datetime
from pathlib import Path

def setup_logging():
    """Configure logging for the application"""
    
    # Create logs directory if it doesn't exist
    logs_dir = Path("logs")
    logs_dir.mkdir(exist_ok=True)
    
    # Configure root logger
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),  # Console output
            logging.handlers.RotatingFileHandler(
                logs_dir / "learnpath.log",
                maxBytes=10*1024*1024,  # 10MB
                backupCount=5
            )
        ]
    )
    
    # Create specific loggers for different components
    
    # Gemini AI Logger
    gemini_logger = logging.getLogger('gemini_ai')
    gemini_handler = logging.handlers.RotatingFileHandler(
        logs_dir / "gemini_ai.log",
        maxBytes=50*1024*1024,  # 50MB for AI responses
        backupCount=10
    )
    gemini_handler.setFormatter(
        logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    )
    gemini_logger.addHandler(gemini_handler)
    gemini_logger.setLevel(logging.INFO)
    
    # User Activity Logger
    user_activity_logger = logging.getLogger('user_activity')
    user_handler = logging.handlers.RotatingFileHandler(
        logs_dir / "user_activity.log",
        maxBytes=20*1024*1024,  # 20MB
        backupCount=5
    )
    user_handler.setFormatter(
        logging.Formatter('%(asctime)s - %(message)s')
    )
    user_activity_logger.addHandler(user_handler)
    user_activity_logger.setLevel(logging.INFO)
    
    # Performance Logger
    performance_logger = logging.getLogger('performance')
    perf_handler = logging.handlers.RotatingFileHandler(
        logs_dir / "performance.log",
        maxBytes=10*1024*1024,  # 10MB
        backupCount=3
    )
    perf_handler.setFormatter(
        logging.Formatter('%(asctime)s - %(message)s')
    )
    performance_logger.addHandler(perf_handler)
    performance_logger.setLevel(logging.INFO)
    
    return {
        'main': logging.getLogger('learnpath'),
        'gemini': gemini_logger,
        'user_activity': user_activity_logger,
        'performance': performance_logger
    }

def log_llm_request(logger, prompt: str, user_context: dict = None):
    """Log LLM request details"""
    logger.info("=" * 80)
    logger.info("LLM REQUEST INITIATED")
    logger.info(f"Timestamp: {datetime.now().isoformat()}")
    if user_context:
        logger.info(f"User Context: {user_context}")
    logger.info("PROMPT:")
    logger.info("-" * 40)
    logger.info(prompt)
    logger.info("-" * 40)

def log_llm_response(logger, response: str, generation_config: dict = None, processing_time: float = None):
    """Log LLM response details"""
    logger.info("LLM RESPONSE RECEIVED")
    if processing_time:
        logger.info(f"Processing Time: {processing_time:.2f} seconds")
    if generation_config:
        logger.info(f"Generation Config: {generation_config}")
    logger.info("RESPONSE:")
    logger.info("-" * 40)
    logger.info(response)
    logger.info("-" * 40)
    logger.info("=" * 80)

def log_llm_error(logger, error: Exception, prompt: str = None, user_context: dict = None):
    """Log LLM errors"""
    logger.error("=" * 80)
    logger.error("LLM ERROR OCCURRED")
    logger.error(f"Timestamp: {datetime.now().isoformat()}")
    logger.error(f"Error Type: {type(error).__name__}")
    logger.error(f"Error Message: {str(error)}")
    if user_context:
        logger.error(f"User Context: {user_context}")
    if prompt:
        logger.error("FAILED PROMPT:")
        logger.error("-" * 40)
        logger.error(prompt)
        logger.error("-" * 40)
    logger.error("=" * 80)

def log_user_activity(logger, username: str, action: str, details: dict = None):
    """Log user activity"""
    log_entry = {
        'timestamp': datetime.now().isoformat(),
        'username': username,
        'action': action,
        'details': details or {}
    }
    logger.info(f"USER_ACTIVITY: {log_entry}")

def log_performance_metric(logger, metric_name: str, value: float, context: dict = None):
    """Log performance metrics"""
    log_entry = {
        'timestamp': datetime.now().isoformat(),
        'metric': metric_name,
        'value': value,
        'context': context or {}
    }
    logger.info(f"PERFORMANCE: {log_entry}")

# Initialize loggers when module is imported
loggers = setup_logging()
