# app/main.py

import traceback
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.database import Base, engine
from app.routers.auth_router import router as auth_router
from app.routers.user_router import router as user_router
from app.routers.document_router import router as document_router
from app.routers.analysis_router import router as analysis_router
from app.routers.keyword_router import router as keyword_router
from app.utils.logger import get_logger

logger = get_logger("main")

# Create tables in database
logger.info("Initializing database tables...")
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
except Exception as e:
    logger.error(f"Failed to initialize database tables: {e}")
    raise

# FastAPI app instance
app = FastAPI(
    title="Smart Document Analysis System",
    version="1.0.0",
    description="Automated document processing, text extraction, and analysis using FastAPI."
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global exception handler — catches unhandled errors and returns structured JSON
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url}: {exc}")
    logger.debug(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )

# Include routers
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(document_router)
app.include_router(analysis_router)
app.include_router(keyword_router)

logger.info("All routers registered. API is ready.")


@app.get("/")
def root():
    logger.info("Health check endpoint called.")
    return {"message": "Smart Document System API is running"}
