import Replicate from 'replicate';
import dotenv from 'dotenv';

dotenv.config();

async function getModelVersion() {
  try {
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    console.log('🔍 Looking for bytedance/seedance-1-lite model...');
    
    // Get the model
    const model = await replicate.models.get("bytedance/seedance-1-lite");
    console.log('✅ Model found:', model.id);
    console.log('📋 Model info:', {
      id: model.id,
      name: model.name,
      owner: model.owner,
      description: model.description
    });

    // Get the latest version
    const versions = await replicate.models.versions.list("bytedance/seedance-1-lite");
    const latestVersion = versions.results[0];
    
    console.log('🎯 Latest version:', {
      id: latestVersion.id,
      created_at: latestVersion.created_at,
      openapi_schema: latestVersion.openapi_schema ? 'Available' : 'Not available'
    });

    console.log('\n📝 Use this version ID in your service:');
    console.log(`version: "${latestVersion.id}"`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getModelVersion(); 