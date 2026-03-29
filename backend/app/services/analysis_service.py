# app/services/analysis_service.py

from sqlalchemy.orm import Session
from fastapi import HTTPException
import uuid
import os
import time
from datetime import datetime
from app.models.analysis_task import AnalysisTask
from app.models.keyword_stat import KeywordStat
from app.models.document import Document
from app.utils.keyword_analysis import extract_keywords
from app.utils.logger import get_logger

logger = get_logger("analysis_service")

import csv
import io
from fastapi.responses import StreamingResponse


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
    if not document:
        task.status = "failed"
        db.commit()
        logger.warning(f"No document found for task_id={task_id}")
        return

    text_file_path = f"{document.filepath}.txt"
    try:
        with open(text_file_path, "r", encoding="utf-8") as tf:
            text_content = tf.read().strip()
    except Exception as e:
        logger.warning(f"Could not read text file for task_id={task_id}: {e}")
        text_content = ""

    if not text_content:
        task.status = "failed"
        db.commit()
        logger.warning(f"No text content for task_id={task_id}")
        return

    # Progress: 20% — document loaded
    task.progress = 20
    db.commit()
    time.sleep(2)

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
    time.sleep(2)

    db.refresh(task)
    if task.status == "cancelled":
        return

    keywords = extract_keywords(text_content)

    # Progress: 80% — saving results
    task.progress = 80
    db.commit()
    time.sleep(2)

    db.refresh(task)
    if task.status == "cancelled":
        return

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
def get_analysis_result(
    db: Session, 
    task_id: str, 
    keyword_filter: str = None, 
    min_freq: int = None, 
    max_freq: int = None, 
    sort_by: str = "frequency_desc", 
    limit: int = 50
) -> dict:
    task = db.query(AnalysisTask).filter(AnalysisTask.task_id == task_id).first()
    if not task:
        return {"task_id": task_id, "status": "not_found", "progress": 0, "keywords": []}

    query = db.query(KeywordStat).filter(KeywordStat.document_id == task.document_id)

    if keyword_filter:
        query = query.filter(KeywordStat.keyword.ilike(f"%{keyword_filter}%"))
    if min_freq is not None:
        query = query.filter(KeywordStat.count >= min_freq)
    if max_freq is not None:
        query = query.filter(KeywordStat.count <= max_freq)

    if sort_by == "frequency_desc":
        query = query.order_by(KeywordStat.count.desc())
    elif sort_by == "frequency_asc":
        query = query.order_by(KeywordStat.count.asc())
    elif sort_by == "keyword_asc":
        query = query.order_by(KeywordStat.keyword.asc())
    elif sort_by == "keyword_desc":
        query = query.order_by(KeywordStat.keyword.desc())
    else:
        query = query.order_by(KeywordStat.count.desc())

    if limit and limit > 0:
        query = query.limit(limit)

    stats = query.all()
    return {
        "task_id": str(task.task_id),
        "status": task.status or "pending",
        "progress": task.progress or 0,
        "keywords": [{"keyword": s.keyword, "frequency": s.count} for s in stats]
    }

# -----------------------------------------------------------
# Export results (CSV / PDF)
# -----------------------------------------------------------
def export_results_as_csv(db: Session, task_id: str) -> StreamingResponse:
    task = db.query(AnalysisTask).filter(AnalysisTask.task_id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    stats = db.query(KeywordStat).filter(KeywordStat.document_id == task.document_id).order_by(KeywordStat.count.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Keyword", "Frequency"])
    for stat in stats:
        writer.writerow([stat.keyword, stat.count])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=analysis_{task_id}.csv"}
    )

def export_results_as_pdf(db: Session, task_id: str) -> StreamingResponse:
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle
        from reportlab.lib import colors
    except ImportError:
        raise HTTPException(status_code=500, detail="reportlab is not installed. PDF export is unavailable.")

    task = db.query(AnalysisTask).filter(AnalysisTask.task_id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    stats = db.query(KeywordStat).filter(KeywordStat.document_id == task.document_id).order_by(KeywordStat.count.desc()).all()

    output = io.BytesIO()
    doc = SimpleDocTemplate(output, pagesize=letter)
    elements = []

    data = [["Keyword", "Frequency"]]
    for stat in stats:
        data.append([stat.keyword, str(stat.count)])

    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(table)
    doc.build(elements)

    output.seek(0)
    return StreamingResponse(
        output,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=analysis_{task_id}.pdf"}
    )


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
