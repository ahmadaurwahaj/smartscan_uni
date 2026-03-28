# app/models/keyword_stat.py

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class KeywordStat(Base):
    __tablename__ = "keyword_stats"

    id = Column(Integer, primary_key=True, index=True)
    keyword = Column(String(255), nullable=False)
    count = Column(Integer, nullable=False)

    document_id = Column(Integer, ForeignKey("documents.id"))
    document = relationship("Document", back_populates="keyword_stats")

