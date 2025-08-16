import { testDatabaseConnection } from './src/config/database.js';
import ReplicateService from './src/services/replicateService.js';
import dotenv from 'dotenv';

dotenv.config();

async function setupDatabase() {
  console.log('🚀 Setting up Video Generation Database...\n');
  
  // Test database connection
  console.log('1️⃣ Testing database connection...');
  const dbConnected = await testDatabaseConnection();
  
  if (!dbConnected) {
    console.log('❌ Database connection failed. Please check your .env file.');
    return;
  }
  
  console.log('✅ Database connection successful!\n');
  
  // Test Replicate connection
  console.log('2️⃣ Testing Replicate connection...');
  try {
    const replicateConnected = await ReplicateService.testConnection();
    if (replicateConnected) {
      console.log('✅ Replicate connection successful!\n');
    } else {
      console.log('❌ Replicate connection failed. Please check your REPLICATE_API_TOKEN.\n');
    }
  } catch (error) {
    console.log('❌ Replicate connection error:', error.message, '\n');
  }
  
  // Check account info
  console.log('3️⃣ Checking Replicate account...');
  try {
    const accountInfo = await ReplicateService.checkAccount();
    console.log('📊 Account info:', JSON.stringify(accountInfo, null, 2), '\n');
  } catch (error) {
    console.log('❌ Could not get account info:', error.message, '\n');
  }
  
  console.log('🎉 Setup complete!');
  console.log('\n📝 Next steps:');
  console.log('   1. Run the database schema: database-schema.sql');
  console.log('   2. Get the model version ID using: node get-model-version.js');
  console.log('   3. Update the service with the correct version ID');
  console.log('   4. Start your backend: npm run dev');
}

setupDatabase().catch(console.error); 