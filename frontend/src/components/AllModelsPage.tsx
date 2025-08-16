import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAllModels, getCategories, getTotalModelCount } from '@/lib/dataService';
import { Link } from 'react-router-dom';


const AllModelsPage = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [allModels, setAllModels] = React.useState<any[]>([]);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [totalModels, setTotalModels] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [models, cats, total] = await Promise.all([
          getAllModels(),
          getCategories(),
          getTotalModelCount()
        ]);
        setAllModels(models);
        setCategories(cats);
        setTotalModels(total);
      } catch (err) {
        console.error('Error loading models:', err);
        setError('Failed to load models');
        setAllModels([]);
        setCategories([]);
        setTotalModels(0);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Create category options for filter
  const categoryOptions = [
    { value: "all", label: "All Categories" },
    ...categories.map(cat => ({ value: cat.name, label: cat.name }))
  ];

  const filteredModels = allModels.filter(model => {
    const matchesSearch = model.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.collection?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.owner?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || model.collection === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading models...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Error loading models. Please refresh the page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <div className="flex-1 py-12 px-6 md:px-12">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Page Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-medium tracking-tighter">
              Explore All Models
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover and use {totalModels}+ AI models across all categories. Search, filter, and find the perfect model for your needs.
            </p>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 max-w-3xl mx-auto">
            <Input
              placeholder="Search models by name, description, or owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results Count */}
          <div className="text-center">
            <p className="text-muted-foreground">
              Showing {filteredModels.length} of {totalModels} models
            </p>
          </div>
          
          {/* Models Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModels.map((model, index) => (
              <Card key={index} className="overflow-hidden border-border hover:border-primary/30 transition-all duration-300 hover:scale-105">
                {/* Cover Image */}
                {model.cover_image_url && (
                  <div className="relative h-48 w-full overflow-hidden">
                    <img
                      src={model.cover_image_url}
                      alt={model.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="text-xl font-medium tracking-tighter text-foreground mb-2">
                      {model.name}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {model.description || 'No description available'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                                         <Button 
                       variant="outline"
                       className="w-full bg-card border-card text-card-foreground hover:bg-foreground hover:text-background transition-colors duration-200"
                       asChild
                     >
                      <Link to={`/model/${encodeURIComponent(model.id)}`}>
                        Preview
                      </Link>
                    </Button>
                                         <Button 
                       className="w-full bg-primary text-primary-foreground hover:bg-foreground hover:text-background transition-colors duration-200"
                       asChild
                     >
                      <Link to={`/model/${encodeURIComponent(model.id)}`}>
                        Add to Cart
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredModels.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No models found matching your criteria.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllModelsPage; 