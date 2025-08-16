// Schema types for AI model input/output compatibility
export interface SchemaField {
  name: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'json' | 'number' | 'boolean' | 'file';
  required: boolean;
  description?: string;
  default?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
  };
}

export interface ModelSchema {
  input: SchemaField[];
  output: SchemaField[];
}

// Predefined schema templates for common AI model types
export const SCHEMA_TEMPLATES = {
  TEXT_GENERATION: {
    input: [
      {
        name: 'prompt',
        type: 'text',
        required: true,
        description: 'Text prompt for generation'
      },
      {
        name: 'max_tokens',
        type: 'number',
        required: false,
        default: 100,
        description: 'Maximum number of tokens to generate'
      }
    ],
    output: [
      {
        name: 'generated_text',
        type: 'text',
        required: true,
        description: 'Generated text output'
      }
    ]
  },
  
  IMAGE_GENERATION: {
    input: [
      {
        name: 'prompt',
        type: 'text',
        required: true,
        description: 'Text description of the image to generate'
      },
      {
        name: 'width',
        type: 'number',
        required: false,
        default: 512,
        description: 'Image width in pixels'
      },
      {
        name: 'height',
        type: 'number',
        required: false,
        default: 512,
        description: 'Image height in pixels'
      }
    ],
    output: [
      {
        name: 'image_url',
        type: 'image',
        required: true,
        description: 'Generated image URL'
      }
    ]
  },
  
  IMAGE_TO_TEXT: {
    input: [
      {
        name: 'image',
        type: 'image',
        required: true,
        description: 'Input image to analyze'
      },
      {
        name: 'prompt',
        type: 'text',
        required: false,
        description: 'Optional prompt for analysis'
      }
    ],
    output: [
      {
        name: 'description',
        type: 'text',
        required: true,
        description: 'Text description of the image'
      }
    ]
  },
  
  TEXT_TO_SPEECH: {
    input: [
      {
        name: 'text',
        type: 'text',
        required: true,
        description: 'Text to convert to speech'
      },
      {
        name: 'voice',
        type: 'text',
        required: false,
        default: 'default',
        description: 'Voice to use for synthesis'
      }
    ],
    output: [
      {
        name: 'audio_url',
        type: 'audio',
        required: true,
        description: 'Generated audio URL'
      }
    ]
  },
  
  SPEECH_TO_TEXT: {
    input: [
      {
        name: 'audio',
        type: 'audio',
        required: true,
        description: 'Audio file to transcribe'
      }
    ],
    output: [
      {
        name: 'transcript',
        type: 'text',
        required: true,
        description: 'Transcribed text'
      }
    ]
  },
  
  VIDEO_GENERATION: {
    input: [
      {
        name: 'prompt',
        type: 'text',
        required: true,
        description: 'Text description for video generation'
      },
      {
        name: 'duration',
        type: 'number',
        required: false,
        default: 10,
        description: 'Video duration in seconds'
      }
    ],
    output: [
      {
        name: 'video_url',
        type: 'video',
        required: true,
        description: 'Generated video URL'
      }
    ]
  }
};

// Schema compatibility checking
export function isSchemaCompatible(outputSchema: SchemaField[], inputSchema: SchemaField[]): {
  compatible: boolean;
  mappings: Array<{ output: string; input: string; type: string }>;
  missing: string[];
  extra: string[];
} {
  const mappings: Array<{ output: string; input: string; type: string }> = [];
  const missing: string[] = [];
  const extra: string[] = [];

  // Check required input fields
  for (const inputField of inputSchema) {
    if (inputField.required) {
      const matchingOutput = outputSchema.find(output => 
        output.type === inputField.type || 
        (output.type === 'text' && inputField.type === 'text')
      );
      
      if (matchingOutput) {
        mappings.push({
          output: matchingOutput.name,
          input: inputField.name,
          type: inputField.type
        });
      } else {
        missing.push(inputField.name);
      }
    }
  }

  // Find extra output fields that could be mapped
  for (const outputField of outputSchema) {
    const isMapped = mappings.some(mapping => mapping.output === outputField.name);
    if (!isMapped) {
      extra.push(outputField.name);
    }
  }

  const compatible = missing.length === 0;
  
  return { compatible, mappings, missing, extra };
}

// Generate dynamic form fields based on schema
export function generateFormFields(schema: SchemaField[], values: Record<string, any> = {}) {
  return schema.map(field => ({
    ...field,
    value: values[field.name] || field.default || '',
    id: `field-${field.name}`
  }));
}

// Validate form values against schema
export function validateFormValues(schema: SchemaField[], values: Record<string, any>): {
  valid: boolean;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};

  for (const field of schema) {
    const value = values[field.name];
    
    // Check required fields
    if (field.required && (!value || value === '')) {
      errors[field.name] = `${field.name} is required`;
      continue;
    }

    // Skip validation for empty optional fields
    if (!value || value === '') continue;

    // Type validation
    switch (field.type) {
      case 'number':
        if (isNaN(Number(value))) {
          errors[field.name] = `${field.name} must be a number`;
        } else if (field.validation) {
          const numValue = Number(value);
          if (field.validation.min !== undefined && numValue < field.validation.min) {
            errors[field.name] = `${field.name} must be at least ${field.validation.min}`;
          }
          if (field.validation.max !== undefined && numValue > field.validation.max) {
            errors[field.name] = `${field.name} must be at most ${field.validation.max}`;
          }
        }
        break;
      
      case 'text':
        if (field.validation?.pattern && !new RegExp(field.validation.pattern).test(value)) {
          errors[field.name] = `${field.name} format is invalid`;
        }
        if (field.validation?.enum && !field.validation.enum.includes(value)) {
          errors[field.name] = `${field.name} must be one of: ${field.validation.enum.join(', ')}`;
        }
        break;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

// Get compatible models for a given output schema
export function getCompatibleModels(
  outputSchema: SchemaField[], 
  availableModels: Array<{ id: string; name: string; input_schema?: any; output_schema?: any }>
) {
  return availableModels.filter(model => {
    if (!model.input_schema) return false;
    
    try {
      const inputSchema = typeof model.input_schema === 'string' 
        ? JSON.parse(model.input_schema) 
        : model.input_schema;
      
      const compatibility = isSchemaCompatible(outputSchema, inputSchema);
      return compatibility.compatible;
    } catch (error) {
      console.warn(`Error parsing schema for model ${model.name}:`, error);
      return false;
    }
  });
}

// Parse schema from string or object
export function parseSchema(schema: any): SchemaField[] {
  if (typeof schema === 'string') {
    try {
      const parsed = JSON.parse(schema);
      // If parsed is an object but not an array, and it's empty, treat as empty array
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) && Object.keys(parsed).length === 0) {
        return [];
      }
      return parsed;
    } catch (error) {
      console.warn('Error parsing schema string:', error);
      return [];
    }
  }
  // If schema is already an object (e.g., from Supabase JSONB), check if it's an empty object
  if (typeof schema === 'object' && schema !== null && !Array.isArray(schema) && Object.keys(schema).length === 0) {
    return [];
  }
  return Array.isArray(schema) ? schema : []; // Ensure it's an array, or return empty array
}

// Get schema template by name
export function getSchemaTemplate(templateName: string): ModelSchema | null {
  return SCHEMA_TEMPLATES[templateName as keyof typeof SCHEMA_TEMPLATES] || null;
} 