from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

app = FastAPI()
# This is the "Brain" - it converts text to numbers
model = SentenceTransformer('all-MiniLM-L6-v2')

class BioRequest(BaseModel):
    text: str

@app.post("/embed")
async def get_embedding(request: BioRequest):
    # This turns the bio into 384 numbers!
    embedding = model.encode(request.text).tolist()
    return {"embedding": embedding}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)