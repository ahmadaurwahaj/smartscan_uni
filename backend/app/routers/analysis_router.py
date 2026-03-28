from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.analysis_service import (
    create_analysis_task,
    process_analysis_task,
    get_analysis_result
)
from app.utils.logger import get_logger

logger = get_logger("analysis_router")

router = APIRouter(prefix="/analysis", tags=["Analysis"])


# Start analysis for a document
@router.post("/start/{document_id}")
def start_analysis(document_id: int, db: Session = Depends(get_db)):
    logger.info(f"Analysis start requested for document_id={document_id}")
    user_id = 1  # Temporary user

    try:
        AnalysisTask = getattr(__import__('app.models.analysis_task', fromlist=['AnalysisTask']), 'AnalysisTask')
        existing_task = db.query(AnalysisTask).filter(
            AnalysisTask.document_id == document_id
        ).first()

        if existing_task:
            logger.info(f"Existing analysis task found: task_id={existing_task.task_id}")
            task = existing_task
        else:
            logger.info(f"Creating new analysis task for document_id={document_id}")
            task = create_analysis_task(db, document_id, user_id)
            logger.info(f"Analysis task created: task_id={task.task_id}")

        logger.info(f"Processing task_id={task.task_id}")
        process_analysis_task(db, task.task_id)
        logger.info(f"Task task_id={task.task_id} completed successfully.")

        return {"task_id": task.task_id, "status": "completed"}

    except HTTPException as e:
        logger.warning(f"Analysis failed for document_id={document_id}: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during analysis for document_id={document_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


# Get analysis result
@router.get("/result/{task_id}")
def get_result(task_id: str, db: Session = Depends(get_db)):
    logger.info(f"Fetching result for task_id={task_id}")
    try:
        result = get_analysis_result(db, task_id)
        if "keywords" not in result or result["keywords"] is None:
            result["keywords"] = []
        logger.info(f"Result returned for task_id={task_id}, keywords={len(result.get('keywords', []))}")
        return result
    except HTTPException as e:
        logger.warning(f"Task not found: task_id={task_id}: {e.detail}")
        return {"task_id": task_id, "status": "pending", "keywords": []}
    except Exception as e:
        logger.error(f"Unexpected error fetching result for task_id={task_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Could not retrieve analysis result: {str(e)}")
