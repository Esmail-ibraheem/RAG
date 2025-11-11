# Multi-Document Chat Feature 📚

## Overview

You can now upload and chat with **multiple documents simultaneously**! The system will search across all active documents to provide comprehensive answers.

## ✨ New Features

### 1. **Accumulative Document Upload**
- Upload documents one at a time or in batches
- Each upload **adds** to your document collection (doesn't replace)
- Duplicates are automatically prevented

### 2. **Active Documents Management**
- See all active documents in the sidebar
- Shows total count: "Active Documents (3)"
- Hover over any document to remove it
- "Clear All" button to remove all at once

### 3. **Visual Feedback**
- Chat input shows which documents are active
- Document count displayed at bottom of chat
- Clear indication when no documents are loaded

### 4. **Individual Document Control**
- Remove specific documents without affecting others
- Hover over document name → X button appears
- Click X to remove from active session

## 🎯 How to Use

### Upload Multiple Documents:

1. **First Upload**:
   - Click "Select Files" under RAG Documents
   - Choose one or more files
   - Click "Upload & Index"
   - Files are added to active documents

2. **Add More Documents**:
   - Click "Select Files" again
   - Choose additional files
   - Click "Upload & Index"
   - New files are **added** to existing ones

3. **Result**:
   - All documents are now active
   - Chat will search across ALL documents
   - See list in "Active Documents" section

### Manage Documents:

**Remove One Document:**
- Hover over document name in sidebar
- Click the X button that appears
- Document removed from current session

**Remove All Documents:**
- Click "Clear All" button
- Confirm the action
- All documents removed from session
- Files remain indexed in system

### Chat with Multiple Documents:

1. **Upload your documents** (as many as you want)
2. **Create or select a chat**
3. **Ask questions** - AI searches ALL active documents
4. **Get comprehensive answers** from across all sources

## 📋 Example Workflow

```
1. Upload "Company_Policy.pdf"
   → Active Documents (1)

2. Upload "Employee_Handbook.docx"
   → Active Documents (2)

3. Upload "Benefits_Guide.pdf" and "FAQ.txt"
   → Active Documents (4)

4. Ask: "What are the vacation policies and health benefits?"
   → AI searches all 4 documents and provides comprehensive answer

5. Remove "FAQ.txt" (not needed anymore)
   → Active Documents (3)

6. Continue chatting with remaining 3 documents
```

## 🎨 UI Elements

### Sidebar - Active Documents Section:
```
┌─────────────────────────────────┐
│ Active Documents (3)  [Clear All]│
├─────────────────────────────────┤
│ Policy.pdf              [×]     │
│ Handbook.docx           [×]     │
│ Benefits.pdf            [×]     │
└─────────────────────────────────┘
```

### Chat Input Area:
```
Using 3 document(s): Policy.pdf, Handbook.docx, Benefits.pdf
┌─────────────────────────────────────────────┐
│ Ask a question about your documents...  [→] │
└─────────────────────────────────────────────┘
```

## 💡 Tips

1. **Start Broad, Then Narrow**:
   - Upload all relevant documents first
   - Ask your question
   - Remove irrelevant documents if needed
   - Ask follow-up questions

2. **Document Organization**:
   - Upload related documents together
   - Remove documents when switching topics
   - Use "Clear All" when starting fresh

3. **Performance**:
   - More documents = more comprehensive answers
   - But also slightly slower retrieval
   - 5-10 documents is usually optimal

4. **Session Management**:
   - Documents persist across chats
   - Clear when switching to different topic
   - Re-upload if you restart the application

## 🔧 Technical Details

### How It Works:

1. **Upload**: Each document is indexed with embeddings
2. **Storage**: All documents stored in in-memory document store
3. **Query**: When you ask a question:
   - System searches ALL active documents
   - Uses hybrid search (embeddings + BM25)
   - Retrieves top relevant chunks from any document
   - Combines results using RRF (Reciprocal Rank Fusion)
4. **Answer**: AI generates response using all retrieved context

### Backend:
- Endpoint: `POST /rag/ask`
- Parameter: `file_names` (array of strings)
- Searches across all specified files
- Returns unified answer

### Frontend:
- State: `ragFileNames` array in App.jsx
- Passed to ChatInterface via props
- Sent to backend with each query

## 🚀 Advanced Usage

### Cross-Document Questions:
```
Documents: "Q1_Report.pdf", "Q2_Report.pdf", "Q3_Report.pdf"
Question: "Compare revenue growth across all quarters"
Result: AI analyzes all three reports and provides comparison
```

### Multi-Source Synthesis:
```
Documents: "Research_Paper.pdf", "Case_Study.docx", "Industry_Report.pdf"
Question: "Summarize the key findings from all sources"
Result: AI synthesizes information from all documents
```

### Focused Queries:
```
Documents: "Manual_Chapter1.pdf", "Manual_Chapter2.pdf", ..., "Manual_Chapter10.pdf"
Question: "How do I configure the network settings?"
Result: AI finds relevant section across all chapters
```

## ⚠️ Important Notes

- **Indexing is permanent**: Once uploaded, documents stay indexed in the system
- **Active list is temporary**: The active documents list is session-based
- **Clear vs Delete**: "Clear All" removes from session, not from index
- **Restart behavior**: Active documents list resets on app restart
- **File names matter**: System uses file names to track documents

## 🎉 Benefits

1. **Comprehensive Answers**: Search across multiple sources
2. **Flexible**: Add/remove documents as needed
3. **Efficient**: No need to re-upload for different questions
4. **Organized**: Clear visual management of active documents
5. **Powerful**: Combine information from various sources

---

**Enjoy chatting with multiple documents! 🚀**
