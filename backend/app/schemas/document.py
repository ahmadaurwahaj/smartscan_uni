from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List


# -------------------------
# Base Document Schema
# -------------------------
class DocumentBase(BaseModel):
    id: int
    filename: str
    file_type: str
    size_kb: int
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# -------------------------
# Document Upload Request
# -------------------------
class DocumentUpload(BaseModel):
    filename: str


# -------------------------
# Document Metadata Response
# -------------------------
class DocumentMetadata(DocumentBase):
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


# -------------------------
# Document List Response
# -------------------------
class DocumentListResponse(BaseModel):
    documents: List[DocumentMetadata]

    model_config = ConfigDict(from_attributes=True)


# -------------------------
# Document Response (Single)
# -------------------------
class DocumentResponse(DocumentMetadata):
    model_config = ConfigDict(from_attributes=True)
