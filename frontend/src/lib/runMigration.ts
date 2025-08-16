import { migrationService } from './migration';

// Script to run migration and populate database
export const runFullMigration = async () => {
  try {
    console.log('🚀 Starting full database migration...');
    
    // Check current status
    const status = await migrationService.checkMigrationStatus();
    console.log('Current database status:', status);
    
    if (!status.needsMigration) {
      console.log('✅ Database is already up to date!');
      return;
    }
    
    // Run the migration
    await migrationService.runMigration();
    
    // Check final status
    const finalStatus = await migrationService.checkMigrationStatus();
    console.log('✅ Migration completed! Final status:', finalStatus);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Function to be called from browser console or admin interface
export const migrateData = () => {
  runFullMigration()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
    });
};

// Export for use in admin interface
export default migrateData; 