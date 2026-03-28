# app/utils/text_extraction.py

# app/utils/text_extraction.py

# app/utils/text_extraction.py

# app/utils/text_extraction.py

from PyPDF2 import PdfReader
import docx
import os


def extract_text_from_file(filepath: str) -> str:
    """
    Detect file extension and extract text.
    """

    ext = os.path.splitext(filepath)[1].lower().replace(".", "")

    try:
        if ext == "pdf":
            return extract_pdf(filepath)
        elif ext == "docx":
            return extract_docx(filepath)
        elif ext == "txt":
            return extract_txt(filepath)
        else:
            return ""
    except Exception as e:
        print("TEXT EXTRACTION ERROR:", e)
        return ""


def extract_pdf(filepath: str) -> str:
    text = ""
    reader = PdfReader(filepath)
    for page in reader.pages:
        text += page.extract_text() or ""
    return text


def extract_docx(filepath: str) -> str:
    doc = docx.Document(filepath)
    return "\n".join([p.text for p in doc.paragraphs])


def extract_txt(filepath: str) -> str:
    with open(filepath, "r", errors="ignore") as f:
        return f.read()
