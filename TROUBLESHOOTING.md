# Troubleshooting Upload Issues

## Step-by-Step Debugging

### 1. Check Backend is Running
```bash
# Should show: INFO: Uvicorn running on http://0.0.0.0:8000
uvicorn backend.api:app --reload --host 0.0.0.0 --port 8000
```

### 2. Check Frontend is Running
```bash
cd frontend
# Should show: Local: http://localhost:3000/
npm run dev
```

### 3. Test Backend Directly

**Test Config Endpoint:**
```bash
curl -X POST http://localhost:8000/config \
  -H "Content-Type: application/json" \
  -d '{"api_key": "your-key-here", "model_name": "gpt-4o-mini"}'
```

**Test Upload Endpoint:**
```bash
curl -X POST http://localhost:8000/rag/upload \
  -F "files=@test_document.txt"
```

### 4. Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try uploading a file
4. Look for:
   - "Starting upload of X files"
   - "Files to upload: [...]"
   - "Upload result: {...}"
   - Any error messages

### 5. Common Issues

**Issue: "OpenAI API key not configured"**
- Solution: Click Configuration in sidebar, enter API key, click Save Config
- Verify you see success message
- Then try upload again

**Issue: No response when clicking Upload**
- Check browser console for errors
- Verify files are selected (should show "X file(s) selected")
- Check network tab in DevTools for failed requests

**Issue: Upload button doesn't appear**
- Make sure you clicked "Select Files" first
- Check that files are actually selected
- Look for file count message

**Issue: Backend error during indexing**
- Check backend terminal for error messages
- Verify OpenAI API key is valid
- Check file format is supported (.pdf, .txt, .docx, .xlsx, .csv)

### 6. Manual Test Steps

1. **Configure OpenAI:**
   - Click "Configuration" in sidebar
   - Enter: `sk-your-actual-key-here`
   - Select model: GPT-4o Mini
   - Click "Save Config"
   - Should see green success message

2. **Upload Test File:**
   - Use the provided `test_document.txt`
   - Click "Select Files" under RAG Documents
   - Choose `test_document.txt`
   - Should see "1 file(s) selected"
   - Click "Upload & Index"
   - Should see "Uploading..." then success alert

3. **Test Chat:**
   - Click "+ New Chat"
   - Ask: "What file formats does the system support?"
   - Should get answer mentioning PDF, DOCX, TXT, XLSX, CSV

### 7. Check Logs

**Backend logs should show:**
```
INFO: 127.0.0.1:XXXXX - "POST /config HTTP/1.1" 200 OK
INFO: 127.0.0.1:XXXXX - "POST /rag/upload HTTP/1.1" 200 OK
```

**Browser console should show:**
```
Starting upload of 1 files
Files to upload: ['test_document.txt']
Upload result: {indexed: 1, file_names: ['test_document.txt']}
```

### 8. Still Not Working?

Check these files for issues:
- `f:\RAG\frontend\src\lib\api.js` - API client
- `f:\RAG\frontend\src\components\Sidebar.jsx` - Upload component
- `f:\RAG\backend\api.py` - Backend endpoints

Look for error messages in:
- Browser console (F12)
- Backend terminal
- Network tab in DevTools
