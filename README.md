# Agentic RAG System 🤖

A modern, full-stack Retrieval-Augmented Generation (RAG) system with a beautiful React frontend and powerful FastAPI backend. Features hybrid search (RAG + BM25), chat history, and support for multiple document formats.

![RAG System](https://img.shields.io/badge/RAG-System-blue) ![React](https://img.shields.io/badge/React-18.2-61dafb) ![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.3-38bdf8)

<img width="3834" height="1768" alt="image" src="https://github.com/user-attachments/assets/0de5e627-a982-4173-afcd-13801cb150a3" />


## ✨ Features

- **🎨 Modern UI**: Beautiful React frontend with TailwindCSS and custom components
- **💬 Chat Interface**: Real-time chat with AI using RAG for context-aware responses
- **🔍 Hybrid Search**: Combines semantic search (embeddings) with BM25 for optimal results
- **📁 Multi-Format Support**: PDF, DOCX, TXT, XLSX, CSV files
- **💾 Chat History**: SQLite database for persistent conversation storage
- **🎯 Smart Routing**: Automatically determines if query needs summary, context, or simple response
- **📊 BM25 Search**: Traditional keyword-based search for quick lookups
- **🎨 Markdown Support**: Rich text rendering with code syntax highlighting

## 🏗️ Architecture

```
RAG/
├── backend/
│   ├── api.py                    # FastAPI application
│   ├── rag_core.py              # Core RAG logic
│   └── utils/
│       └── custom_converters.py # Document converters
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── ui/             # Reusable UI components
│   │   │   ├── ChatInterface.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── ConfigPanel.jsx
│   │   │   └── BM25Search.jsx
│   │   ├── lib/
│   │   │   ├── api.js          # API client
│   │   │   └── utils.js        # Utilities
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── uploads_rag/                 # RAG indexed documents
├── uploads_bm25/                # BM25 indexed documents
├── chat_history.db              # SQLite database
└── requirements.txt
```

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- OpenAI API Key

### Backend Setup

1. **Install Python dependencies**:
```bash
cd RAG
pip install -r requirements.txt
```

2. **Start the FastAPI server**:
```bash
uvicorn backend.api:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Install Node dependencies**:
```bash
cd frontend
npm install
```

2. **Create environment file** (optional):
```bash
cp .env.example .env
# Edit .env if you need to change the API base URL
```

3. **Start the development server**:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 📖 Usage

### 1. Configure OpenAI

- Open the application in your browser
- Enter your OpenAI API key in the Configuration panel
- Select your preferred model (GPT-4o Mini, GPT-4o, etc.)
- Click "Save Configuration"

### 2. Upload Documents

**For RAG (Semantic Search)**:
- Click "Select Files" under "RAG Documents"
- Choose your documents (PDF, DOCX, TXT, XLSX, CSV)
- Click "Upload & Index"
- Documents will be processed and embedded for semantic search

**For BM25 (Keyword Search)**:
- Click "Select Files" under "BM25 Documents"
- Choose your documents
- Click "Upload & Index"
- Documents will be indexed for keyword-based search

### 3. Start Chatting

- Click "+ New Chat" to create a conversation
- Type your question in the input field
- The AI will automatically:
  - Determine if you need a summary, context, or simple response
  - Retrieve relevant information from your documents
  - Generate a comprehensive answer

### 4. Use BM25 Search

- Switch to the "BM25 Search" tab
- Enter your search query
- Get quick keyword-based results from indexed documents

## 🔌 API Endpoints

### Configuration
- `POST /config` - Set OpenAI API key and model

### Chat Management
- `POST /chats` - Create a new chat
- `GET /chats` - List all chats
- `GET /chats/{chat_id}/messages` - Get chat history

### RAG Operations
- `POST /rag/upload` - Upload and index documents for RAG
- `POST /rag/ask` - Ask a question (non-streaming)
- `POST /rag/ask-stream` - Ask a question (streaming response)

### BM25 Operations
- `POST /bm25/upload` - Upload and index documents for BM25
- `POST /bm25/search` - Search documents using BM25

## 🎯 How It Works

### RAG Pipeline

1. **Document Processing**:
   - Documents are converted to text
   - Text is cleaned and split into chunks
   - Chunks are embedded using OpenAI embeddings
   - Stored in in-memory document store

2. **Query Routing**:
   - User query is analyzed by AI router
   - Determines if query needs: summary, context, or simple response

3. **Hybrid Retrieval**:
   - Semantic search using embeddings
   - BM25 keyword search
   - Results combined using Reciprocal Rank Fusion (RRF)

4. **Response Generation**:
   - Retrieved context is provided to GPT
   - AI generates contextual response
   - Response is streamed back to user

### Technologies Used

**Frontend**:
- React 18 - UI framework
- Vite - Build tool
- TailwindCSS - Styling
- Lucide React - Icons
- React Markdown - Markdown rendering
- React Syntax Highlighter - Code highlighting

**Backend**:
- FastAPI - Web framework
- Haystack - RAG framework
- OpenAI - LLM and embeddings
- SQLAlchemy - Database ORM
- SQLite - Database

## 🛠️ Development

### Build Frontend for Production

```bash
cd frontend
npm run build
```

The production build will be in `frontend/dist/`

### Run Backend in Production

```bash
uvicorn backend.api:app --host 0.0.0.0 --port 8000 --workers 4
```

## 📝 Future Enhancements

- [ ] Web scraping integration for fetching website content
- [ ] Voice command support
- [ ] Multi-user authentication
- [ ] Document management UI
- [ ] Export chat history
- [ ] Custom embedding models
- [ ] Vector database integration (Pinecone, Weaviate)
- [ ] File preview in UI
- [ ] Advanced filtering and search options

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Haystack](https://haystack.deepset.ai/)
- Powered by [OpenAI](https://openai.com/)
- UI inspired by modern chat applications

---

**Made with ❤️ for the AI community**

https://rag2check.streamlit.app/
