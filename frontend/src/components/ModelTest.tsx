import React from 'react';
import { getModelById, getAllModels } from '@/lib/dataService';

const ModelTest = () => {
  const testId = 'camenduru/tripo-sr';
  const [model, setModel] = React.useState<any>(null);
  const [allModels, setAllModels] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [modelData, allModelsData] = await Promise.all([
          getModelById(testId),
          getAllModels()
        ]);
        setModel(modelData);
        setAllModels(allModelsData);
      } catch (err) {
        console.error('Error loading test data:', err);
        setError('Failed to load test data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [testId]);

  const modelsWithTripo = allModels.filter(m => m.id.includes('tripo'));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading test data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Error loading test data. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground p-8">
      <h1 className="text-3xl font-bold mb-6">Model Data Test</h1>
      
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Testing Model ID: {testId}</h2>
          {model ? (
            <div className="bg-green-100 p-4 rounded">
              <p className="text-green-800">✅ Model Found!</p>
              <p>Name: {model.name}</p>
              <p>Owner: {model.owner}</p>
              <p>Collection: {model.collection}</p>
              <p>Description: {model.description}</p>
            </div>
          ) : (
            <div className="bg-red-100 p-4 rounded">
              <p className="text-red-800">❌ Model Not Found</p>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">All Models with 'tripo' in ID:</h2>
          <div className="bg-gray-100 p-4 rounded">
            {modelsWithTripo.length > 0 ? (
              <ul className="space-y-1">
                {modelsWithTripo.map((m, i) => (
                  <li key={i} className="text-sm">
                    {m.id} - {m.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No models found with 'tripo' in ID</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Total Models: {allModels.length}</h2>
          <div className="bg-gray-100 p-4 rounded">
            <p>First 5 models:</p>
            <ul className="space-y-1">
              {allModels.slice(0, 5).map((m, i) => (
                <li key={i} className="text-sm">
                  {m.id} - {m.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelTest; 