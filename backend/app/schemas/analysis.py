# app/schemas/analysis.py

from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


# ---------------------------------------
# Base Analysis Task Schema
# ---------------------------------------
class AnalysisTaskBase(BaseModel):
    id: int
    task_id: str
    status: str
    progress: int
    document_id: int

    class Config:
        from_attributes = True   # Pydantic v2 fix


# ---------------------------------------
# Required Missing Schema (Fix ImportError)
# ---------------------------------------
class AnalysisTaskResponse(BaseModel):
    message: str
    task: str


# ---------------------------------------
# Analysis Progress (Frontend Polling)
# ---------------------------------------
class AnalysisProgress(BaseModel):
    status: str
    progress: int


# ---------------------------------------
# Keyword Stats Response
# ---------------------------------------
class KeywordStatResponse(BaseModel):
    keyword: str
    count: int

    class Config:
        from_attributes = True    # Pydantic v2 fix


# ---------------------------------------
# Analysis Result Response
# ---------------------------------------
class AnalysisResultResponse(BaseModel):
    document_id: int
    extracted_text: str
    keywords: List[KeywordStatResponse]
    chart_data: dict  # frontend will use this for chart.js


# ---------------------------------------
# History Item
# ---------------------------------------
class AnalysisHistoryItem(BaseModel):
    document_id: int
    filename: str
    status: str
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True    # Pydantic v2 fix
