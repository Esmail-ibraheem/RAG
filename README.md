# RAG

```
RAG/
  backend/
    rag_core.py        # your current logic, cleaned from Streamlit
    api.py             # FastAPI app
  utils/
    custom_converters.py   # stays as-is
  frontend/
    index.html
    app.js
    styles.css
  chat_history.db      # your existing SQLite DB
  requirements.txt
```
---

## Run backend

```
cd RAG
uvicorn backend.api:app --reload --host 0.0.0.0 --port 8000

```

Now you have:

POST /config – set OpenAI key + model.

POST /rag/upload – upload + index docs for RAG; response includes file names to use later.

POST /bm25/upload – upload + index docs for BM25.

POST /chats – create a chat (equivalent to “New Chat”).

GET /chats – list existing chats.

GET /chats/{id}/messages – fetch history.

POST /rag/ask – send a message and get the full answer.

POST /bm25/search – plain BM25 search.


---

## to do
1. Transform the Streamlit into a real website
2. make it to fetch websites' info with the document features
3. add voice commands
