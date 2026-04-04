from fastapi import FastAPI
from pydantic import BaseModel
import os
import httpx
import hashlib

app = FastAPI()

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


@app.get("/backend-url")
async def backend_url():
    url = await resolve_backend_url()
    return {"backendUrl": url}


@app.post("/embed")
async def get_embedding(request: BioRequest):
    text = request.text.encode("utf-8")
    digest = hashlib.sha256(text).digest()
    embedding = []
    for i in range(0, 384):
        idx = i % len(digest)
        val = digest[idx]
        embedding.append((val / 255.0) * 2 - 1)
    return {"embedding": embedding}


@app.get("/ping")
async def ping():
    return {"status": "ok", "mode": "engine"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8000)))
