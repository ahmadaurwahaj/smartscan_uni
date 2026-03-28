# app/services/keyword_service.py

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.keyword_stat import KeywordStat
from app.models.analysis_task import AnalysisTask
from app.models.document import Document


# ------------------------------------------------------
# Get Keywords for a Specific Task
# ------------------------------------------------------
def get_keywords_by_task(task_id: int, db: Session):
    task = db.query(AnalysisTask).filter(AnalysisTask.id == task_id).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis task not found."
        )

    stats = db.query(KeywordStat).filter(KeywordStat.task_id == task_id).all()

    return [
        {"keyword": stat.keyword, "frequency": stat.frequency}
        for stat in stats
    ]


# ------------------------------------------------------
# Get Keywords for a Document (Latest Task Only)
# ------------------------------------------------------
def get_keywords_by_document(document_id: int, db: Session):
    # Latest analysis for this document
    task = (
        db.query(AnalysisTask)
        .filter(AnalysisTask.document_id == document_id)
        .order_by(AnalysisTask.id.desc())
        .first()
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No analysis found for this document."
        )

    stats = db.query(KeywordStat).filter(KeywordStat.task_id == task.id).all()

    return {
        "task_id": task.id,
        "status": task.status,
        "keywords": [
            {"keyword": stat.keyword, "frequency": stat.frequency}
            for stat in stats
        ]
    }


# ------------------------------------------------------
# Search Keywords in a Task
# ------------------------------------------------------
def search_keywords(task_id: int, keyword: str, db: Session):
    stats = (
        db.query(KeywordStat)
        .filter(
            KeywordStat.task_id == task_id,
            KeywordStat.keyword.like(f"%{keyword.lower()}%")
        )
        .all()
    )

    if not stats:
        return {"results": []}

    return {
        "results": [
            {"keyword": s.keyword, "frequency": s.frequency}
            for s in stats
        ]
    }


# ------------------------------------------------------
# Get Top Keywords (Most Frequent)
# ------------------------------------------------------
def get_top_keywords(task_id: int, limit: int, db: Session):
    stats = (
        db.query(KeywordStat)
        .filter(KeywordStat.task_id == task_id)
        .order_by(KeywordStat.frequency.desc())
        .limit(limit)
        .all()
    )

    return [
        {"keyword": s.keyword, "frequency": s.frequency}
        for s in stats
    ]
