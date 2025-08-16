import { useState, useEffect } from 'react'
import { useApiKeys } from '../hooks/useApiKeys'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { Switch } from './ui/switch'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from './ui/dialog'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table'
import { 
  Loader2, 
  Plus, 
  Key, 
  Eye, 
  EyeOff, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'

export function ApiKeyManager() {
  const { 
    loading, 
    error, 
    addApiKey, 
    getUserApiKeys, 
    deactivateApiKey, 
    reactivateApiKey, 
    deleteApiKey 
  } = useApiKeys()
  
  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showApiKey, setShowApiKey] = useState<string | null>(null)
  const [newApiKey, setNewApiKey] = useState({ name: '', key: '' })

  useEffect(() => {
    loadApiKeys()
  }, [])

  const loadApiKeys = async () => {
    const { apiKeys, error } = await getUserApiKeys()
    if (error) {
      toast.error('Failed to load API keys')
    } else {
      setApiKeys(apiKeys)
    }
  }

  const handleAddApiKey = async () => {
    if (!newApiKey.name || !newApiKey.key) {
      toast.error('Please fill in all fields')
      return
    }

    const { apiKeyId, error } = await addApiKey(newApiKey.name, newApiKey.key)
    if (error) {
      toast.error(error)
    } else {
      toast.success('API key added successfully')
      setNewApiKey({ name: '', key: '' })
      setShowAddDialog(false)
      loadApiKeys()
    }
  }

  const handleToggleApiKey = async (apiKeyId: string, isActive: boolean) => {
    const { error } = isActive 
      ? await reactivateApiKey(apiKeyId)
      : await deactivateApiKey(apiKeyId)
    
    if (error) {
      toast.error(error)
    } else {
      toast.success(`API key ${isActive ? 'activated' : 'deactivated'} successfully`)
      loadApiKeys()
    }
  }

  const handleDeleteApiKey = async (apiKeyId: string) => {
    const { error } = await deleteApiKey(apiKeyId)
    if (error) {
      toast.error(error)
    } else {
      toast.success('API key deleted successfully')
      loadApiKeys()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Key Management</h2>
          <p className="text-gray-600">Manage your Replicate API keys securely</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New API Key</DialogTitle>
              <DialogDescription>
                Add your Replicate API key to start using AI models
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="key-name">Key Name</Label>
                <Input
                  id="key-name"
                  placeholder="e.g., Production Key"
                  value={newApiKey.name}
                  onChange={(e) => setNewApiKey(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="api-key">API Key</Label>
                <div className="relative">
                  <Input
                    id="api-key"
                    type={showApiKey === 'new' ? 'text' : 'password'}
                    placeholder="Enter your Replicate API key"
                    value={newApiKey.key}
                    onChange={(e) => setNewApiKey(prev => ({ ...prev, key: e.target.value }))}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowApiKey(showApiKey === 'new' ? null : 'new')}
                  >
                    {showApiKey === 'new' ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddApiKey} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Key
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
          <CardDescription>
            Manage and monitor your Replicate API keys
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No API keys</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding your first Replicate API key.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((apiKey) => (
                  <TableRow key={apiKey.id}>
                    <TableCell className="font-medium">{apiKey.name}</TableCell>
                    <TableCell>
                      <Badge variant={apiKey.is_active ? 'default' : 'secondary'}>
                        {apiKey.is_active ? (
                          <>
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="mr-1 h-3 w-3" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(apiKey.created_at)}</TableCell>
                    <TableCell>
                      {apiKey.last_used_at ? (
                        formatDate(apiKey.last_used_at)
                      ) : (
                        <span className="text-gray-400 flex items-center">
                          <Clock className="mr-1 h-3 w-3" />
                          Never
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={apiKey.is_active}
                          onCheckedChange={(checked) => handleToggleApiKey(apiKey.id, checked)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteApiKey(apiKey.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 