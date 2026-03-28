# app/utils/keyword_analysis.py

import re
from collections import Counter

def extract_keywords(text: str):
    if not text:
        return {}

    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    freq = Counter(words)

    return dict(freq)
