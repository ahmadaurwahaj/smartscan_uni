# app/services/document_service.py

import os
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException

from app.models.document import Document
from app.schemas.document import DocumentResponse
from app.utils.text_extraction import extract_text_from_file
from app.utils.logger import get_logger

logger = get_logger("document_service")

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)


# ------------------------------------------------------------
# Upload & Extract Text
# ------------------------------------------------------------
def upload_document(db: Session, file: UploadFile, user_id: int):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    logger.debug(f"Saving file to: {file_path}")

    try:
        with open(file_path, "wb") as f:
            f.write(file.file.read())
        logger.debug(f"File saved successfully: {file_path}")
    except Exception as e:
        logger.error(f"Failed to save file '{file.filename}': {e}")
        raise HTTPException(status_code=500, detail="Could not save the uploaded file. Please try again.")

    file_type = file.filename.split(".")[-1].lower()
    file_size_kb = os.path.getsize(file_path) // 1024
    logger.debug(f"File type: {file_type}, size: {file_size_kb} KB")

    text_file_path = f"{file_path}.txt"
    logger.debug(f"Extracting text from: {file_path}")
    try:
        text_content = extract_text_from_file(file_path)
        logger.debug(f"Text extracted, length={len(text_content) if text_content else 0} chars")
        with open(text_file_path, "w", encoding="utf-8") as tf:
            tf.write(text_content or "")
        logger.debug(f"Extracted text saved to: {text_file_path}")
    except Exception as e:
        logger.error(f"Text extraction or saving failed for '{file.filename}': {e}")
        raise HTTPException(status_code=500, detail="Could not extract and save text from the document.")

    try:
        doc = Document(
            filename=file.filename,
            filepath=file_path,
            file_type=file_type,
            size_kb=file_size_kb,
            owner_id=user_id,
            status="uploaded"
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        logger.debug(f"Document record saved to DB: id={doc.id}")
    except Exception as e:
        logger.error(f"Database error saving document '{file.filename}': {e}")
        raise HTTPException(status_code=500, detail="Could not save document record. Please try again.")

    return DocumentResponse.model_validate(doc)


# ------------------------------------------------------------
# Get All Documents for User
# ------------------------------------------------------------
def get_user_documents(db: Session, user_id: int):
    try:
        docs = db.query(Document).filter(Document.owner_id == user_id).all()
        logger.debug(f"Queried {len(docs)} documents for user_id={user_id}")
        return [DocumentResponse.model_validate(doc) for doc in docs]
    except Exception as e:
        logger.error(f"DB query failed for user_id={user_id}: {e}")
        raise


# ------------------------------------------------------------
# Get Raw Document Model (for internal use)
# ------------------------------------------------------------
def get_document_model(doc_id: int, db: Session):
    try:
        doc = db.query(Document).filter(Document.id == doc_id).first()
    except Exception as e:
        raise HTTPException(status_code=500, detail="Could not retrieve document.")
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


# ------------------------------------------------------------
# Get Single Document by ID
# ------------------------------------------------------------
def get_document_by_id(doc_id: int, db: Session):
    try:
        doc = db.query(Document).filter(Document.id == doc_id).first()
    except Exception as e:
        logger.error(f"DB query failed for document id={doc_id}: {e}")
        raise HTTPException(status_code=500, detail="Could not retrieve document.")

    if not doc:
        logger.warning(f"Document id={doc_id} not found.")
        raise HTTPException(status_code=404, detail="Document not found")

    return DocumentResponse.model_validate(doc)


# ------------------------------------------------------------
# Delete Document
# ------------------------------------------------------------
def delete_document(doc_id: int, db: Session):
    try:
        doc = db.query(Document).filter(Document.id == doc_id).first()
    except Exception as e:
        logger.error(f"DB query failed when deleting document id={doc_id}: {e}")
        raise HTTPException(status_code=500, detail="Could not delete document. Please try again.")

    if not doc:
        logger.warning(f"Delete attempted on non-existent document id={doc_id}")
        raise HTTPException(status_code=404, detail="Document not found")

    if os.path.exists(doc.filepath):
        try:
            os.remove(doc.filepath)
            logger.debug(f"File deleted from disk: {doc.filepath}")
        except Exception as e:
            logger.warning(f"Could not delete file from disk: {doc.filepath}: {e}")

    text_file_path = f"{doc.filepath}.txt"
    if os.path.exists(text_file_path):
        try:
            os.remove(text_file_path)
            logger.debug(f"Text file deleted from disk: {text_file_path}")
        except Exception as e:
            logger.warning(f"Could not delete text file from disk: {text_file_path}: {e}")

    try:
        db.delete(doc)
        db.commit()
        logger.debug(f"Document id={doc_id} removed from DB.")
    except Exception as e:
        logger.error(f"DB error deleting document id={doc_id}: {e}")
        raise HTTPException(status_code=500, detail="Could not delete document. Please try again.")

    return {"message": "Document deleted successfully"}
