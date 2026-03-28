# app/services/analysis_service.py

from sqlalchemy.orm import Session
from fastapi import HTTPException
import uuid
from datetime import datetime
from app.models.analysis_task import AnalysisTask
from app.models.keyword_stat import KeywordStat
from app.models.document import Document
from app.utils.keyword_analysis import extract_keywords
from app.utils.logger import get_logger

logger = get_logger("analysis_service")


# -----------------------------------------------------------
# Create new analysis task
# -----------------------------------------------------------
def create_analysis_task(db: Session, document_id: int, user_id: int) -> AnalysisTask:
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.owner_id == user_id
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found or access denied.")

    task = AnalysisTask(
        task_id=str(uuid.uuid4()),
        document_id=document_id,
        status="running",
        progress=0,
        completed_at=None
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    logger.info(f"Analysis task created: task_id={task.task_id}, document_id={document_id}")
    return task


# -----------------------------------------------------------
# Background processing (runs in a separate thread)
# -----------------------------------------------------------
def process_analysis_background(task_id: str) -> None:
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        _run_analysis(db, task_id)
    except Exception as e:
        logger.error(f"Background analysis failed for task_id={task_id}: {e}")
        try:
            task = db.query(AnalysisTask).filter(AnalysisTask.task_id == task_id).first()
            if task:
                task.status = "failed"
                db.commit()
        except Exception:
            pass
    finally:
        db.close()


def _run_analysis(db: Session, task_id: str) -> None:
    task = db.query(AnalysisTask).filter(AnalysisTask.task_id == task_id).first()
    if not task:
        logger.error(f"Task not found: task_id={task_id}")
        return

    # Check cancellation before starting
    if task.status == "cancelled":
        return

    document = db.query(Document).filter(Document.id == task.document_id).first()
    if not document or not document.text_content:
        task.status = "failed"
        db.commit()
        logger.warning(f"No text content for task_id={task_id}")
        return

    # Progress: 20% — document loaded
    task.progress = 20
    db.commit()

    # Check cancellation
    db.refresh(task)
    if task.status == "cancelled":
        return

    # Delete old keyword stats
    db.query(KeywordStat).filter(KeywordStat.document_id == document.id).delete()
    db.commit()

    # Progress: 50% — extracting keywords
    task.progress = 50
    db.commit()

    db.refresh(task)
    if task.status == "cancelled":
        return

    keywords = extract_keywords(document.text_content)

    # Progress: 80% — saving results
    task.progress = 80
    db.commit()

    for word, freq in keywords.items():
        db.add(KeywordStat(keyword=word, count=freq, document_id=document.id))

    task.status = "completed"
    task.progress = 100
    task.completed_at = datetime.utcnow()

    # Update document status
    document.status = "completed"

    db.commit()
    logger.info(f"Analysis completed: task_id={task_id}, keywords={len(keywords)}")


# -----------------------------------------------------------
# Get analysis result
# -----------------------------------------------------------
def get_analysis_result(db: Session, task_id: str) -> dict:
    task = db.query(AnalysisTask).filter(AnalysisTask.task_id == task_id).first()
    if not task:
        return {"task_id": task_id, "status": "not_found", "progress": 0, "keywords": []}

    stats = db.query(KeywordStat).filter(KeywordStat.document_id == task.document_id).all()
    return {
        "task_id": str(task.task_id),
        "status": task.status or "pending",
        "progress": task.progress or 0,
        "keywords": [{"keyword": s.keyword, "frequency": s.count} for s in stats]
    }


# -----------------------------------------------------------
# Get analysis history for a user
# -----------------------------------------------------------
def get_analysis_history(db: Session, user_id: int) -> list:
    tasks = (
        db.query(AnalysisTask)
        .join(Document, AnalysisTask.document_id == Document.id)
        .filter(Document.owner_id == user_id)
        .order_by(AnalysisTask.started_at.desc())
        .all()
    )
    result = []
    for task in tasks:
        doc = db.query(Document).filter(Document.id == task.document_id).first()
        result.append({
            "task_id": task.task_id,
            "document_id": task.document_id,
            "filename": doc.filename if doc else "Unknown",
            "status": task.status,
            "progress": task.progress,
            "started_at": task.started_at,
            "completed_at": task.completed_at,
        })
    return result
