#!/usr/bin/env node

/**
 * Migration Script: Convert linkedControls array to junction table
 *
 * This script migrates data from the old array-based linkedControls column
 * to the new risk_controls junction table for proper many-to-many relationships.
 */

const API_BASE = 'http://localhost:3002/api/frameworks';

async function fetchJSON(url) {
  const response = await fetch(url);
  const data = await response.json();
  return data.data;
}

async function createJunctionEntry(riskId, controlId) {
  const response = await fetch(`${API_BASE}/risks/${riskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      // Just trigger the update with linkedControls to create junction entries
      linkedControls: [controlId],
    }),
  });
  return response.json();
}

async function migrateToJunctionTable() {
  console.log('🔄 Starting migration: Array → Junction Table...\n');

  // Fetch all risks
  console.log('📋 Fetching all risks...');
  const response = await fetch(`${API_BASE}/risks`);
  const result = await response.json();
  const risks = result.data || [];
  console.log(`✅ Found ${risks.length} risks\n`);

  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const risk of risks) {
    // Check if the old linkedControls array exists
    if (!risk.linkedControls || risk.linkedControls.length === 0) {
      console.log(`⏭️  Skipping ${risk.riskId}: No linked controls in array`);
      skippedCount++;
      continue;
    }

    console.log(`\n🔄 Migrating ${risk.riskId}:`);
    console.log(`   Found ${risk.linkedControls.length} controls in array: [${risk.linkedControls.join(', ')}]`);

    try {
      // The API will handle creating junction entries when we update with linkedControls
      await fetch(`${API_BASE}/risks/${risk.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Send the linkedControls array - the service will create junction entries
          linkedControls: risk.linkedControls,
        }),
      });

      console.log(`   ✅ Successfully migrated to junction table`);
      migratedCount++;
    } catch (error) {
      console.error(`   ❌ Failed to migrate ${risk.riskId}:`, error.message);
      errorCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary:');
  console.log('='.repeat(60));
  console.log(`✅ Migrated:  ${migratedCount} risks`);
  console.log(`⏭️  Skipped:   ${skippedCount} risks`);
  console.log(`❌ Errors:    ${errorCount} risks`);
  console.log(`📋 Total:     ${risks.length} risks`);
  console.log('='.repeat(60) + '\n');

  if (migratedCount > 0) {
    console.log('✨ Migration completed successfully!');
    console.log('\nℹ️  Next steps:');
    console.log('1. Verify data in junction table: docker exec grc-postgres psql -U grcadmin -d grc -c "SELECT * FROM risk_controls;"');
    console.log('2. Test the frontend at http://localhost:3000');
    console.log('3. Once verified, remove the old linkedControls column from the schema');
  } else if (errorCount > 0) {
    console.log('⚠️  Migration completed with errors');
    process.exit(1);
  } else {
    console.log('ℹ️  No migrations needed - array is already empty or data already in junction table');
  }
}

// Run migration
migrateToJunctionTable().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
