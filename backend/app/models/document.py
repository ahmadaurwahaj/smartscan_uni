# app/models/document.py

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    filepath = Column(String(500), nullable=False)
    file_type = Column(String(20))
    size_kb = Column(Integer)

    # NEW FIELD (important for analysis)
    text_content = Column(Text, nullable=True)

    owner_id = Column(Integer, nullable=False)

    status = Column(String(50), default="uploaded")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    keyword_stats = relationship("KeywordStat", back_populates="document", cascade="all, delete-orphan")
    analysis_task = relationship("AnalysisTask", uselist=False, back_populates="document", cascade="all, delete-orphan")
