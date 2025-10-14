FROM python:3.11-slim

WORKDIR /app

# Preinstall system libraries needed for building and WeasyPrint
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Expose HTTPS port
EXPOSE 1001

CMD ["uvicorn", "backend.ChatAuth.index:app", "--host", "0.0.0.0", "--port", "1001"]
