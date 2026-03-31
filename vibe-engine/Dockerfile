FROM python:3.12-slim AS build
WORKDIR /app

# Install build dependencies only for the installation phase
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

COPY vibe-engine/requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Production stage only contains runtime artifact
FROM python:3.12-slim
WORKDIR /app
COPY --from=build /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=build /usr/local/bin /usr/local/bin
COPY vibe-engine .

# Do not include HuggingFace model cache in image (download at runtime)
ENV TRANSFORMERS_CACHE=/tmp/.cache/huggingface/transformers

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
