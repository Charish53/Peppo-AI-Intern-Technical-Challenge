
import React, { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, CreditCard, Zap, Download, Star, Video } from "lucide-react";
import { Link } from 'react-router-dom';

const Features = () => {
  const [openFeature, setOpenFeature] = useState<number | null>(null);
  
  const features = [
    {
      title: "Text to Video Generation",
      description: "Create stunning videos from text descriptions using our advanced AI models.",
      expandedDescription: "Transform your ideas into captivating videos with just a text prompt. Our Gen-4 Alpha model understands context and creates high-quality, creative videos that match your vision. Perfect for content creators, marketers, and storytellers.",
      icon: (
        <Video size={24} className="text-cosmic-accent" />
      ),
      hasAction: true,
      actionText: "Start Creating",
      actionLink: "/video-generation"
    },
    {
      title: "Image to Video Animation",
      description: "Transform static images into dynamic videos with motion and effects.",
      expandedDescription: "Bring your images to life with our Gen-4 Turbo model. Add motion, effects, and animation to create engaging video content. Ideal for product showcases, social media content, and creative projects.",
      icon: (
        <Video size={24} className="text-cosmic-accent" />
      ),
      hasAction: true,
      actionText: "Try Now",
      actionLink: "/video-generation"
    },
    {
      title: "Advanced Controls",
      description: "Fine-tune your video generation with professional-grade parameters.",
      expandedDescription: "Control frames, steps, guidance scale, and aspect ratios for perfect results. Real-time progress monitoring and instant previews. Professional tools for creators who demand precision and quality.",
      icon: (
        <Zap size={24} className="text-cosmic-accent" />
      )
    },
    {
      title: "Fast Processing",
      description: "Generate videos quickly with our optimized AI infrastructure.",
      expandedDescription: "Our optimized infrastructure ensures fast video generation times. Get results in minutes, not hours. No waiting in queues or long processing times for your creative projects.",
      icon: (
        <Star size={24} className="text-cosmic-accent" />
      )
    },
    {
      title: "High Quality Output",
      description: "Download your videos in multiple formats with professional quality.",
      expandedDescription: "Get high-quality video outputs in various formats. All results are stored securely and accessible anytime. Share results directly or integrate with your existing video editing workflow.",
      icon: (
        <Download size={24} className="text-cosmic-accent" />
      )
    },
    {
      title: "Pay Per Use",
      description: "Simple credit system with transparent pricing and no hidden fees.",
      expandedDescription: "Purchase credits and use them for video generation. No subscriptions or monthly fees - only pay for what you create. Competitive pricing for professional video generation.",
      icon: (
        <CreditCard size={24} className="text-cosmic-accent" />
      )
    }
  ];
  
  const toggleFeature = (index: number) => {
    setOpenFeature(openFeature === index ? null : index);
  };
  
  return (
    <section id="features" className="w-full py-12 md:py-16 px-6 md:px-12">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-medium tracking-tighter">
            Powerful Video Generation Features
          </h2>
          <p className="text-cosmic-muted text-lg">
            Create stunning videos with our advanced AI models and professional-grade controls
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Collapsible
              key={index}
              open={openFeature === index}
              onOpenChange={() => toggleFeature(index)}
              className={`rounded-xl border ${openFeature === index ? 'border-cosmic-light/40' : 'border-cosmic-light/20'} cosmic-gradient transition-all duration-300`}
            >
              <CollapsibleTrigger className="w-full text-left p-6 flex flex-col">
                <div className="flex justify-between items-start">
                  <div className="h-16 w-16 rounded-full bg-cosmic-light/10 flex items-center justify-center mb-6">
                    {feature.icon}
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-cosmic-muted transition-transform duration-200 ${
                      openFeature === index ? 'rotate-180' : ''
                    }`}
                  />
                </div>
                <h3 className="text-xl font-medium tracking-tighter mb-3">{feature.title}</h3>
                <p className="text-cosmic-muted">{feature.description}</p>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-6 pb-6 pt-2">
                <div className="pt-3 border-t border-cosmic-light/10">
                  <p className="text-cosmic-muted">{feature.expandedDescription}</p>
                  <div className="mt-4 flex justify-between items-center">
                    <button className="text-cosmic-accent hover:text-cosmic-accent/80 text-sm font-medium">
                      Learn more →
                    </button>
                    {feature.hasAction && (
                      <Link 
                        to={feature.actionLink!}
                        className="bg-cosmic-accent hover:bg-cosmic-accent/80 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        {feature.actionText}
                      </Link>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
