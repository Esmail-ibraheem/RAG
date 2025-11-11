import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Input } from './ui/Input'
import { Button } from './ui/Button'
import { Settings, Check, X } from 'lucide-react'
import { api } from '@/lib/api'

export function ConfigPanel() {
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('gpt-4o-mini')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setStatus({ type: 'error', message: 'API key is required' })
      return
    }

    setLoading(true)
    try {
      await api.setConfig(apiKey, model)
      setStatus({ type: 'success', message: 'Configuration saved successfully' })
      setTimeout(() => setStatus(null), 3000)
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to save configuration' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="h-5 w-5" />
          Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">OpenAI API Key</label>
          <Input
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Model</label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            <option value="gpt-4o-mini">GPT-4o Mini</option>
            <option value="gpt-4o">GPT-4o</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          </select>
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? 'Saving...' : 'Save Configuration'}
        </Button>

        {status && (
          <div className={`flex items-center gap-2 text-sm p-2 rounded ${
            status.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
          }`}>
            {status.type === 'success' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            {status.message}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
