# app/routers/analysis_router.py

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.analysis_task import AnalysisTask
from app.models.document import Document
from app.services.analysis_service import (
    create_analysis_task,
    process_analysis_background,
    get_analysis_result,
    get_analysis_history,
    export_results_as_csv,
    export_results_as_pdf,
)
from app.services.auth_service import get_current_user
from app.models.user import User
from app.utils.logger import get_logger

logger = get_logger("analysis_router")

router = APIRouter(prefix="/analysis", tags=["Analysis"])


# ------------------------------------------------------------
# Start analysis (R10 — non-blocking via BackgroundTasks)
# ------------------------------------------------------------
@router.post("/start/{document_id}")
def start_analysis(
    document_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logger.info(f"Analysis start requested: document_id={document_id}, user_id={current_user.id}")
    try:
        existing = db.query(AnalysisTask).filter(
            AnalysisTask.document_id == document_id
        ).first()

        if existing:
            if existing.status == "running":
                return {"task_id": existing.task_id, "status": "running"}
            # Reuse existing task — reset it instead of creating a new one
            # (avoids one-to-one relationship integrity error)
            existing.status = "running"
            existing.progress = 0
            existing.completed_at = None
            db.commit()
            db.refresh(existing)
            background_tasks.add_task(process_analysis_background, existing.task_id)
            logger.info(f"Re-using existing task: task_id={existing.task_id}")
            return {"task_id": existing.task_id, "status": "running"}

        task = create_analysis_task(db, document_id, current_user.id)
        background_tasks.add_task(process_analysis_background, task.task_id)
        logger.info(f"Background analysis scheduled: task_id={task.task_id}")
        return {"task_id": task.task_id, "status": "running"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to start analysis for document_id={document_id}: {e}")
        raise HTTPException(status_code=500, detail="Could not start analysis. Please try again.")


# ------------------------------------------------------------
# Get analysis result / status (R11 — frontend polls this)
# ------------------------------------------------------------
@router.get("/result/{task_id}")
def get_result(
    task_id: str,
    keyword_filter: str = Query(None, alias="keyword"),
    min_freq: int = Query(None),
    max_freq: int = Query(None),
    sort_by: str = Query("frequency_desc"),
    limit: int = Query(50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logger.info(f"Fetching result: task_id={task_id}")
    try:
        return get_analysis_result(db, task_id, keyword_filter, min_freq, max_freq, sort_by, limit)
    except Exception as e:
        logger.error(f"Error fetching result for task_id={task_id}: {e}")
        raise HTTPException(status_code=500, detail="Could not retrieve analysis result.")


# ------------------------------------------------------------
# Export analysis result (C02)
# ------------------------------------------------------------
@router.get("/export/{task_id}")
def export_result(
    task_id: str,
    format: str = Query("csv"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logger.info(f"Exporting result: task_id={task_id}, format={format}")
    try:
        if format.lower() == "pdf":
            return export_results_as_pdf(db, task_id)
        else:
            return export_results_as_csv(db, task_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting result for task_id={task_id}: {e}")
        raise HTTPException(status_code=500, detail="Could not export analysis result.")


# ------------------------------------------------------------
# Cancel analysis (R12)
# ------------------------------------------------------------
@router.delete("/cancel/{task_id}")
def cancel_analysis(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(AnalysisTask).filter(AnalysisTask.task_id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    doc = db.query(Document).filter(
        Document.id == task.document_id,
        Document.owner_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=403, detail="Access denied.")

    if task.status not in ["running", "pending"]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel task with status '{task.status}'.")

    task.status = "cancelled"
    db.commit()
    logger.info(f"Task cancelled: task_id={task_id}")
    return {"message": "Analysis cancelled."}


# ------------------------------------------------------------
# Retry failed/cancelled analysis (S04)
# ------------------------------------------------------------
@router.post("/retry/{task_id}")
def retry_analysis(
    task_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(AnalysisTask).filter(AnalysisTask.task_id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")

    doc = db.query(Document).filter(
        Document.id == task.document_id,
        Document.owner_id == current_user.id
    ).first()
    if not doc:
        raise HTTPException(status_code=403, detail="Access denied.")

    if task.status not in ["failed", "cancelled"]:
        raise HTTPException(status_code=400, detail="Only failed or cancelled tasks can be retried.")

    task.status = "running"
    task.progress = 0
    task.completed_at = None
    db.commit()

    background_tasks.add_task(process_analysis_background, task.task_id)
    logger.info(f"Task retry scheduled: task_id={task_id}")
    return {"task_id": task.task_id, "status": "running"}


# ------------------------------------------------------------
# Analysis history (R16)
# ------------------------------------------------------------
@router.get("/history")
def analysis_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logger.info(f"Fetching analysis history for user_id={current_user.id}")
    return get_analysis_history(db, current_user.id)
