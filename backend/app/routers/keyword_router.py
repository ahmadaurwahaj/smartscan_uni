# app/routers/keyword_router.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.services.keyword_service import (
    get_keywords_by_task,
    get_keywords_by_document,
    search_keywords,
    get_top_keywords
)
from app.services.auth_service import get_current_user
from app.database import get_db

router = APIRouter(prefix="/keywords", tags=["Keywords"])


# ------------------------------------------------------------
# Get Keywords by Task ID
# ------------------------------------------------------------
@router.get("/task/{task_id}")
def keywords_for_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return get_keywords_by_task(task_id, db)


# ------------------------------------------------------------
# Get Keywords by Document ID
# (Gets latest analysis for that document)
# ------------------------------------------------------------
@router.get("/document/{document_id}")
def keywords_for_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return get_keywords_by_document(document_id, db)


# ------------------------------------------------------------
# Search Keywords in a Task
# ------------------------------------------------------------
@router.get("/search/{task_id}")
def search_task_keywords(
    task_id: int,
    query: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return search_keywords(task_id, query, db)


# ------------------------------------------------------------
# Get Top N Keywords
# ------------------------------------------------------------
@router.get("/top/{task_id}")
def top_keywords(
    task_id: int,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return get_top_keywords(task_id, limit, db)
