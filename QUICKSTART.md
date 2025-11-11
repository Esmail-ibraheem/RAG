# Quick Start Guide 🚀

Get your RAG system up and running in 5 minutes!

## Step 1: Install Dependencies

**Option A - Automatic (Windows)**:
```bash
# Double-click install.bat
```

**Option B - Manual**:
```bash
# Install Python dependencies
pip install -r requirements.txt

# Install Node.js dependencies
cd frontend
npm install
cd ..
```

## Step 2: Start the Application

**Option A - Automatic (Windows)**:
```bash
# Double-click start.bat
```

**Option B - Manual**:

Terminal 1 (Backend):
```bash
uvicorn backend.api:app --reload --host 0.0.0.0 --port 8000
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

## Step 3: Configure OpenAI

1. Open http://localhost:3000 in your browser
2. Enter your OpenAI API key
3. Select a model (GPT-4o Mini recommended)
4. Click "Save Configuration"

## Step 4: Upload Documents

1. Click "Select Files" under "RAG Documents"
2. Choose your PDF, DOCX, TXT, or other supported files
3. Click "Upload & Index"
4. Wait for indexing to complete

## Step 5: Start Chatting!

1. Click "+ New Chat"
2. Type your question about the documents
3. Get AI-powered answers with context from your files

---

## Troubleshooting

### Backend won't start
- Make sure Python 3.9+ is installed
- Check if port 8000 is available
- Verify all dependencies are installed: `pip list`

### Frontend won't start
- Make sure Node.js 18+ is installed
- Delete `node_modules` and run `npm install` again
- Check if port 3000 is available

### Can't connect to backend
- Ensure backend is running on port 8000
- Check the console for CORS errors
- Verify API_BASE in frontend/.env

### OpenAI errors
- Verify your API key is correct
- Check your OpenAI account has credits
- Ensure you selected a valid model

---

## Next Steps

- Read SETUP.md for detailed documentation
- Explore the BM25 Search tab for keyword search
- Try uploading different document types
- Experiment with different GPT models

**Need help?** Check the full documentation in SETUP.md
