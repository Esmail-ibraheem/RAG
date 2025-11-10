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

## to do
1. Transform the Streamlit into a real website
2. make it to fetch websites' info with the document features
3. add voice commands
