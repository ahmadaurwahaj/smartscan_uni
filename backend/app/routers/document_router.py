# app/routers/document_router.py

from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session

from app.services.document_service import (
    upload_document,
    get_user_documents,
    get_document_by_id,
    delete_document
)
from app.database import get_db
from app.schemas.document import DocumentResponse


router = APIRouter(prefix="/documents", tags=["Documents"])


# ------------------------------------------------------------
# Upload Document  (TEMP: no authentication)
# ------------------------------------------------------------
@router.post("/upload", response_model=DocumentResponse)
def upload_doc(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    user_id = 1   # TEMPORARY — will replace with JWT later
    return upload_document(db, file, user_id)


# ------------------------------------------------------------
# Get All Documents for User  (TEMP: no authentication)
# ------------------------------------------------------------
@router.get("/", response_model=list[DocumentResponse])
def list_user_docs(
    db: Session = Depends(get_db)
):
    user_id = 1   # TEMPORARY
    return get_user_documents(db, user_id)


# ------------------------------------------------------------
# Get Single Document  (TEMP: no authentication)
# ------------------------------------------------------------
@router.get("/{doc_id}", response_model=DocumentResponse)
def get_doc(
    doc_id: int,
    db: Session = Depends(get_db)
):
    return get_document_by_id(doc_id, db)


# ------------------------------------------------------------
# Delete Document  (TEMP: no authentication)
# ------------------------------------------------------------
@router.delete("/{doc_id}")
def remove_doc(
    doc_id: int,
    db: Session = Depends(get_db)
):
    return delete_document(doc_id, db)
