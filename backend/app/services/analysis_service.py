# app/services/analysis_service.py

from sqlalchemy.orm import Session
from fastapi import HTTPException
import uuid
from datetime import datetime
from uuid import UUID
from app.models.analysis_task import AnalysisTask
from app.models.keyword_stat import KeywordStat
from app.models.document import Document
from app.utils.keyword_analysis import extract_keywords


# -----------------------------------------------------------
# Create new analysis task
# -----------------------------------------------------------
def create_analysis_task(db: Session, document_id: int, user_id: int):

    document = db.query(Document).filter(
        Document.id == document_id,
        Document.owner_id == user_id
    ).first()

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found or not owned by user"
        )

    task = AnalysisTask(
        task_id=str(uuid.uuid4()),  # ✅ unique string id
        document_id=document_id,
        status="running",
        progress=0,
        completed_at=None
    )

    db.add(task)
    db.commit()
    db.refresh(task)

    return task


# -----------------------------------------------------------
# Run analysis immediately
# -----------------------------------------------------------
def process_analysis_task(db: Session, task_id: str):

    task = db.query(AnalysisTask).filter(
        AnalysisTask.task_id == task_id
    ).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    document = db.query(Document).filter(
        Document.id == task.document_id
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if not document.text_content:
        raise HTTPException(
            status_code=400,
            detail="No extracted text found in document"
        )

    # Delete old keywords
    db.query(KeywordStat).filter(
        KeywordStat.document_id == document.id
    ).delete()

    keywords = extract_keywords(document.text_content)
    print("EXTRACTED:", keywords)

    for word, freq in keywords.items():
        db.add(
            KeywordStat(
                keyword=word,
                count=freq,
                document_id=document.id
            )
        )

    task.status = "completed"
    task.progress = 100
    task.completed_at = datetime.utcnow()

    db.commit()

    return {"message": "Analysis completed successfully"}


# -----------------------------------------------------------
# Get analysis results
# -----------------------------------------------------------
def get_analysis_result(db: Session, task_id: str):
    # Fix: remove UUID conversion
    task = db.query(AnalysisTask).filter(AnalysisTask.task_id == task_id).first()

    if not task:
        return {
            "task_id": task_id,
            "status": "not_found",
            "progress": 0,
            "keywords": []
        }

    stats = db.query(KeywordStat).filter(KeywordStat.document_id == task.document_id).all()

    return {
        "task_id": str(task.task_id),
        "status": task.status or "pending",
        "progress": task.progress or 0,
        "keywords": [
            {"keyword": s.keyword, "frequency": s.count} for s in stats
        ] or []
    }