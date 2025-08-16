/**
 * Field Type Mapping System
 * Maps field names to appropriate UI input types based on keywords
 */

export interface FieldTypeMapping {
  inputType: 'text' | 'textarea' | 'file' | 'filearray' | 'select' | 'number' | 'slider' | 'checkbox' | 'password' | 'url';
  accept?: string;
  multiple?: boolean;
  placeholder?: string;
  description?: string;
}

export const getFieldTypeMapping = (fieldName: string, fieldSchema: any): FieldTypeMapping => {
  const fieldNameLower = fieldName.toLowerCase();
  const description = fieldSchema?.description?.toLowerCase() || '';
  
  // Text-based inputs
  if (fieldNameLower.includes('prompt') || fieldNameLower.includes('text') || fieldNameLower.includes('description')) {
    return {
      inputType: 'textarea',
      placeholder: 'Enter your prompt or description...',
      description: 'Text input for prompts and descriptions'
    };
  }

  // Password/API Key inputs
  if (fieldNameLower.includes('api_key') || fieldNameLower.includes('key') || fieldNameLower.includes('password')) {
    return {
      inputType: 'password',
      placeholder: 'Enter your API key...',
      description: 'Secure input for API keys and passwords'
    };
  }

  // URL inputs
  if (fieldNameLower.includes('url') || fieldNameLower.includes('link') || fieldNameLower.includes('youtube')) {
    return {
      inputType: 'url',
      placeholder: 'Enter URL...',
      description: 'URL input for links and references'
    };
  }

  // Number inputs
  if (fieldNameLower.includes('width') || fieldNameLower.includes('height') || 
      fieldNameLower.includes('size') || fieldNameLower.includes('scale') || 
      fieldNameLower.includes('ratio') || fieldNameLower.includes('count') || 
      fieldNameLower.includes('steps') || fieldNameLower.includes('epochs') ||
      fieldNameLower.includes('strength') || fieldNameLower.includes('guidance') ||
      fieldNameLower.includes('temperature') || fieldNameLower.includes('seed')) {
    return {
      inputType: 'number',
      placeholder: 'Enter number...',
      description: 'Numeric input for parameters'
    };
  }

  // Slider inputs (for values with min/max constraints)
  if (fieldSchema?.min !== undefined || fieldSchema?.max !== undefined) {
    return {
      inputType: 'slider',
      description: 'Slider input with constraints'
    };
  }

  // Select inputs (for enum values)
  if (fieldSchema?.enum && fieldSchema.enum.length > 0) {
    return {
      inputType: 'select',
      description: 'Selection from predefined options'
    };
  }

  // Multiple image inputs
  if (fieldNameLower.includes('images') || fieldNameLower.includes('image_') && fieldNameLower.includes('_')) {
    return {
      inputType: 'filearray',
      accept: 'image/*',
      multiple: true,
      placeholder: 'Select multiple images...',
      description: 'Multiple image upload'
    };
  }

  // Single image inputs
  if (fieldNameLower.includes('image') || fieldNameLower.includes('photo') || 
      fieldNameLower.includes('picture') || fieldNameLower.includes('img')) {
    return {
      inputType: 'file',
      accept: 'image/*',
      placeholder: 'Select an image...',
      description: 'Single image upload'
    };
  }

  // Multiple video inputs
  if (fieldNameLower.includes('videos') || fieldNameLower.includes('video_') && fieldNameLower.includes('_')) {
    return {
      inputType: 'filearray',
      accept: 'video/*',
      multiple: true,
      placeholder: 'Select multiple videos...',
      description: 'Multiple video upload'
    };
  }

  // Single video inputs
  if (fieldNameLower.includes('video') || fieldNameLower.includes('mp4')) {
    return {
      inputType: 'file',
      accept: 'video/*',
      placeholder: 'Select a video...',
      description: 'Single video upload'
    };
  }

  // Multiple audio inputs
  if (fieldNameLower.includes('audios') || fieldNameLower.includes('audio_') && fieldNameLower.includes('_')) {
    return {
      inputType: 'filearray',
      accept: 'audio/*',
      multiple: true,
      placeholder: 'Select multiple audio files...',
      description: 'Multiple audio upload'
    };
  }

  // Single audio inputs
  if (fieldNameLower.includes('audio') || fieldNameLower.includes('voice') || 
      fieldNameLower.includes('sound') || fieldNameLower.includes('speaker')) {
    return {
      inputType: 'file',
      accept: 'audio/*',
      placeholder: 'Select an audio file...',
      description: 'Single audio upload'
    };
  }

  // File inputs (general)
  if (fieldNameLower.includes('file') || fieldNameLower.includes('upload') || 
      fieldNameLower.includes('zip') || fieldNameLower.includes('archive') ||
      fieldNameLower.includes('document') || fieldNameLower.includes('pdf')) {
    return {
      inputType: 'file',
      accept: '*/*',
      placeholder: 'Select a file...',
      description: 'File upload'
    };
  }

  // Multiple file inputs
  if (fieldNameLower.includes('files') || fieldNameLower.includes('dataset')) {
    return {
      inputType: 'filearray',
      accept: '*/*',
      multiple: true,
      placeholder: 'Select multiple files...',
      description: 'Multiple file upload'
    };
  }

  // Boolean inputs
  if (fieldNameLower.includes('enable') || fieldNameLower.includes('disable') || 
      fieldNameLower.includes('use') || fieldNameLower.includes('apply') ||
      fieldNameLower.includes('flag')) {
    return {
      inputType: 'checkbox',
      description: 'Boolean toggle input'
    };
  }

  // Default to text input
  return {
    inputType: 'text',
    placeholder: `Enter ${fieldName.replace(/_/g, ' ')}...`,
    description: 'Text input'
  };
};

// Helper function to get display name
export const getDisplayName = (fieldName: string): string => {
  return fieldName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
};

// Helper function to get field description
export const getFieldDescription = (fieldSchema: any): string => {
  return fieldSchema?.description || '';
};

// Helper function to check if field is required
export const isFieldRequired = (fieldName: string, requiredFields: string[]): boolean => {
  return requiredFields.includes(fieldName);
}; 