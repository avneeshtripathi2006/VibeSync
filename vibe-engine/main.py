from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import os
import httpx
import re
from functools import lru_cache

app = FastAPI()
# This model outputs 384-dimensional semantic vectors
model = SentenceTransformer('all-MiniLM-L6-v2')

BACKEND_HEALTH_PATH = "/actuator/health"


def _candidates() -> list[str]:
    forced = (os.getenv("FORCE_BACKEND_URL") or "").strip()
    if forced:
        return [forced]
    local = (os.getenv("LOCAL_BACKEND_URL") or "http://localhost:8080").strip()
    remote = (os.getenv("BACKEND_URL") or "").strip()
    out = [local]
    if remote and remote not in out:
        out.append(remote)
    return out


async def resolve_backend_url() -> str:
    candidates = _candidates()
    for candidate in candidates:
        try:
            async with httpx.AsyncClient(timeout=1.0, verify=True) as client:
                r = await client.get(f"{candidate.rstrip('/')}{BACKEND_HEALTH_PATH}")
                if r.status_code < 400:
                    return candidate.rstrip("/")
        except Exception:
            continue
    if len(candidates) == 1:
        return candidates[0].rstrip("/")
    return candidates[-1].rstrip("/")


class BioRequest(BaseModel):
    text: str


def normalize_profile_text(text: str) -> str:
    raw = (text or "")[:4000]
    cleaned = re.sub(r"\s+", " ", raw.replace("\n", " ")).strip()
    return cleaned if cleaned else "empty profile"


@lru_cache(maxsize=2048)
def embed_cached(normalized_text: str) -> list[float]:
    return model.encode(normalized_text).tolist()


@app.get("/backend-url")
async def backend_url():
    url = await resolve_backend_url()
    return {"backendUrl": url}


@app.post("/embed")
async def get_embedding(request: BioRequest):
    text = normalize_profile_text(request.text)
    embedding = embed_cached(text)
    return {"embedding": embedding}


@app.get("/ping")
async def ping():
    return {"status": "ok", "mode": "engine"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
