import { useState } from 'react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Card, CardContent } from './ui/Card'
import { ScrollArea } from './ui/ScrollArea'
import { Search, FileText } from 'lucide-react'
import { api } from '@/lib/api'

export function BM25Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim() || loading) return

    setLoading(true)
    try {
      const data = await api.searchBm25(query, 5)
      setResults(data.results || [])
    } catch (error) {
      console.error('Failed to search:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full p-6">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Search className="h-6 w-6" />
            BM25 Search
          </h2>
          <p className="text-muted-foreground">
            Search through your indexed documents using BM25 algorithm
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your search query..."
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !query.trim()}>
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </form>

        <ScrollArea className="flex-1">
          <div className="space-y-4">
            {results.length === 0 && !loading && (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No results yet. Try searching for something!</p>
              </div>
            )}
            {results.map((result, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{result}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
