FROM python:3.11-alpine

WORKDIR /app

# Install dependencies needed to build Python packages
RUN apk add --no-cache \
    build-base \
    postgresql-dev \
    curl

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend application
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]