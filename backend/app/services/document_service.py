# app/services/document_service.py

import os
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException

from app.models.document import Document
from app.schemas.document import DocumentResponse
from app.utils.text_extraction import extract_text_from_file   # required

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)


# ------------------------------------------------------------
# Upload & Extract Text
# ------------------------------------------------------------
def upload_document(db: Session, file: UploadFile, user_id: int):

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    # Save file to disk
    with open(file_path, "wb") as f:
        f.write(file.file.read())

    file_type = file.filename.split(".")[-1].lower()
    file_size_kb = os.path.getsize(file_path) // 1024

    # Extract text (PDF, DOCX, TXT)
    text_content = extract_text_from_file(file_path)

    # Save record
    doc = Document(
        filename=file.filename,
        filepath=file_path,
        file_type=file_type,
        size_kb=file_size_kb,
        text_content=text_content,
        owner_id=user_id,
        status="uploaded"
    )

    db.add(doc)
    db.commit()
    db.refresh(doc)

    return DocumentResponse.model_validate(doc)


# ------------------------------------------------------------
# Get All Documents for User
# ------------------------------------------------------------
def get_user_documents(db: Session, user_id: int):
    docs = db.query(Document).filter(Document.owner_id == user_id).all()
    return [DocumentResponse.model_validate(doc) for doc in docs]


# ------------------------------------------------------------
# Get Single Document by ID
# ------------------------------------------------------------
def get_document_by_id(doc_id: int, db: Session):
    doc = db.query(Document).filter(Document.id == doc_id).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    return DocumentResponse.model_validate(doc)


# ------------------------------------------------------------
# Delete Document
# ------------------------------------------------------------
def delete_document(doc_id: int, db: Session):
    doc = db.query(Document).filter(Document.id == doc_id).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete file from disk
    if os.path.exists(doc.filepath):
        os.remove(doc.filepath)

    db.delete(doc)
    db.commit()

    return {"message": "Document deleted successfully"}
