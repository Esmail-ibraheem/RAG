import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { ChatInterface } from './components/ChatInterface'
import { BM25Search } from './components/BM25Search'
import { Button } from './components/ui/Button'
import { MessageSquare, Search } from 'lucide-react'

function App() {
  const [currentChatId, setCurrentChatId] = useState(null)
  const [ragFileNames, setRagFileNames] = useState([])
  const [activeTab, setActiveTab] = useState('chat') // 'chat' or 'bm25'

  const handleChatSelect = (chatId) => {
    setCurrentChatId(chatId)
    setActiveTab('chat')
  }

  const handleNewChat = (chatId) => {
    setCurrentChatId(chatId)
    setActiveTab('chat')
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                Agentic RAG System
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                AI-Powered Retrieval Augmented Generation
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentChatId={currentChatId}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
          onRagFilesUpload={setRagFileNames}
          ragFileNames={ragFileNames}
        />

        {/* Main Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-border bg-card">
            <div className="flex gap-2 px-4">
              <Button
                variant={activeTab === 'chat' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('chat')}
                className="rounded-b-none"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                RAG Chat
              </Button>
              <Button
                variant={activeTab === 'bm25' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('bm25')}
                className="rounded-b-none"
              >
                <Search className="h-4 w-4 mr-2" />
                BM25 Search
              </Button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'chat' ? (
              <ChatInterface chatId={currentChatId} ragFileNames={ragFileNames} />
            ) : (
              <BM25Search />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
