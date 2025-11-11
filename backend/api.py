# backend/api.py

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
from pathlib import Path
import os
import json

from .rag_core import (
    set_openai_config,
    index_rag_paths,
    index_bm25_paths,
    create_chat,
    list_chats,
    get_chat_messages,
    run_rag_chat,
    bm25_search,
    RAGAgent,
    append_chat_exchange,
    Chat,
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
    # Check if OpenAI is configured
    import openai as oai
    if not oai.api_key:
        raise HTTPException(
            status_code=400, 
            detail="OpenAI API key not configured. Please configure it first in the settings."
        )
    
    paths = []
    for file in files:
        dest = UPLOADS_RAG_DIR / file.filename
        with dest.open("wb") as f:
            content = await file.read()
            f.write(content)
        paths.append(dest)

    if not paths:
        raise HTTPException(status_code=400, detail="No files uploaded")

    try:
        index_rag_paths(paths)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to index documents: {str(e)}")
    
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


@app.delete("/chats/{chat_id}")
def api_delete_chat(chat_id: int):
    """Delete a chat and all its messages"""
    from .rag_core import SessionLocal
    db = SessionLocal()
    try:
        chat = db.query(Chat).filter_by(id=chat_id).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        db.delete(chat)
        db.commit()
        return {"status": "deleted", "chat_id": chat_id}
    finally:
        db.close()


@app.post("/rag/ask", response_model=AskResponse)
def api_rag_ask(req: AskRequest):
    """Non-streaming version for compatibility"""
    answer = run_rag_chat(req.chat_id, req.query, req.file_names)
    return AskResponse(answer=answer)


@app.post("/rag/ask-stream")
async def api_rag_ask_stream(req: AskRequest):
    """Streaming version for real-time responses"""
    async def generate():
        agent = RAGAgent()
        full_response = ""
        
        try:
            for chunk in agent.invoke_agent(req.query, req.file_names or []):
                if isinstance(chunk, dict) and "replies" in chunk and chunk["replies"]:
                    content = chunk["replies"][0]["content"]
                    if content:
                        full_response += content
                        yield f"data: {json.dumps({'content': content})}\n\n"
            
            # Save to database after streaming is complete
            append_chat_exchange(req.chat_id, req.query, full_response)
            yield f"data: {json.dumps({'done': True})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")


@app.post("/bm25/search")
def api_bm25_search(req: BM25Request):
    docs = bm25_search(req.query, req.top_k)
    # you can expand this to return meta, etc.
    return {"results": [d[:200] + "..." for d in docs]}
