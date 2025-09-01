"""
Uvicorn configuration for LearnPath backend
Handles file watching optimization and logging configuration
"""
import logging
from pathlib import Path

def configure_uvicorn_logging():
    """Configure uvicorn and watchfiles logging to reduce noise"""
    # Reduce watchfiles logging to WARNING level
    logging.getLogger("watchfiles").setLevel(logging.WARNING)
    logging.getLogger("watchfiles.main").setLevel(logging.WARNING)
    
    # Reduce uvicorn access log verbosity in development
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

def get_reload_dirs():
    """Get directories to watch for changes, excluding problematic ones"""
    current_dir = Path(__file__).parent
    
    # Only watch essential directories
    reload_dirs = [
        str(current_dir / "app"),  # Main application code
        str(current_dir / "prompts"),  # AI prompts
    ]
    
    return reload_dirs

def get_reload_excludes():
    """Get patterns to exclude from file watching"""
    return [
        "*.log",
        "*.db", 
        "*.sqlite",
        "*.sqlite3",
        "*.pyc",
        "__pycache__",
        ".git",
        "logs/*",
        "data/*",
        "*.tmp",
        "*.temp",
        "*.swp",
        "*.swo",
        "*~",
    ]
