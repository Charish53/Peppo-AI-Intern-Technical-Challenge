import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { getCategories, getTotalCollectionCount } from '@/lib/dataService';
import { Link } from 'react-router-dom';


const AllCategoriesPage = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
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

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading categories...</p>
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
            <p className="text-muted-foreground">Error loading categories. Please refresh the page.</p>
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
              Explore All Categories
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Browse {totalCategories}+ categories of AI models. Find the perfect category for your AI needs.
            </p>
          </div>

          {/* Search */}
          <div className="max-w-md mx-auto">
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Results Count */}
          <div className="text-center">
            <p className="text-muted-foreground">
              Showing {filteredCategories.length} of {totalCategories} categories
            </p>
          </div>
          
          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category, index) => (
              <Card key={index} className="cosmic-gradient border-border hover:border-primary/30 transition-all duration-300 hover:scale-105">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-end">
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
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{category.totalRuns.toLocaleString()} total runs</span>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full border-border text-foreground hover:bg-accent hover:text-accent-foreground"
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

          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No categories found matching your criteria.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setSearchTerm('')}
              >
                Clear Search
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllCategoriesPage; 