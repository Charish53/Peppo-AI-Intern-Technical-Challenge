import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Plus, Upload, Database, Users, CreditCard, Settings } from 'lucide-react';
import { adminService, ModelData, UserStats } from '@/lib/adminService';



const AdminDashboard = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState<ModelData[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    modelUrl: '',
    author: '',
    tags: '',
    imageUrl: '',
    price: 1,
    isActive: true
  });

  // Check if user is admin
  useEffect(() => {
    if (user && user.email !== 'admin@example.com') {
      toast.error('Access denied. Admin privileges required.');
      // Redirect to home or show access denied
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const modelData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        model_url: formData.modelUrl,
        author: formData.author,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        image_url: formData.imageUrl || undefined,
        price: parseInt(formData.price.toString()),
        is_active: formData.isActive
      };

      await adminService.createModel(modelData);
      toast.success('Model uploaded successfully!');
      setFormData({
        name: '',
        description: '',
        category: '',
        modelUrl: '',
        author: '',
        tags: '',
        imageUrl: '',
        price: 1,
        isActive: true
      });
      fetchModels(); // Refresh the models list
    } catch (error) {
      console.error('Error uploading model:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload model');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchModels = async () => {
    try {
      const modelsData = await adminService.getModels();
      setModels(modelsData);
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const fetchUserStats = async () => {
    try {
      const statsData = await adminService.getStats();
      setUserStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchModels();
      fetchUserStats();
    }
  }, [user]);

  const toggleModelStatus = async (modelId: string, isActive: boolean) => {
    try {
      await adminService.updateModel(modelId, { is_active: isActive });
      toast.success(`Model ${isActive ? 'activated' : 'deactivated'} successfully`);
      fetchModels();
    } catch (error) {
      console.error('Error updating model:', error);
      toast.error('Failed to update model status');
    }
  };

  const deleteModel = async (modelId: string) => {
    if (!confirm('Are you sure you want to delete this model?')) return;

    try {
      const success = await adminService.deleteModel(modelId);
      if (success) {
        toast.success('Model deleted successfully');
        fetchModels();
      } else {
        toast.error('Failed to delete model');
      }
    } catch (error) {
      console.error('Error deleting model:', error);
      toast.error('Failed to delete model');
    }
  };

  if (!user || user.email !== 'admin@example.com') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-center mb-4">Access Denied</h2>
            <p className="text-muted-foreground text-center">
              You need admin privileges to access this dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage models, users, and system settings</p>
          </div>
          <Badge variant="secondary">Admin Panel</Badge>
        </div>

        {/* Stats Cards */}
        {userStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Total Users</span>
                </div>
                <p className="text-2xl font-bold">{userStats.totalUsers}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Total Credits</span>
                </div>
                <p className="text-2xl font-bold">{userStats.totalCredits}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Total Models</span>
                </div>
                <p className="text-2xl font-bold">{models.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Transactions</span>
                </div>
                <p className="text-2xl font-bold">{userStats.totalTransactions}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="upload" className="space-y-4">
          <TabsList>
            <TabsTrigger value="upload">Upload Model</TabsTrigger>
            <TabsTrigger value="models">Manage Models</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload New Model
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Model Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter model name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select value={formData.category} onValueChange={(value) => handleSelectChange('category', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text-generation">Text Generation</SelectItem>
                          <SelectItem value="image-generation">Image Generation</SelectItem>
                          <SelectItem value="transcription">Transcription</SelectItem>
                          <SelectItem value="translation">Translation</SelectItem>
                          <SelectItem value="summarization">Summarization</SelectItem>
                          <SelectItem value="classification">Classification</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe the model and its capabilities"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="modelUrl">Model URL *</Label>
                      <Input
                        id="modelUrl"
                        name="modelUrl"
                        value={formData.modelUrl}
                        onChange={handleInputChange}
                        placeholder="https://replicate.com/..."
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="author">Author *</Label>
                      <Input
                        id="author"
                        name="author"
                        value={formData.author}
                        onChange={handleInputChange}
                        placeholder="Model author/organization"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags (comma-separated)</Label>
                      <Input
                        id="tags"
                        name="tags"
                        value={formData.tags}
                        onChange={handleInputChange}
                        placeholder="AI, machine learning, text, etc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imageUrl">Image URL</Label>
                      <Input
                        id="imageUrl"
                        name="imageUrl"
                        value={formData.imageUrl}
                        onChange={handleInputChange}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Credits Required</Label>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        min="1"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={formData.isActive.toString()} onValueChange={(value) => handleSelectChange('isActive', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Active</SelectItem>
                          <SelectItem value="false">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'Uploading...' : 'Upload Model'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="models" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Manage Models</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {models.map((model) => (
                    <div key={model.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{model.name}</h3>
                          <p className="text-sm text-muted-foreground">{model.description}</p>
                                                     <div className="flex items-center gap-2 mt-2">
                             <Badge variant="outline">{model.category}</Badge>
                             <Badge variant={model.is_active ? "default" : "secondary"}>
                               {model.is_active ? 'Active' : 'Inactive'}
                             </Badge>
                             <span className="text-sm text-muted-foreground">
                               {model.price} credit(s)
                             </span>
                           </div>
                        </div>
                                                 <div className="flex items-center gap-2">
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => toggleModelStatus(model.id, !model.is_active)}
                           >
                             {model.is_active ? 'Deactivate' : 'Activate'}
                           </Button>
                           <Button
                             variant="destructive"
                             size="sm"
                             onClick={() => deleteModel(model.id)}
                           >
                             Delete
                           </Button>
                         </div>
                      </div>
                    </div>
                  ))}
                  {models.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No models uploaded yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard; 