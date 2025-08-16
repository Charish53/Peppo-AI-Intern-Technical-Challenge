import React, { useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { useToast } from '../hooks/use-toast';
import { Loader2, Play, Image, Video, Download, X } from 'lucide-react';

interface VideoGenerationForm {
  model_type: 'gen4_alpha' | 'gen4_turbo';
  prompt: string;
  image?: string;
  negative_prompt?: string;
  num_frames: number;
  aspect_ratio: string;
}

interface GenerationStatus {
  generation_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  video_url?: string;
  thumbnail_url?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

const VideoGeneration: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGeneration, setCurrentGeneration] = useState<GenerationStatus | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [formData, setFormData] = useState<VideoGenerationForm>({
    model_type: 'gen4_alpha',
    prompt: '',
    image: undefined,
    negative_prompt: '',
    num_frames: 16,
    aspect_ratio: '16:9'
  });

  const handleInputChange = (field: keyof VideoGenerationForm, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setFormData(prev => ({
          ...prev,
          image: result,
          model_type: 'gen4_turbo' // Auto-switch to image-to-video
        }));
        setActiveTab('image');
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      image: undefined
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startGeneration = async () => {
    if (!formData.prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt for video generation",
        variant: "destructive"
      });
      return;
    }

    if (formData.model_type === 'gen4_turbo' && !formData.image) {
      toast({
        title: "Error",
        description: "Please upload an image for image-to-video generation",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      // Call backend API (which has the RunwayML API key)
      const response = await fetch('http://localhost:5000/api/video-generation/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start generation');
      }

      const result = await response.json();
      
      setCurrentGeneration({
        generation_id: result.generation_id,
        status: result.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Start progress simulation
      startProgressSimulation();
      
      // Start polling for status
      pollGenerationStatus(result.generation_id);

      toast({
        title: "Success",
        description: "Video generation started successfully!",
      });

    } catch (error) {
      console.error('Error starting generation:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to start generation',
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const startProgressSimulation = () => {
    setGenerationProgress(0);
    progressIntervalRef.current = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressIntervalRef.current!);
          return 90;
        }
        return prev + Math.random() * 10;
      });
    }, 2000);
  };

  const pollGenerationStatus = async (generationId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        // Call backend API to check status
        const response = await fetch(`http://localhost:5000/api/video-generation/status/${generationId}`);

        if (response.ok) {
          const status = await response.json();
          setCurrentGeneration(status);

          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(pollInterval);
            clearInterval(progressIntervalRef.current!);
            setGenerationProgress(100);
            
            if (status.status === 'completed') {
              toast({
                title: "Success",
                description: "Video generation completed!",
              });
            } else {
              toast({
                title: "Error",
                description: status.error_message || "Video generation failed",
                variant: "destructive"
              });
            }
          }
        }
      } catch (error) {
        console.error('Error polling status:', error);
      }
    }, 5000); // Poll every 5 seconds
  };

  const cancelGeneration = async () => {
    if (!currentGeneration?.generation_id) return;

    try {
      // Call backend API to cancel generation
      const response = await fetch(`http://localhost:5000/api/video-generation/cancel/${currentGeneration.generation_id}`, {
        method: 'POST'
      });

      if (response.ok) {
        setCurrentGeneration(prev => prev ? { ...prev, status: 'cancelled' } : null);
        clearInterval(progressIntervalRef.current!);
        setGenerationProgress(0);
        toast({
          title: "Success",
          description: "Generation cancelled successfully",
        });
      }
    } catch (error) {
      console.error('Error cancelling generation:', error);
      toast({
        title: "Error",
        description: "Failed to cancel generation",
        variant: "destructive"
      });
    }
  };

  const downloadVideo = () => {
    if (currentGeneration?.video_url) {
      const link = document.createElement('a');
      link.href = currentGeneration.video_url;
      link.download = `generated-video-${currentGeneration.generation_id}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Helper function to map aspect ratio to RunwayML format
  const getRunwayMLRatio = (aspectRatio: string) => {
    const ratioMap: { [key: string]: string } = {
      '16:9': '1280:720',
      '9:16': '720:1280', 
      '1:1': '960:960',
      '4:3': '1104:832',
      '3:4': '832:1104'
    };
    return ratioMap[aspectRatio] || '1280:720';
  };

  const resetForm = () => {
    setFormData({
      model_type: 'gen4_alpha',
      prompt: '',
      image: undefined,
      negative_prompt: '',
      num_frames: 16,
      aspect_ratio: '16:9'
    });
    setCurrentGeneration(null);
    setGenerationProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">AI Video Generation</h1>
        <p className="text-xl text-muted-foreground">
          Create stunning videos using RunwayML's Gen-4 Alpha and Gen-4 Turbo models
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Generation Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Video Generation Settings</CardTitle>
              <CardDescription>
                Configure your video generation parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'text' | 'image')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Text to Video
                  </TabsTrigger>
                  <TabsTrigger value="image" className="flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    Image to Video
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="prompt">Prompt</Label>
                    <Textarea
                      id="prompt"
                      placeholder="Describe the video you want to generate..."
                      value={formData.prompt}
                      onChange={(e) => handleInputChange('prompt', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="negative-prompt">Negative Prompt (Optional)</Label>
                    <Textarea
                      id="negative-prompt"
                      placeholder="What you don't want in the video..."
                      value={formData.negative_prompt}
                      onChange={(e) => handleInputChange('negative_prompt', e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
                      <Select
                        value={formData.aspect_ratio}
                        onValueChange={(value) => handleInputChange('aspect_ratio', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                          <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                          <SelectItem value="1:1">1:1 (Square)</SelectItem>
                          <SelectItem value="4:3">4:3 (Classic)</SelectItem>
                          <SelectItem value="3:4">3:4 (Portrait Classic)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        RunwayML will use: {getRunwayMLRatio(formData.aspect_ratio)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="num-frames">Number of Frames</Label>
                      <Input
                        id="num-frames"
                        type="number"
                        min="8"
                        max="32"
                        value={formData.num_frames}
                        onChange={(e) => handleInputChange('num_frames', parseInt(e.target.value))}
                      />
                      <p className="text-xs text-gray-500">
                        {formData.num_frames <= 16 ? '5 seconds' : '10 seconds'} duration
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="image" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="image-upload">Upload Image</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      {formData.image ? (
                        <div className="space-y-4">
                          <img
                            src={formData.image}
                            alt="Uploaded"
                            className="max-w-full h-32 object-contain mx-auto rounded"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={removeImage}
                            className="flex items-center gap-2"
                          >
                            <X className="w-4 h-4" />
                            Remove Image
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Image className="w-12 h-12 mx-auto text-gray-400" />
                          <div>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              Choose Image
                            </Button>
                            <p className="text-sm text-gray-500 mt-2">
                              PNG, JPG up to 10MB
                            </p>
                          </div>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image-prompt">Additional Prompt (Optional)</Label>
                    <Textarea
                      id="image-prompt"
                      placeholder="Additional details for the video..."
                      value={formData.prompt}
                      onChange={(e) => handleInputChange('prompt', e.target.value)}
                      rows={2}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label>Number of Frames: {formData.num_frames} ({formData.num_frames <= 16 ? '5 seconds' : '10 seconds'})</Label>
                  <Slider
                    value={[formData.num_frames]}
                    onValueChange={([value]) => handleInputChange('num_frames', value)}
                    min={8}
                    max={32}
                    step={8}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>8 frames (5s)</span>
                    <span>16 frames (5s)</span>
                    <span>24 frames (10s)</span>
                    <span>32 frames (10s)</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <Button
                  onClick={startGeneration}
                  disabled={isGenerating || !formData.prompt.trim()}
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Generate Video
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={resetForm}
                  disabled={isGenerating}
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Generation Status */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generation Status</CardTitle>
              <CardDescription>
                Monitor your video generation progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentGeneration ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant={
                      currentGeneration.status === 'completed' ? 'default' :
                      currentGeneration.status === 'processing' ? 'secondary' :
                      currentGeneration.status === 'failed' ? 'destructive' :
                      'outline'
                    }>
                      {currentGeneration.status.charAt(0).toUpperCase() + currentGeneration.status.slice(1)}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {new Date(currentGeneration.created_at).toLocaleTimeString()}
                    </span>
                  </div>

                  {currentGeneration.status === 'processing' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{Math.round(generationProgress)}%</span>
                      </div>
                      <Progress value={generationProgress} className="w-full" />
                    </div>
                  )}

                  {currentGeneration.status === 'completed' && currentGeneration.video_url && (
                    <div className="space-y-4">
                      <video
                        src={currentGeneration.video_url}
                        controls
                        className="w-full rounded-lg"
                        poster={currentGeneration.thumbnail_url}
                      />
                      <Button
                        onClick={downloadVideo}
                        className="w-full flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download Video
                      </Button>
                    </div>
                  )}

                  {currentGeneration.status === 'failed' && currentGeneration.error_message && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">
                        {currentGeneration.error_message}
                      </p>
                    </div>
                  )}

                  {currentGeneration.status === 'processing' && (
                    <Button
                      onClick={cancelGeneration}
                      variant="outline"
                      className="w-full"
                    >
                      Cancel Generation
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No active generation</p>
                  <p className="text-sm">Start a new generation to see status here</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Model Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Gen-4 Alpha</span>
                <Badge variant="secondary">Text to Video</Badge>
              </div>
              <p className="text-xs text-gray-500">
                Generate videos from text descriptions with high quality and creativity.
              </p>
              
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm font-medium">Gen-4 Turbo</span>
                <Badge variant="secondary">Image to Video</Badge>
              </div>
              <p className="text-xs text-gray-500">
                Transform static images into dynamic videos with motion and effects.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VideoGeneration; 