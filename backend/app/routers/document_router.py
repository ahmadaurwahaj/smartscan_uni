# app/routers/document_router.py

import os
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.services.document_service import (
    upload_document,
    get_user_documents,
    get_document_by_id,
    delete_document,
    get_document_model
)
from app.database import get_db
from app.schemas.document import DocumentResponse
from app.services.auth_service import get_current_user
from app.models.user import User
from app.utils.logger import get_logger

logger = get_logger("document_router")

router = APIRouter(prefix="/documents", tags=["Documents"])


# ------------------------------------------------------------
# Upload Document
# ------------------------------------------------------------
@router.post("/upload", response_model=DocumentResponse)
def upload_doc(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.info(f"Upload request: user_id={current_user.id}, filename='{file.filename}'")
    try:
        result = upload_document(db, file, current_user.id)
        logger.info(f"Document uploaded: id={result.id}, filename='{result.filename}'")
        return result
    except HTTPException as e:
        logger.warning(f"Upload rejected: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during upload of '{file.filename}': {e}")
        raise HTTPException(status_code=500, detail="Upload failed. Please try again.")


# ------------------------------------------------------------
# Get All Documents for Current User
# ------------------------------------------------------------
@router.get("/", response_model=list[DocumentResponse])
def list_user_docs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.info(f"Fetching documents for user_id={current_user.id}")
    try:
        docs = get_user_documents(db, current_user.id)
        logger.info(f"Returned {len(docs)} documents for user_id={current_user.id}")
        return docs
    except Exception as e:
        logger.error(f"Failed to fetch documents: {e}")
        raise HTTPException(status_code=500, detail="Could not retrieve documents. Please try again.")


# ------------------------------------------------------------
# Get Single Document
# ------------------------------------------------------------
@router.get("/{doc_id}", response_model=DocumentResponse)
def get_doc(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.info(f"Fetching document id={doc_id} for user_id={current_user.id}")
    try:
        doc = get_document_model(doc_id, db)
        if doc.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied.")
        return doc
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch document id={doc_id}: {e}")
        raise HTTPException(status_code=500, detail="Could not retrieve document. Please try again.")


# ------------------------------------------------------------
# Delete Document
# ------------------------------------------------------------
@router.get("/{doc_id}/download")
def download_doc(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.info(f"Download request: document id={doc_id}, user_id={current_user.id}")
    doc = get_document_model(doc_id, db)
    if doc.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")
    if not os.path.exists(doc.filepath):
        raise HTTPException(status_code=404, detail="File not found on server.")
    return FileResponse(doc.filepath, filename=doc.filename, media_type="application/octet-stream")


@router.get("/{doc_id}/text")
def get_doc_text(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.info(f"Text preview request: document id={doc_id}, user_id={current_user.id}")
    doc = get_document_model(doc_id, db)
    if doc.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")
    return {"text": doc.text_content or "No text could be extracted from this document."}


@router.delete("/{doc_id}")
def remove_doc(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.info(f"Delete request: document id={doc_id}, user_id={current_user.id}")
    try:
        doc = get_document_model(doc_id, db)
        if doc.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied.")
        result = delete_document(doc_id, db)
        logger.info(f"Document id={doc_id} deleted.")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error deleting document id={doc_id}: {e}")
        raise HTTPException(status_code=500, detail="Could not delete document. Please try again.")
