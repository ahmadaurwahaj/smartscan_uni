# app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers.auth_router import router as auth_router
from app.routers.user_router import router as user_router
from app.routers.document_router import router as document_router
from app.routers.analysis_router import router as analysis_router
from app.routers.keyword_router import router as keyword_router


# Create tables in database
Base.metadata.create_all(bind=engine)

# FastAPI app instance
app = FastAPI(
    title="Smart Document Analysis System",
    version="1.0.0",
    description="Automated document processing, text extraction, and analysis using FastAPI."
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # You can restrict this later in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(user_router)
app.include_router(document_router)
app.include_router(analysis_router)
app.include_router(keyword_router)


@app.get("/")
def root():
    return {"message": "Smart Document System API is running 🚀"}
