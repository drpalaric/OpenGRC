#!/usr/bin/env node

/**
 * Migration Script: Convert linkedControls from business IDs to UUIDs
 *
 * This script migrates existing risk data from the old format where linkedControls
 * contains business IDs (e.g., "IAC-15") to the new format using UUIDs.
 */

const API_BASE = 'http://localhost:3002/api/frameworks';

async function fetchJSON(url) {
  const response = await fetch(url);
  const data = await response.json();
  return data.data;
}

async function updateRisk(riskId, updates) {
  const response = await fetch(`${API_BASE}/risks/${riskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return response.json();
}

async function migrateLinkedControls() {
  console.log('🔄 Starting migration: Converting linkedControls from business IDs to UUIDs...\n');

  // Fetch all controls to build a lookup map
  console.log('📋 Fetching all controls...');
  const controls = await fetchJSON(`${API_BASE}/controls`);

  // Build a map: businessId -> UUID
  const controlIdToUuid = {};
  controls.forEach(control => {
    controlIdToUuid[control.controlId] = control.id;
  });
  console.log(`✅ Found ${controls.length} controls\n`);

  // Fetch all risks
  console.log('📋 Fetching all risks...');
  const risks = await fetchJSON(`${API_BASE}/risks`);
  console.log(`✅ Found ${risks.length} risks\n`);

  // Migrate each risk
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const risk of risks) {
    if (!risk.linkedControls || risk.linkedControls.length === 0) {
      console.log(`⏭️  Skipping ${risk.riskId}: No linked controls`);
      skippedCount++;
      continue;
    }

    // Check if already migrated (if first item looks like a UUID)
    const firstControl = risk.linkedControls[0];
    if (firstControl && firstControl.includes('-') && firstControl.length > 20) {
      console.log(`⏭️  Skipping ${risk.riskId}: Already using UUIDs`);
      skippedCount++;
      continue;
    }

    // Convert business IDs to UUIDs
    const convertedControls = [];
    const notFound = [];

    for (const businessId of risk.linkedControls) {
      const uuid = controlIdToUuid[businessId];
      if (uuid) {
        convertedControls.push(uuid);
      } else {
        notFound.push(businessId);
      }
    }

    if (notFound.length > 0) {
      console.log(`⚠️  Warning for ${risk.riskId}: Could not find UUIDs for: ${notFound.join(', ')}`);
    }

    if (convertedControls.length === 0) {
      console.log(`❌ Error for ${risk.riskId}: No valid control UUIDs found`);
      errorCount++;
      continue;
    }

    // Update the risk
    try {
      console.log(`🔄 Migrating ${risk.riskId}:`);
      console.log(`   Old: [${risk.linkedControls.join(', ')}]`);
      console.log(`   New: [${convertedControls.join(', ')}]`);

      await updateRisk(risk.id, {
        ...risk,
        linkedControls: convertedControls,
      });

      console.log(`✅ Successfully updated ${risk.riskId}\n`);
      updatedCount++;
    } catch (error) {
      console.error(`❌ Failed to update ${risk.riskId}:`, error.message);
      errorCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary:');
  console.log('='.repeat(60));
  console.log(`✅ Updated:  ${updatedCount} risks`);
  console.log(`⏭️  Skipped:  ${skippedCount} risks`);
  console.log(`❌ Errors:   ${errorCount} risks`);
  console.log(`📋 Total:    ${risks.length} risks`);
  console.log('='.repeat(60) + '\n');

  if (updatedCount > 0) {
    console.log('✨ Migration completed successfully!');
  } else if (errorCount > 0) {
    console.log('⚠️  Migration completed with errors');
    process.exit(1);
  } else {
    console.log('ℹ️  No migrations needed - all data already up to date');
  }
}

// Run migration
migrateLinkedControls().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
