# API image only — database runs in Compose (see docker-compose.yml).
# Build from project root: docker build -t smart-backend -f backend/Dockerfile backend/
# Run with Compose: docker compose up --build

FROM python:3.12-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Copy requirements file (now relative to backend/ directory)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source (now relative to backend/ directory)
COPY . /app/

RUN mkdir -p app/static/uploads uploads

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
