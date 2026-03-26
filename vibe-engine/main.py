from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import os
import httpx

app = FastAPI()
# This is the "Brain" - it converts text to numbers
model = SentenceTransformer('all-MiniLM-L6-v2')

# Local/remote backend URL policies
DEFAULT_LOCAL_BACKEND = "http://localhost:8080"
DEFAULT_REMOTE_BACKEND = os.getenv("BACKEND_URL", "https://vibesync-zc9a.onrender.com")
BACKEND_HEALTH_PATH = "/actuator/health"

async def resolve_backend_url() -> str:
    # Environment override (highest priority)
    forced = os.getenv("FORCE_BACKEND_URL")
    if forced:
        return forced

    # Prioritize localhost if available
    candidates = [DEFAULT_LOCAL_BACKEND, DEFAULT_REMOTE_BACKEND]

    for candidate in candidates:
        try:
            async with httpx.AsyncClient(timeout=1.0, verify=False) as client:
                r = await client.get(f"{candidate}{BACKEND_HEALTH_PATH}")
                if r.status_code < 400:
                    return candidate
        except Exception:
            continue

    # Fallback to remote if local is unavailable
    return DEFAULT_REMOTE_BACKEND

class BioRequest(BaseModel):
    text: str

@app.get("/backend-url")
async def backend_url():
    url = await resolve_backend_url()
    return {"backendUrl": url}

@app.post("/embed")
async def get_embedding(request: BioRequest):
    # This turns the bio into 384 numbers!
    embedding = model.encode(request.text).tolist()
    return {"embedding": embedding}

@app.get("/ping")
async def ping():
    return {"status": "ok", "mode": "engine"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
