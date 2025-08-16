import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { getModelsByCategory, getCategories } from '@/lib/dataService';
import { useParams, Link } from 'react-router-dom';


const CategoryPage = () => {
  const { name } = useParams<{ name: string }>();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [models, setModels] = React.useState<any[]>([]);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Properly decode the URL parameter
  const categoryName = name ? decodeURIComponent(name) : '';

  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [modelsData, categoriesData] = await Promise.all([
          getModelsByCategory(categoryName),
          getCategories()
        ]);
        setModels(modelsData);
        setCategories(categoriesData);
      } catch (err) {
        console.error('Error loading category data:', err);
        setError('Failed to load category data');
        setModels([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    if (categoryName) {
      loadData();
    }
  }, [categoryName]);

  const category = categories.find(cat => cat.name === categoryName);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading category...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Error loading category data. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-medium mb-4">Category not found</h1>
          <p className="text-muted-foreground">The requested category could not be found.</p>
        </div>
      </div>
    );
  }

  const filteredModels = models.filter(model =>
    model.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <div className="flex-1 py-12 px-6 md:px-12">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Category Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-4">
              <span className="text-4xl">🤖</span>
              <div>
                <h1 className="text-4xl font-medium tracking-tighter">{category.name}</h1>
                <p className="text-lg text-muted-foreground">{category.description}</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span>{category.modelCount} models</span>
              <span>•</span>
              <Link to="/" className="text-primary hover:underline">
                Browse all categories
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="max-w-md mx-auto">
            <Input
              placeholder="Search models in this category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryPage; 