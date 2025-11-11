import { useState, useEffect } from 'react'
import { Button } from './ui/Button'
import { ScrollArea } from './ui/ScrollArea'
import { Input } from './ui/Input'
import { Plus, MessageSquare, Upload, FileText, Settings, ChevronDown, ChevronUp, Check, X, Trash2 } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

export function Sidebar({ currentChatId, onChatSelect, onNewChat, onRagFilesUpload, ragFileNames }) {
  const [chats, setChats] = useState([])
  const [ragFiles, setRagFiles] = useState(null)
  const [bm25Files, setBm25Files] = useState(null)
  const [uploadingRag, setUploadingRag] = useState(false)
  const [uploadingBm25, setUploadingBm25] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('gpt-4o-mini')
  const [configStatus, setConfigStatus] = useState(null)
  const [savingConfig, setSavingConfig] = useState(false)

  useEffect(() => {
    loadChats()
  }, [])

  const loadChats = async () => {
    try {
      const data = await api.listChats()
      setChats(data)
    } catch (error) {
      console.error('Failed to load chats:', error)
    }
  }

  const handleDeleteChat = async (chatId, e) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this chat?')) return
    
    try {
      await api.deleteChat(chatId)
      await loadChats()
      if (currentChatId === chatId) {
        onChatSelect(null)
      }
    } catch (error) {
      console.error('Failed to delete chat:', error)
      alert('Failed to delete chat: ' + error.message)
    }
  }

  const handleNewChat = async () => {
    try {
      const newChat = await api.createChat()
      await loadChats()
      onNewChat(newChat.id)
    } catch (error) {
      console.error('Failed to create chat:', error)
    }
  }

  const handleRagUpload = async () => {
    if (!ragFiles || ragFiles.length === 0) {
      console.log('No files selected')
      return
    }
    
    console.log('Starting upload of', ragFiles.length, 'files')
    setUploadingRag(true)
    
    try {
      const filesArray = Array.from(ragFiles)
      console.log('Files to upload:', filesArray.map(f => f.name))
      
      const result = await api.uploadRagFiles(filesArray)
      console.log('Upload result:', result)
      
      // Add new files to existing ones instead of replacing
      const newFileNames = result.file_names || []
      const updatedFileNames = [...new Set([...ragFileNames, ...newFileNames])] // Remove duplicates
      onRagFilesUpload(updatedFileNames)
      setRagFiles(null)
      
      // Reset the file input
      const fileInput = document.getElementById('rag-upload')
      if (fileInput) fileInput.value = ''
      
      alert(`✅ Successfully indexed ${result.indexed} file(s)!\n\nFiles: ${newFileNames.join(', ')}\n\nTotal documents: ${updatedFileNames.length}`)
    } catch (error) {
      console.error('Upload error:', error)
      const errorMsg = error.message || 'Unknown error'
      
      if (errorMsg.includes('OpenAI API key not configured')) {
        alert('⚠️ Please configure your OpenAI API key first!\n\nClick the "Configuration" button above and enter your API key.')
      } else {
        alert('❌ Failed to upload files:\n\n' + errorMsg)
      }
    } finally {
      setUploadingRag(false)
    }
  }

  const handleRemoveRagFile = (fileName) => {
    const updatedFiles = ragFileNames.filter(f => f !== fileName)
    onRagFilesUpload(updatedFiles)
  }

  const handleClearAllRagFiles = () => {
    if (confirm('Remove all documents from the current session? (Files will remain indexed in the system)')) {
      onRagFilesUpload([])
    }
  }

  const handleSaveConfig = async () => {
    if (!apiKey.trim()) {
      setConfigStatus({ type: 'error', message: 'API key is required' })
      return
    }

    setSavingConfig(true)
    try {
      await api.setConfig(apiKey, model)
      setConfigStatus({ type: 'success', message: 'Configuration saved!' })
      setTimeout(() => setConfigStatus(null), 3000)
    } catch (error) {
      setConfigStatus({ type: 'error', message: 'Failed to save configuration' })
    } finally {
      setSavingConfig(false)
    }
  }

  const handleBm25Upload = async () => {
    if (!bm25Files || bm25Files.length === 0) return
    
    setUploadingBm25(true)
    try {
      await api.uploadBm25Files(Array.from(bm25Files))
      setBm25Files(null)
      // Reset the file input
      const fileInput = document.getElementById('bm25-upload')
      if (fileInput) fileInput.value = ''
    } catch (error) {
      console.error('Failed to upload BM25 files:', error)
      alert('Failed to upload files: ' + error.message)
    } finally {
      setUploadingBm25(false)
    }
  }

  return (
    <div className="w-64 border-r border-border bg-card flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-border">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          RAG System
        </h2>
        <Button onClick={handleNewChat} className="w-full mb-2" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
        <Button 
          onClick={() => setShowConfig(!showConfig)} 
          variant="outline" 
          className="w-full" 
          size="sm"
        >
          <Settings className="h-4 w-4 mr-2" />
          Configuration
          {showConfig ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
        </Button>
      </div>

      {/* Configuration Panel */}
      {showConfig && (
        <div className="p-4 border-b border-border bg-secondary/50 space-y-3">
          <div className="space-y-2">
            <label className="text-xs font-medium">OpenAI API Key</label>
            <Input
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-medium">Model</label>
            <select
              className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </select>
          </div>

          <Button 
            onClick={handleSaveConfig} 
            disabled={savingConfig} 
            size="sm" 
            className="w-full h-8"
          >
            {savingConfig ? 'Saving...' : 'Save Config'}
          </Button>

          {configStatus && (
            <div className={cn(
              'flex items-center gap-2 text-xs p-2 rounded',
              configStatus.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
            )}>
              {configStatus.type === 'success' ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              {configStatus.message}
            </div>
          )}
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-semibold mb-2">Chat History</h3>
          <div className="space-y-1">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={cn(
                  'group relative w-full text-left px-3 py-2 rounded-md text-sm transition-colors cursor-pointer',
                  currentChatId === chat.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                )}
                onClick={() => onChatSelect(chat.id)}
              >
                <span className="block pr-6">{chat.name}</span>
                <button
                  onClick={(e) => handleDeleteChat(chat.id, e)}
                  className={cn(
                    'absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/20',
                    currentChatId === chat.id ? 'text-primary-foreground' : ''
                  )}
                  title="Delete chat"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              RAG Documents
            </h3>
            <input
              type="file"
              multiple
              onChange={(e) => setRagFiles(e.target.files)}
              className="hidden"
              id="rag-upload"
              accept=".pdf,.txt,.docx,.xlsx,.csv"
            />
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full" 
              onClick={() => document.getElementById('rag-upload').click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Select Files
            </Button>
            {ragFiles && ragFiles.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">
                  {ragFiles.length} file(s) selected
                </p>
                <Button
                  onClick={handleRagUpload}
                  disabled={uploadingRag}
                  size="sm"
                  className="w-full"
                >
                  {uploadingRag ? 'Uploading...' : 'Upload & Index'}
                </Button>
              </div>
            )}
            {ragFileNames && ragFileNames.length > 0 && (
              <div className="mt-2 p-2 bg-secondary rounded text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Active Documents ({ragFileNames.length})</p>
                  <button
                    onClick={handleClearAllRagFiles}
                    className="text-destructive hover:text-destructive/80 text-xs"
                    title="Clear all"
                  >
                    Clear All
                  </button>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin">
                  {ragFileNames.map((name, i) => (
                    <div key={i} className="flex items-center justify-between gap-1 p-1 hover:bg-background/50 rounded group">
                      <span className="truncate flex-1" title={name}>{name}</span>
                      <button
                        onClick={() => handleRemoveRagFile(name)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80"
                        title="Remove"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              BM25 Documents
            </h3>
            <input
              type="file"
              multiple
              onChange={(e) => setBm25Files(e.target.files)}
              className="hidden"
              id="bm25-upload"
              accept=".pdf,.txt,.docx,.xlsx,.csv"
            />
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full" 
              onClick={() => document.getElementById('bm25-upload').click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Select Files
            </Button>
            {bm25Files && bm25Files.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">
                  {bm25Files.length} file(s) selected
                </p>
                <Button
                  onClick={handleBm25Upload}
                  disabled={uploadingBm25}
                  size="sm"
                  className="w-full"
                >
                  {uploadingBm25 ? 'Uploading...' : 'Upload & Index'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
