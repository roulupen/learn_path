"""
LearnPath - Main FastAPI Application
"""
import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

from app.database import create_tables
from app.routers import learning_api
from app.config import settings
from app.utils.logger import setup_logging

# Load environment variables
load_dotenv()

# Setup logging
loggers = setup_logging()
main_logger = loggers['main']

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    main_logger.info("🚀 Starting LearnPath application...")
    main_logger.info(f"Debug mode: {settings.DEBUG}")
    main_logger.info(f"Database URL: {settings.DATABASE_URL}")
    main_logger.info(f"Gemini AI configured: {'Yes' if settings.GEMINI_API_KEY else 'No'}")
    
    create_tables()
    main_logger.info("✅ Database tables created successfully")
    
    yield
    
    # Shutdown
    main_logger.info("🛑 Shutting down LearnPath application...")
    pass

# Create FastAPI application
app = FastAPI(
    title="LearnPath API",
    description="AI-Powered Learning Management System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files (for uploaded content)
os.makedirs("data/uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="data/uploads"), name="uploads")

# Learning API routes (core learning functionality)
app.include_router(learning_api.router, prefix="/api", tags=["Learning API"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to LearnPath API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
