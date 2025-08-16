// Replicate API service for model execution

export interface ReplicatePrediction {
  id: string;
  version: string;
  urls: {
    get: string;
    cancel: string;
  };
  created_at: string;
  started_at?: string;
  completed_at?: string;
  source: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  input: Record<string, any>;
  output?: any;
  error?: string;
  logs?: string;
  metrics?: Record<string, any>;
}

export interface ReplicateModel {
  id: string;
  name: string;
  description?: string;
  owner: string;
  version: string;
  openapi_schema?: any;
  input_schema?: any;
  output_schema?: any;
}

class ReplicateService {
  private apiToken: string;
  private baseUrl = 'https://api.replicate.com/v1';

  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }

  // Start a prediction (model run)
  async startPrediction(modelId: string, input: Record<string, any>): Promise<ReplicatePrediction> {
    const response = await fetch(`${this.baseUrl}/predictions`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: modelId,
        input: input,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to start prediction: ${response.statusText}`);
    }

    return response.json();
  }

  // Get prediction status and results
  async getPrediction(predictionId: string): Promise<ReplicatePrediction> {
    const response = await fetch(`${this.baseUrl}/predictions/${predictionId}`, {
      headers: {
        'Authorization': `Token ${this.apiToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get prediction: ${response.statusText}`);
    }

    return response.json();
  }

  // Cancel a prediction
  async cancelPrediction(predictionId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/predictions/${predictionId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.apiToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel prediction: ${response.statusText}`);
    }
  }

  // Get model information
  async getModel(modelId: string): Promise<ReplicateModel> {
    const response = await fetch(`${this.baseUrl}/models/${modelId}`, {
      headers: {
        'Authorization': `Token ${this.apiToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get model: ${response.statusText}`);
    }

    return response.json();
  }

  // Poll prediction status until completion
  async pollPrediction(predictionId: string, onProgress?: (prediction: ReplicatePrediction) => void): Promise<ReplicatePrediction> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const prediction = await this.getPrediction(predictionId);
          
          if (onProgress) {
            onProgress(prediction);
          }

          if (prediction.status === 'succeeded' || prediction.status === 'failed' || prediction.status === 'canceled') {
            resolve(prediction);
          } else {
            // Poll again in 1 second
            setTimeout(poll, 1000);
          }
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }

  // Upload a file to Replicate
  async uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/uploads`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.apiToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }

    const result = await response.json();
    return result.serving_url;
  }
}

// Create a singleton instance
let replicateService: ReplicateService | null = null;

export const initializeReplicateService = (apiToken: string) => {
  replicateService = new ReplicateService(apiToken);
};

export const getReplicateService = (): ReplicateService => {
  if (!replicateService) {
    throw new Error('Replicate service not initialized. Call initializeReplicateService first.');
  }
  return replicateService;
};

// Helper function to convert our model format to Replicate format
export const convertToReplicateModelId = (modelId: string): string => {
  // Convert "owner/model-name" to "owner/model-name:version"
  // You might need to store version information in your model data
  return modelId;
}; 