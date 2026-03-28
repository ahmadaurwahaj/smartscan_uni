from collections import Counter
import re

def extract_keywords(text: str, limit: int = 20):
    if not text:
        return [], []

    words = re.findall(r"\b[a-zA-Z]{4,}\b", text.lower())
    freq = Counter(words).most_common(limit)

    keywords = [w for w, c in freq]
    counts = [c for w, c in freq]

    return keywords, counts
