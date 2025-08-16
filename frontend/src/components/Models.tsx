import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Video, Camera, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

const Models: React.FC = () => {
  const models = [
    {
      id: 'gen4_alpha',
      name: 'Gen-4 Alpha',
      description: 'Advanced text-to-video generation with high quality and creativity',
      category: 'Video Generation',
      icon: Video,
      color: 'bg-muted text-muted-foreground',
      features: ['Text to Video', 'High Quality', 'Creative Control'],
      status: 'Available'
    },
    {
      id: 'gen4_turbo',
      name: 'Gen-4 Turbo',
      description: 'Fast image-to-video transformation with motion and effects',
      category: 'Video Generation',
      icon: Camera,
      color: 'bg-muted text-muted-foreground',
      features: ['Image to Video', 'Fast Processing', 'Motion Effects'],
      status: 'Available'
    }
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-foreground">AI Video Generation Models</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Create stunning videos with our advanced AI models. Generate videos from text descriptions 
            or transform images into animated videos with motion and effects.
          </p>
        </div>

        {/* Video Generation Models */}
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {models.map((model) => (
              <Card key={model.id} className="group hover:shadow-lg transition-all duration-300 bg-card border-border">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-3 rounded-lg ${model.color} border border-border`}>
                      <model.icon className="w-6 h-6" />
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {model.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl text-foreground">{model.name}</CardTitle>
                  <CardDescription className="text-base text-muted-foreground">
                    {model.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {model.features.map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                    <Link to="/video-generation">
                      <Button className="w-full group-hover:bg-primary/90 transition-colors">
                        <Play className="w-4 h-4 mr-2" />
                        Try Now
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Link to="/video-generation">
              <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 transition-colors">
                <Video className="w-5 h-5 mr-2" />
                Try Video Generation
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Models; 