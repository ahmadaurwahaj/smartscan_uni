# app/models/analysis_task.py

# app/models/analysis_task.py

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class AnalysisTask(Base):
    __tablename__ = "analysis_tasks"

    id = Column(Integer, primary_key=True, index=True)

    task_id = Column(String(255), unique=True, nullable=False)
    status = Column(String(50), default="pending")
    progress = Column(Integer, default=0)

    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)

    # FIXED: relationship back to Document
    document = relationship("Document", back_populates="analysis_task")

    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
