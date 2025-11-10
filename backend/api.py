# backend/api.py

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from pathlib import Path
import os

from .rag_core import (
    set_openai_config,
    index_rag_paths,
    index_bm25_paths,
    create_chat,
    list_chats,
    get_chat_messages,
    run_rag_chat,
    bm25_search,
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # in production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOADS_RAG_DIR = Path("uploads_rag")
UPLOADS_BM25_DIR = Path("uploads_bm25")
UPLOADS_RAG_DIR.mkdir(exist_ok=True)
UPLOADS_BM25_DIR.mkdir(exist_ok=True)


class ConfigRequest(BaseModel):
    api_key: str
    model_name: Optional[str] = "gpt-4o-mini"


class ChatCreateResponse(BaseModel):
    id: int
    name: str
    timestamp: str


class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: str


class AskRequest(BaseModel):
    chat_id: int
    query: str
    file_names: Optional[List[str]] = []  # names of files in uploads_rag


class AskResponse(BaseModel):
    answer: str


class BM25Request(BaseModel):
    query: str
    top_k: int = 5


@app.post("/config")
def configure(req: ConfigRequest):
    set_openai_config(req.api_key, req.model_name)
    return {"status": "ok"}


@app.post("/rag/upload")
async def upload_rag(files: List[UploadFile] = File(...)):
    paths = []
    for file in files:
        dest = UPLOADS_RAG_DIR / file.filename
        with dest.open("wb") as f:
            content = await file.read()
            f.write(content)
        paths.append(dest)

    if not paths:
        raise HTTPException(status_code=400, detail="No files uploaded")

    index_rag_paths(paths)
    return {"indexed": len(paths), "file_names": [p.name for p in paths]}


@app.post("/bm25/upload")
async def upload_bm25(files: List[UploadFile] = File(...)):
    paths = []
    for file in files:
        dest = UPLOADS_BM25_DIR / file.filename
        with dest.open("wb") as f:
            content = await file.read()
            f.write(content)
        paths.append(dest)

    if not paths:
        raise HTTPException(status_code=400, detail="No files uploaded")

    index_bm25_paths(paths)
    return {"indexed": len(paths), "file_names": [p.name for p in paths]}


@app.post("/chats", response_model=ChatCreateResponse)
def api_create_chat():
    chat = create_chat()
    return ChatCreateResponse(
        id=chat.id, name=chat.name, timestamp=chat.timestamp.isoformat()
    )


@app.get("/chats")
def api_list_chats():
    return list_chats()


@app.get("/chats/{chat_id}/messages", response_model=List[ChatMessage])
def api_get_chat_messages(chat_id: int):
    msgs = get_chat_messages(chat_id)
    return [ChatMessage(**m) for m in msgs]


@app.post("/rag/ask", response_model=AskResponse)
def api_rag_ask(req: AskRequest):
    # req.file_names should be a list of filenames that exist in uploads_rag
    answer = run_rag_chat(req.chat_id, req.query, req.file_names)
    return AskResponse(answer=answer)


@app.post("/bm25/search")
def api_bm25_search(req: BM25Request):
    docs = bm25_search(req.query, req.top_k)
    # you can expand this to return meta, etc.
    return {"results": [d[:200] + "..." for d in docs]}
