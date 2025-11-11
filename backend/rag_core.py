# backend/rag_core.py

from haystack import Pipeline
from haystack.document_stores.in_memory import InMemoryDocumentStore
from haystack.components.converters import PyPDFToDocument
from haystack.components.converters.txt import TextFileToDocument
from haystack.components.preprocessors import DocumentCleaner, DocumentSplitter
from haystack.components.writers import DocumentWriter
from haystack.components.embedders import OpenAIDocumentEmbedder, OpenAITextEmbedder
from haystack.components.joiners import DocumentJoiner
from haystack.utils import Secret
from haystack.components.retrievers.in_memory import (
    InMemoryEmbeddingRetriever,
    InMemoryBM25Retriever,
)

from .utils.custom_converters import DocxToTextConverter, ExcelToTextConverter

from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    ForeignKey,
    DateTime,
    Text,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict, Any

import openai
import concurrent.futures
import os


# ================
# DB MODELS (same as before)
# ================

Base = declarative_base()


class Chat(Base):
    __tablename__ = "chats"
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False, unique=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    messages = relationship("Message", back_populates="chat")


class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True)
    role = Column(String, nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    chat_id = Column(Integer, ForeignKey("chats.id"))
    chat = relationship("Chat", back_populates="messages")


engine = create_engine("sqlite:///chat_history.db")
Base.metadata.create_all(engine)
SessionLocal = sessionmaker(bind=engine)


# ================
# GLOBAL STATE (doc stores + OpenAI configuration)
# ================

_document_store_rag = InMemoryDocumentStore(embedding_similarity_function="cosine")
_document_store_bm25 = InMemoryDocumentStore()

_selected_model = "gpt-4o-mini"  # default, can be changed via API


def set_openai_config(api_key: str, model_name: Optional[str] = None):
    """
    Configure OpenAI globally for this process.
    Call this once from your API after user provides key/model.
    """
    global _selected_model
    openai.api_key = api_key
    if model_name:
        _selected_model = model_name


def get_doc_store_rag() -> InMemoryDocumentStore:
    return _document_store_rag


def get_doc_store_bm25() -> InMemoryDocumentStore:
    return _document_store_bm25


# ================
# INDEXING (RAG + BM25)
# ================

def _build_converter_for_path(path: Path):
    suffix = path.suffix.lower()
    if suffix == ".docx":
        return DocxToTextConverter()
    elif suffix in [".txt", ".csv"]:
        return TextFileToDocument()
    elif suffix == ".xlsx":
        return ExcelToTextConverter()
    else:
        return PyPDFToDocument()


def index_rag_paths(paths: List[Path]):
    """
    Equivalent to your old write_documents_rag, but works on already-saved files.
    """
    document_store_rag = get_doc_store_rag()

    for path in paths:
        pipeline = Pipeline()
        pipeline.add_component("converter", _build_converter_for_path(path))
        pipeline.add_component("cleaner", DocumentCleaner())
        pipeline.add_component(
            "splitter", DocumentSplitter(split_by="word", split_length=350)
        )
        pipeline.add_component(
            "embedder",
            OpenAIDocumentEmbedder(api_key=Secret.from_token(openai.api_key)),
        )
        pipeline.add_component("writer", DocumentWriter(document_store=document_store_rag))

        pipeline.connect("converter", "cleaner")
        pipeline.connect("cleaner", "splitter")
        pipeline.connect("splitter", "embedder")
        pipeline.connect("embedder.documents", "writer")

        pipeline.run({"converter": {"sources": [path]}})


def index_bm25_paths(paths: List[Path]):
    """
    Equivalent to your old write_documents_bm25, no embeddings.
    """
    document_store_bm25 = get_doc_store_bm25()

    for path in paths:
        pipeline = Pipeline()
        pipeline.add_component("converter", _build_converter_for_path(path))
        pipeline.add_component("cleaner", DocumentCleaner())
        pipeline.add_component(
            "splitter", DocumentSplitter(split_by="word", split_length=350)
        )
        pipeline.add_component("writer", DocumentWriter(document_store=document_store_bm25))

        pipeline.connect("converter", "cleaner")
        pipeline.connect("cleaner", "splitter")
        pipeline.connect("splitter", "writer")

        pipeline.run({"converter": {"sources": [path]}})


# ================
# CHUNKING (for summaries)
# ================

def chunk_documents(file_names: List[str], uploads_dir: Path = Path("uploads_rag")) -> List[str]:
    """
    Your old chunk_documents, but takes file names and re-opens them from uploads_rag.
    """
    chunks: List[str] = []
    for fname in file_names:
        path = uploads_dir / fname
        if not path.exists():
            continue

        pipeline = Pipeline()
        pipeline.add_component("converter", _build_converter_for_path(path))
        pipeline.add_component("cleaner", DocumentCleaner())
        pipeline.add_component(
            "splitter", DocumentSplitter(split_by="word", split_length=3000)
        )
        pipeline.connect("converter", "cleaner")
        pipeline.connect("cleaner", "splitter")

        docs = pipeline.run({"converter": {"sources": [path]}})
        chunks.extend([d.content for d in docs["splitter"]["documents"]])
    return chunks


# ================
# RETRIEVER PIPELINE (hybrid RAG)
# ================

def query_pipeline_func(query: str):
    """
    Same as your old query_pipeline_func: hybrid retrieval + RRF.
    """
    document_store_rag = get_doc_store_rag()

    qp = Pipeline()
    qp.add_component(
        "text_embedder", OpenAITextEmbedder(Secret.from_token(openai.api_key))
    )
    qp.add_component(
        "retriever",
        InMemoryEmbeddingRetriever(document_store=document_store_rag, top_k=4),
    )
    qp.add_component(
        "bm25_retriever",
        InMemoryBM25Retriever(document_store=document_store_rag, top_k=4),
    )
    qp.add_component(
        "joiner",
        DocumentJoiner(
            join_mode="reciprocal_rank_fusion", top_k=4, sort_by_score=True
        ),
    )

    qp.connect("text_embedder.embedding", "retriever.query_embedding")
    qp.connect("bm25_retriever", "joiner")
    qp.connect("retriever", "joiner")

    result = qp.run(
        {"text_embedder": {"text": query}, "bm25_retriever": {"query": query}}
    )
    return result["joiner"]["documents"]


# ================
# ROUTER + TOOLS (using OpenAI)
# ================

def query_router_func(query: str) -> str:
    """
    Same logic as before. Returns "(1)", "(2)" or "(3)".
    """
    system = """You are a professional decision making query router bot for a chatbot system that decides whether a user's query requires a summary,  
requires context, or is a simple follow up that requires neither."""

    instruction = f"""Given a user's query, respond with ONLY ONE of these numbers:
(1) if the query requires a summary of multiple documents
(2) if the query requires context from documents to answer
(3) if the query is a simple follow up, greeting, or gratitude that requires neither summary nor context

Here is the query: {query}"""

    client = openai.OpenAI(api_key=openai.api_key)
    response = client.chat.completions.create(
        model=_selected_model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": instruction},
        ],
    )
    return response.choices[0].message.content


def context_tool_func(query: str):
    """
    Same as before, but no Streamlit. Yields chunks in the same dict format.
    """
    context_docs = query_pipeline_func(query)
    context = [c.content for c in context_docs]

    system = """You are a professional Q/A responder for a chatbot system.  
You are responsible for responding to a user query using ONLY the context provided within the <context> tags."""

    instruction = f"""You are given a user's query in the <query> field. Respond appropriately to the user's input using only the context
in the <context> field:\n <query>{query}</query>\n <context>{context}</context>"""

    client = openai.OpenAI(api_key=openai.api_key)
    stream = client.chat.completions.create(
        model=_selected_model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": instruction},
        ],
        stream=True,
    )

    for chunk in stream:
        if chunk.choices[0].delta.content is not None:
            yield {"replies": [{"content": chunk.choices[0].delta.content}]}


def simple_responder_func(query: str):
    system = """You are a professional greeting/gratitude/salutation/ follow up responder for a chatbot system.  
You are responsible for responding to simple queries that do not require context or summaries."""

    instruction = f"""Given a user's simple query, respond appropriately and professionally.
Here is the query: {query}"""

    client = openai.OpenAI(api_key=openai.api_key)
    stream = client.chat.completions.create(
        model=_selected_model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": instruction},
        ],
        stream=True,
    )

    for chunk in stream:
        if chunk.choices[0].delta.content is not None:
            yield {"replies": [{"content": chunk.choices[0].delta.content}]}


def map_summarizer_func(query: str, chunk_text: str) -> str:
    system = """You are a professional corpus summarizer for a chatbot system.  
You are responsible for summarizing a chunk of text based on a user's query."""

    instruction = f"""You are given a user's query in the <query> field and a chunk of text in the <chunk> field.  
Summarize the chunk of text based on the user's query:\n <query>{query}</query>\n <chunk>{chunk_text}</chunk>"""

    client = openai.OpenAI(api_key=openai.api_key)
    response = client.chat.completions.create(
        model=_selected_model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": instruction},
        ],
    )
    return response.choices[0].message.content


def reduce_summarizer_func(query: str, analyses: List[str]):
    system = """You are a professional corpus summarizer for a chatbot system.  
You are responsible for combining multiple summaries into a final summary based on a user's query."""

    instruction = f"""You are given a user's query in the <query> field and a list of summaries in the <summaries> field.  
Combine these summaries into a final summary that answers the user's query:\n <query>{query}</query>\n <summaries>{analyses}</summaries>"""

    client = openai.OpenAI(api_key=openai.api_key)
    stream = client.chat.completions.create(
        model=_selected_model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": instruction},
        ],
        stream=True,
    )

    for chunk in stream:
        if chunk.choices[0].delta.content is not None:
            yield {"replies": [{"content": chunk.choices[0].delta.content}]}


def summary_tool_func(query: str, file_names: List[str]):
    """
    Your old summary_tool_func, adapted to use file names.
    """
    chunks = chunk_documents(file_names)
    analyses: List[str] = []

    with concurrent.futures.ThreadPoolExecutor() as executor:
        futures = [executor.submit(map_summarizer_func, query, ch) for ch in chunks]
        for future in concurrent.futures.as_completed(futures):
            analyses.append(future.result())

    for chunk in reduce_summarizer_func(query, analyses):
        yield chunk


# ================
# RAG AGENT
# ================

class RAGAgent:
    """
    Same logic as before, but without Streamlit.
    """

    def __init__(self):
        self.loops = 0

    def invoke_agent(self, query: str, file_names: Optional[List[str]] = None):
        intent_response = query_router_func(query)
        intent = intent_response.strip()
        file_names = file_names or []

        if intent == "(1)":
            # Summary
            for chunk in summary_tool_func(query, file_names):
                if chunk["replies"][0]["content"]:
                    yield chunk
        elif intent == "(2)":
            # Contextual RAG
            for chunk in context_tool_func(query):
                if chunk["replies"][0]["content"]:
                    yield chunk
        elif intent == "(3)":
            # Simple follow-up
            for chunk in simple_responder_func(query):
                if chunk["replies"][0]["content"]:
                    yield chunk
        else:
            yield {"replies": [{"content": "I'm not sure how to help with that."}]}


# ================
# CHAT HELPERS (DB)
# ================

def create_chat() -> Chat:
    db = SessionLocal()
    count = db.query(Chat).count()
    new_chat = Chat(name=f"Chat {count + 1}")
    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)
    db.close()
    return new_chat


def list_chats() -> List[Dict[str, Any]]:
    db = SessionLocal()
    chats = db.query(Chat).order_by(Chat.timestamp.desc()).all()
    out = [
        {
            "id": c.id,
            "name": c.name,
            "timestamp": c.timestamp.isoformat(),
        }
        for c in chats
    ]
    db.close()
    return out


def get_chat_messages(chat_id: int) -> List[Dict[str, Any]]:
    db = SessionLocal()
    msgs = (
        db.query(Message)
        .filter_by(chat_id=chat_id)
        .order_by(Message.timestamp)
        .all()
    )
    out = [
        {
            "role": m.role,
            "content": m.content,
            "timestamp": m.timestamp.isoformat(),
        }
        for m in msgs
    ]
    db.close()
    return out


def append_chat_exchange(chat_id: int, user_text: str, assistant_text: str):
    db = SessionLocal()
    m_user = Message(role="user", content=user_text, chat_id=chat_id)
    m_assistant = Message(role="assistant", content=assistant_text, chat_id=chat_id)
    db.add(m_user)
    db.add(m_assistant)
    db.commit()
    db.close()


def run_rag_chat(chat_id: int, query: str, file_names: Optional[List[str]] = None) -> str:
    """
    Helper that:
    - runs the RAGAgent
    - concatenates streamed chunks
    - stores messages in DB
    - returns the full assistant answer
    """
    agent = RAGAgent()
    full_response = ""

    for chunk in agent.invoke_agent(query, file_names or []):
        if isinstance(chunk, dict) and "replies" in chunk and chunk["replies"]:
            content = chunk["replies"][0]["content"]
            if content:
                full_response += content

    append_chat_exchange(chat_id, query, full_response)
    return full_response


def bm25_search(query: str, top_k: int = 5) -> List[str]:
    """
    Simple BM25 search (your BM25 Search mode).
    """
    document_store_bm25 = get_doc_store_bm25()
    bm25_retriever = InMemoryBM25Retriever(
        document_store=document_store_bm25, top_k=top_k
    )
    result_dict = bm25_retriever.run(query=query)
    docs = result_dict["documents"]
    return [doc.content for doc in docs]
