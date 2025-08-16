// Utility functions for analyzing and processing model schemas

export interface SchemaField {
  type: string;
  title?: string;
  description?: string;
  default?: any;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  enum?: string[];
  items?: any;
  properties?: any;
  required?: boolean;
  format?: string;
}

export interface ProcessedField extends SchemaField {
  fieldType: string;
  displayName: string;
  isRequired: boolean;
  hasOptions: boolean;
  options: string[];
}

// Analyze input schema and determine the best UI component for each field
export const analyzeInputSchema = (inputSchema: any): ProcessedField[] => {
  if (!inputSchema) return [];

  return Object.entries(inputSchema).map(([key, field]: [string, any]) => {
    const processedField: ProcessedField = {
      ...field,
      fieldType: determineFieldType(field),
      displayName: field.title || key,
      isRequired: field.required || false,
      hasOptions: !!(field.enum || field.options),
      options: field.enum || field.options || []
    };

    return processedField;
  });
};

// Determine the best UI component type based on schema field
export const determineFieldType = (field: SchemaField): string => {
  const { type, enum: enumValues, items, format, description } = field;

  // Handle enum/select fields
  if (enumValues && enumValues.length > 0) {
    return enumValues.length <= 3 ? 'radio' : 'select';
  }

  // Handle array fields
  if (type === 'array') {
    if (items?.type === 'string' && items?.enum) {
      return 'multiselect';
    }
    // Handle file arrays (multiple images, videos, etc.)
    if (items?.type === 'string' && (items?.format === 'uri' || description?.includes('image') || description?.includes('video') || description?.includes('audio'))) {
      return 'filearray';
    }
    return 'textarea'; // Default for arrays
  }

  // Handle boolean fields
  if (type === 'boolean') {
    return 'checkbox';
  }

  // Handle numeric fields with constraints
  if (type === 'integer' || type === 'number') {
    if (field.min !== undefined || field.max !== undefined) {
      return 'slider';
    }
    return 'number';
  }

  // Handle string fields with format
  if (type === 'string') {
    if (format === 'textarea' || description?.includes('long') || description?.includes('text') || description?.includes('prompt')) {
      return 'textarea';
    }
    if (format === 'uri' || format === 'file' || description?.includes('file') || description?.includes('upload') || description?.includes('image') || description?.includes('video') || description?.includes('audio')) {
      return 'file';
    }
    return 'text';
  }

  return 'text'; // Default fallback
};

// Generate appropriate default values based on field type
export const generateDefaultValue = (field: ProcessedField): any => {
  if (field.default !== undefined) {
    return field.default;
  }

  switch (field.fieldType) {
    case 'checkbox':
      return false;
    case 'multiselect':
      return [];
    case 'number':
    case 'slider':
      return field.min || 0;
    case 'select':
    case 'radio':
      return field.options[0] || '';
    default:
      return '';
  }
};

// Validate form data against schema
export const validateFormData = (formData: Record<string, any>, schema: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!schema) return { isValid: true, errors: [] };

  Object.entries(schema).forEach(([key, field]: [string, any]) => {
    const value = formData[key];

    // Check required fields
    if (field.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field.title || key} is required`);
      return;
    }

    // Check min/max constraints for numbers
    if (field.type === 'number' || field.type === 'integer') {
      const numValue = parseFloat(value);
      if (field.min !== undefined && numValue < field.min) {
        errors.push(`${field.title || key} must be at least ${field.min}`);
      }
      if (field.max !== undefined && numValue > field.max) {
        errors.push(`${field.title || key} must be at most ${field.max}`);
      }
    }

    // Check string length constraints
    if (field.type === 'string' && field.maxLength && value && value.length > field.maxLength) {
      errors.push(`${field.title || key} must be at most ${field.maxLength} characters`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Generate mock output based on output schema
export const generateMockOutput = (outputSchema: any, modelName: string): any => {
  if (!outputSchema) {
    return {
      type: 'text',
      content: `Generated result for ${modelName}`
    };
  }

  const outputType = outputSchema.type || 'text';
  
  switch (outputType) {
    case 'image':
      return {
        type: 'image',
        content: 'https://via.placeholder.com/512x512/666666/FFFFFF?text=Generated+Image',
        alt: 'Generated AI Image'
      };
    
    case 'video':
      return {
        type: 'video',
        content: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        format: 'mp4'
      };
    
    case 'audio':
      return {
        type: 'audio',
        content: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        format: 'wav'
      };
    
    case 'file':
      return {
        type: 'file',
        content: 'data:text/plain;base64,SGVsbG8gV29ybGQ=',
        filename: 'generated_result.txt',
        mimeType: 'text/plain'
      };
    
    case 'array':
      return {
        type: 'array',
        content: ['Item 1', 'Item 2', 'Item 3'],
        format: 'list'
      };
    
    case 'object':
      return {
        type: 'object',
        content: { key1: 'value1', key2: 'value2' },
        format: 'json'
      };
    
    default:
      return {
        type: 'text',
        content: `Generated ${outputType} result for ${modelName}`
      };
  }
};

// Get field help text based on schema
export const getFieldHelpText = (field: ProcessedField): string => {
  if (field.description) {
    return field.description;
  }

  switch (field.fieldType) {
    case 'slider':
      return `Choose a value between ${field.min || 0} and ${field.max || 100}`;
    case 'select':
      return `Select one of the available options`;
    case 'multiselect':
      return `Select one or more options`;
    case 'checkbox':
      return `Enable or disable this feature`;
    case 'file':
      return `Upload a file for processing`;
    case 'number':
      return `Enter a numeric value`;
    default:
      return '';
  }
}; 