# app/routers/document_router.py

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session

from app.services.document_service import (
    upload_document,
    get_user_documents,
    get_document_by_id,
    delete_document
)
from app.database import get_db
from app.schemas.document import DocumentResponse
from app.utils.logger import get_logger

logger = get_logger("document_router")

router = APIRouter(prefix="/documents", tags=["Documents"])


# ------------------------------------------------------------
# Upload Document  (TEMP: no authentication)
# ------------------------------------------------------------
@router.post("/upload", response_model=DocumentResponse)
def upload_doc(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    logger.info(f"Upload request received: filename='{file.filename}', content_type='{file.content_type}'")
    try:
        user_id = 1   # TEMPORARY — will replace with JWT later
        result = upload_document(db, file, user_id)
        logger.info(f"Document uploaded successfully: id={result.id}, filename='{result.filename}'")
        return result
    except HTTPException as e:
        logger.warning(f"Upload rejected: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during upload of '{file.filename}': {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


# ------------------------------------------------------------
# Get All Documents for User  (TEMP: no authentication)
# ------------------------------------------------------------
@router.get("/", response_model=list[DocumentResponse])
def list_user_docs(
    db: Session = Depends(get_db)
):
    logger.info("Fetching documents for user_id=1")
    try:
        user_id = 1   # TEMPORARY
        docs = get_user_documents(db, user_id)
        logger.info(f"Returned {len(docs)} documents.")
        return docs
    except Exception as e:
        logger.error(f"Failed to fetch documents: {e}")
        raise HTTPException(status_code=500, detail=f"Could not retrieve documents: {str(e)}")


# ------------------------------------------------------------
# Get Single Document  (TEMP: no authentication)
# ------------------------------------------------------------
@router.get("/{doc_id}", response_model=DocumentResponse)
def get_doc(
    doc_id: int,
    db: Session = Depends(get_db)
):
    logger.info(f"Fetching document id={doc_id}")
    try:
        doc = get_document_by_id(doc_id, db)
        logger.info(f"Document found: id={doc_id}")
        return doc
    except HTTPException as e:
        logger.warning(f"Document id={doc_id} not found: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Failed to fetch document id={doc_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Could not retrieve document: {str(e)}")


# ------------------------------------------------------------
# Delete Document  (TEMP: no authentication)
# ------------------------------------------------------------
@router.delete("/{doc_id}")
def remove_doc(
    doc_id: int,
    db: Session = Depends(get_db)
):
    logger.info(f"Delete request for document id={doc_id}")
    try:
        result = delete_document(doc_id, db)
        logger.info(f"Document id={doc_id} deleted successfully.")
        return result
    except HTTPException as e:
        logger.warning(f"Delete failed for id={doc_id}: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error deleting document id={doc_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")
