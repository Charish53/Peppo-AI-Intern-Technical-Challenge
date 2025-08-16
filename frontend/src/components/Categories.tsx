import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getCategories, getTotalCollectionCount } from '@/lib/dataService';
import { Link } from 'react-router-dom';

const Categories = () => {
  const [categories, setCategories] = React.useState<any[]>([]);
  const [totalCategories, setTotalCategories] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [cats, total] = await Promise.all([
          getCategories(),
          getTotalCollectionCount()
        ]);
        setCategories(cats);
        setTotalCategories(total);
      } catch (err) {
        console.error('Error loading categories:', err);
        setError('Failed to load categories');
        setCategories([]);
        setTotalCategories(0);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <section id="categories" className="w-full py-12 md:py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading categories...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="categories" className="w-full py-12 md:py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-muted-foreground">Error loading categories. Please refresh the page.</p>
        </div>
      </section>
    );
  }

  // Show only first 6 categories
  const displayCategories = categories.slice(0, 6);

  return (
    <section id="categories" className="w-full py-12 md:py-16 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Popular AI Categories
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Explore {totalCategories} categories of AI models for every use case
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {displayCategories.map((category, index) => (
            <Card key={index} className="group hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="text-3xl">🤖</div>
                  <Badge variant="secondary" className="text-xs">
                    {category.modelCount} models
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <h3 className="text-xl font-medium tracking-tighter text-foreground">
                  {category.name}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {category.description}
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  asChild
                >
                  <Link to={`/category/${encodeURIComponent(category.name)}`}>
                    Browse Models
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button 
            size="lg"
            asChild
          >
            <Link to="/categories">
              Explore All Categories
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Categories; 