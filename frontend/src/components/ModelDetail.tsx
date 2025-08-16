import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { getModelById } from '@/lib/dataService';
import { useParams, Link } from 'react-router-dom';
import { Loader2, Play, Download, CreditCard, Upload, X } from 'lucide-react';
import { settingsService } from '@/lib/settingsService';
import { useAuth } from '@/hooks/useAuth';

const ModelDetail = () => {
  const { modelId: encodedModelId } = useParams<{ modelId: string }>();
  const modelId = encodedModelId ? decodeURIComponent(encodedModelId) : '';
  const { user } = useAuth();
  const [model, setModel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [userCredits, setUserCredits] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});

  useEffect(() => {
    const loadModel = async () => {
      if (!modelId) {
        setError('No model ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const [modelData, credits] = await Promise.all([
          getModelById(modelId),
          settingsService.getCreditBalance(user?.id || '')
        ]);
        
        if (!modelData) {
          setError('Model not found');
        } else {
          setModel(modelData);
          // Initialize form data with default values
          const defaultData: Record<string, any> = {};
          if (modelData.input_schema?.properties) {
            Object.entries(modelData.input_schema.properties).forEach(([key, field]: [string, any]) => {
              if (field.default !== undefined) {
                defaultData[key] = field.default;
              }
            });
          }
          setFormData(defaultData);
        }
        setUserCredits(credits);
      } catch (err) {
        console.error('Error loading model:', err);
        setError('Failed to load model');
      } finally {
        setLoading(false);
      }
    };

    loadModel();
  }, [modelId, user]);

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = (key: string, file: File) => {
    setUploadedFiles(prev => ({ ...prev, [key]: file }));
    setFormData(prev => ({ ...prev, [key]: file }));
  };

  const removeFile = (key: string) => {
    setUploadedFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[key];
      return newFiles;
    });
    setFormData(prev => {
      const newData = { ...prev };
      delete newData[key];
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (userCredits < 1) {
      alert('You need credits to run this model. Please buy credits first.');
      return;
    }

    try {
      setIsProcessing(true);
      setResult(null);

      // Prepare form data for submission
      const submissionData = new FormData();
      
      // Add regular form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value instanceof File) {
          // Handle file uploads
          submissionData.append(key, value);
        } else if (value !== null && value !== undefined) {
          // Handle regular values
          submissionData.append(key, String(value));
        }
      });

      // Simulate model execution (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock result for demonstration
      const mockResult = {
        output: `Generated result for ${model.name} with input: ${JSON.stringify(Object.fromEntries(submissionData))}`,
        status: 'completed'
      };
      
      setResult(mockResult);
      
      // Deduct credits for model usage
      if (user) {
        const newBalance = await settingsService.createCreditTransaction({
          user_id: user.id,
          amount: 1,
          type: 'usage',
          description: `Used 1 credit for model: ${model.name}`
        });
        if (newBalance) {
          setUserCredits(prev => prev - 1);
        }
      }
      
    } catch (err) {
      console.error('Error running model:', err);
      setError('Failed to run model');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderInputField = (key: string, input: any) => {
    const fieldType = input.type || 'string';
    const helpText = input.description;
    const title = input.title || key;
    
    // Handle file/image uploads
    if (input.format === 'file' || input.format === 'image' || 
        (input.type === 'string' && (input.title?.toLowerCase().includes('image') || 
         input.title?.toLowerCase().includes('file') || 
         input.description?.toLowerCase().includes('image') || 
         input.description?.toLowerCase().includes('file')))) {
      
      const uploadedFile = uploadedFiles[key];
      
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key}>{title}</Label>
          
          {uploadedFile ? (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Upload className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">{uploadedFile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(key)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {input.format === 'image' && (
                <div className="mt-2">
                  <img 
                    src={URL.createObjectURL(uploadedFile)} 
                    alt="Preview" 
                    className="max-w-full h-32 object-cover rounded"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                {input.format === 'image' ? 'Click to upload image' : 'Click to upload file'}
              </p>
              <input
                type="file"
                id={key}
                accept={input.format === 'image' ? 'image/*' : undefined}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(key, file);
                  }
                }}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById(key)?.click()}
              >
                Choose File
              </Button>
            </div>
          )}
          
          {helpText && <p className="text-sm text-muted-foreground">{helpText}</p>}
        </div>
      );
    }
    
    // Handle enum/select fields
    if (input.enum || input.oneOf) {
      const options = input.enum || input.oneOf?.map((item: any) => item.const || item.enum?.[0]) || [];
      
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key}>{title}</Label>
          <Select value={formData[key] || ''} onValueChange={(value) => handleInputChange(key, value)}>
            <SelectTrigger>
              <SelectValue placeholder={helpText || `Select ${title}`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {helpText && <p className="text-sm text-muted-foreground">{helpText}</p>}
        </div>
      );
    }
    
    // Handle slider fields
    if (input.minimum !== undefined && input.maximum !== undefined && 
        (input.type === 'number' || input.type === 'integer')) {
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key}>{title}</Label>
          <div className="space-y-2">
            <Slider
              value={[formData[key] || input.minimum]}
              onValueChange={(value) => handleInputChange(key, value[0])}
              min={input.minimum}
              max={input.maximum}
              step={input.step || 1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{input.minimum}</span>
              <span className="font-medium">{formData[key] || input.minimum}</span>
              <span>{input.maximum}</span>
            </div>
          </div>
          {helpText && <p className="text-sm text-muted-foreground">{helpText}</p>}
        </div>
      );
    }
    
    // Handle boolean/switch fields
    if (fieldType === 'boolean') {
      return (
        <div key={key} className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor={key}>{title}</Label>
            {helpText && <p className="text-sm text-muted-foreground">{helpText}</p>}
          </div>
          <Switch
            id={key}
            checked={formData[key] || false}
            onCheckedChange={(checked) => handleInputChange(key, checked)}
          />
        </div>
      );
    }
    
    // Handle number fields
    if (fieldType === 'number' || fieldType === 'integer') {
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key}>{title}</Label>
          <Input
            id={key}
            type="number"
            placeholder={helpText || `Enter ${title}`}
            value={formData[key] || ''}
            onChange={(e) => handleInputChange(key, parseFloat(e.target.value) || 0)}
            min={input.minimum}
            max={input.maximum}
            step={input.step || (fieldType === 'integer' ? 1 : 0.1)}
          />
          {helpText && <p className="text-sm text-muted-foreground">{helpText}</p>}
        </div>
      );
    }
    
    // Handle long text fields
    if (fieldType === 'string' && (input.maxLength > 100 || input.maxLength === undefined)) {
      return (
        <div key={key} className="space-y-2">
          <Label htmlFor={key}>{title}</Label>
          <Textarea
            id={key}
            placeholder={helpText || `Enter ${title}`}
            value={formData[key] || ''}
            onChange={(e) => handleInputChange(key, e.target.value)}
            className="min-h-[100px]"
            maxLength={input.maxLength}
          />
          {input.maxLength && (
            <p className="text-xs text-muted-foreground text-right">
              {(formData[key] || '').length}/{input.maxLength}
            </p>
          )}
          {helpText && <p className="text-sm text-muted-foreground">{helpText}</p>}
        </div>
      );
    }
    
    // Default string input
    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key}>{title}</Label>
        <Input
          id={key}
          type="text"
          placeholder={helpText || `Enter ${title}`}
          value={formData[key] || ''}
          onChange={(e) => handleInputChange(key, e.target.value)}
          maxLength={input.maxLength}
        />
        {input.maxLength && (
          <p className="text-xs text-muted-foreground text-right">
            {(formData[key] || '').length}/{input.maxLength}
          </p>
        )}
        {helpText && <p className="text-sm text-muted-foreground">{helpText}</p>}
      </div>
    );
  };

  const renderOutput = (output: any) => {
    if (!output) return null;

    if (typeof output === 'string') {
      if (output.startsWith('http')) {
        return (
          <div className="space-y-2">
            <img src={output} alt="Generated content" className="max-w-full rounded-lg" />
            <Button variant="outline" size="sm" onClick={() => window.open(output, '_blank')}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        );
      }
      return <p className="whitespace-pre-wrap">{output}</p>;
    }
    
    return <pre className="text-sm overflow-auto">{JSON.stringify(output, null, 2)}</pre>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-medium mb-4">Loading model...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (error || !model) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-medium mb-4">Error</h1>
            <p className="text-muted-foreground mb-4">{error || 'Model not found'}</p>
            <Link to="/models">
              <Button>Back to Models</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const inputFields = model.input_schema?.properties ? Object.entries(model.input_schema.properties) : [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">{model.name}</h1>
              <p className="text-muted-foreground">by {model.owner}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4" />
                <span>{userCredits} credits</span>
              </div>
              <Link to="/pricing">
                <Button variant="outline" size="sm">
                  Buy Credits
                </Button>
              </Link>
            </div>
          </div>
          
          {model.description && (
            <p className="text-lg text-muted-foreground mb-4">{model.description}</p>
          )}
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{model.collection}</Badge>
            {model.total_runs && (
              <Badge variant="outline">{model.total_runs.toLocaleString()} runs</Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle>Run Model (1 credit)</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {inputFields.map(([key, input]) => renderInputField(key, input))}
                
                <Button 
                  type="submit" 
                  disabled={isProcessing || userCredits < 1}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Model
                    </>
                  )}
                </Button>
                
                {userCredits < 1 && (
                  <p className="text-sm text-red-500 text-center">
                    You need credits to run this model. Please buy credits first.
                  </p>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent>
              {isProcessing && (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Processing your request...</p>
                </div>
              )}
              
              {result && (
                <div className="space-y-4">
                  {renderOutput(result.output)}
                </div>
              )}
              
              {!isProcessing && !result && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Run the model to see results here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ModelDetail; 