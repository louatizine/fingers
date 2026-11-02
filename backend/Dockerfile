FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc iputils-ping \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5559

# gthread: SSE / long requests occupy one thread, not the whole process.
# Multiple workers keep /api responsive when notification streams are open.
CMD ["gunicorn", "--bind", "0.0.0.0:5559", "--worker-class", "gthread", "--workers", "3", "--threads", "8", "--timeout", "120", "app:create_app()"]
