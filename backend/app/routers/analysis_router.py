from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.analysis_service import (
    create_analysis_task,
    process_analysis_task,
    get_analysis_result
)

router = APIRouter(prefix="/analysis", tags=["Analysis"])

# Start analysis for a document
@router.post("/start/{document_id}")
def start_analysis(document_id: int, db: Session = Depends(get_db)):
    user_id = 1  # Temporary user

    # Check if an existing task already exists for this document
    existing_task = db.query(AnalysisTask := getattr(__import__('app.models.analysis_task', fromlist=['AnalysisTask']), 'AnalysisTask')).filter(
        AnalysisTask.document_id == document_id
    ).first()

    if existing_task:
        task = existing_task
    else:
        # Create a new analysis task
        task = create_analysis_task(db, document_id, user_id)

    # Process the task (immediate for now)
    process_analysis_task(db, task.task_id)

    # Return task info compatible with Angular
    return {"task_id": task.task_id, "status": "completed"}

# Get analysis result
@router.get("/result/{task_id}")
def get_result(task_id: str, db: Session = Depends(get_db)):
    try:
        result = get_analysis_result(db, task_id)
    except HTTPException as e:
        # Return empty result if task not found
        return {"task_id": task_id, "status": "pending", "keywords": []}

    # Ensure keywords array exists
    if "keywords" not in result or result["keywords"] is None:
        result["keywords"] = []

    return result