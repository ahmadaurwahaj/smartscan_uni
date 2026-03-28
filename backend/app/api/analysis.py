# app/api/analysis.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.analysis_service import create_analysis_task, process_analysis_task, get_analysis_result

router = APIRouter(prefix="/analysis", tags=["analysis"])

# -------------------------------
# Start analysis for a document
# -------------------------------
@router.post("/start/{document_id}")
def start_analysis(document_id: int, user_id: int = 1, db: Session = Depends(get_db)):
    """
    Start analysis task for a document.
    user_id=1 is just for testing, replace with real auth.
    """
    try:
        task = create_analysis_task(db, document_id, user_id)
        # Immediately process task (synchronous)
        result = process_analysis_task(db, task.id)
        return {"task_id": task.task_id, "message": "Analysis started and completed"}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# -------------------------------
# Get analysis result
# -------------------------------
@router.get("/result/{task_id}")
def analysis_result(task_id: str, db: Session = Depends(get_db)):
    try:
        return get_analysis_result(db, task_id)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))