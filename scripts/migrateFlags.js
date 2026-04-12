/**
 * Data Migration Script: Migrate flag emojis to SVG paths
 * Location: scripts/migrateFlags.js
 * 
 * Run with: node scripts/migrateFlags.js
 * 
 * This script:
 * 1. Connects to Supabase
 * 2. Fetches all destinations with flag_emoji
 * 3. Maps emojis to SVG paths using the flag mapping utility
 * 4. Updates destinations table with flag_path values
 * 5. Logs results for verification
 */

const { createClient } = require('@supabase/supabase-js');

// ================================================================
// Flag Mapping (Mirror of src/lib/flagMapping.js)
// ================================================================
const countryToFlagMap = {
  'Bangladesh': '/country_flags/bangladesh_flag.svg',
  'South Korea': '/country_flags/south-korea_flag.svg',
  'Sri Lanka': '/country_flags/sri-lanka_flag.svg',
  'Vietnam': '/country_flags/vietnam_flag.svg',
  'bangladesh': '/country_flags/bangladesh_flag.svg',
  'south korea': '/country_flags/south-korea_flag.svg',
  'korea': '/country_flags/south-korea_flag.svg',
  'sri lanka': '/country_flags/sri-lanka_flag.svg',
  'vietnam': '/country_flags/vietnam_flag.svg',
};

function getCountryFlagPath(countryName) {
  if (!countryName) return null;
  if (countryToFlagMap[countryName]) return countryToFlagMap[countryName];
  const lowerCaseCountry = countryName.toLowerCase();
  if (countryToFlagMap[lowerCaseCountry]) return countryToFlagMap[lowerCaseCountry];
  return null;
}

// ================================================================
// Main Migration Logic
// ================================================================
async function migrateFlags() {
  try {
    // 1. Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error(
        'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables'
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    console.log('✓ Connected to Supabase');

    // 2. Fetch all destinations
    const { data: destinations, error: fetchError } = await supabase
      .from('destinations')
      .select('id, country_name, flag_emoji, flag_path');

    if (fetchError) throw fetchError;
    console.log(
      `✓ Fetched ${destinations.length} destinations from database`
    );

    // 3. Prepare updates
    const updates = [];
    const summary = {
      total: destinations.length,
      updated: 0,
      skipped: 0,
      alreadyHasPath: 0,
      noMappingFound: 0,
      failures: [],
    };

    for (const destination of destinations) {
      // Skip if already has flag_path
      if (destination.flag_path) {
        summary.alreadyHasPath++;
        continue;
      }

      // Get flag path from country name
      const flagPath = getCountryFlagPath(destination.country_name);

      if (flagPath) {
        updates.push({
          id: destination.id,
          country_name: destination.country_name,
          flagPath: flagPath,
        });
        summary.updated++;
      } else {
        summary.noMappingFound++;
        summary.failures.push({
          id: destination.id,
          country_name: destination.country_name,
          reason: 'No SVG mapping found for country',
        });
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`  Total destinations: ${summary.total}`);
    console.log(`  To be updated: ${summary.updated}`);
    console.log(`  Already have flag_path: ${summary.alreadyHasPath}`);
    console.log(`  No mapping found: ${summary.noMappingFound}`);

    // 4. Apply updates
    if (updates.length > 0) {
      console.log(`\n⏳ Applying ${updates.length} updates...`);

      // Batch update (using RPC or individual updates)
      let successCount = 0;
      let failureCount = 0;

      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('destinations')
          .update({ flag_path: update.flagPath })
          .eq('id', update.id);

        if (updateError) {
          failureCount++;
          summary.failures.push({
            id: update.id,
            country_name: update.country_name,
            reason: updateError.message,
          });
          console.error(
            `✗ Failed to update ${update.country_name}: ${updateError.message}`
          );
        } else {
          successCount++;
          console.log(`✓ Updated ${update.country_name} → ${update.flagPath}`);
        }
      }

      console.log(
        `\n✓ Successfully updated: ${successCount} destinations`
      );
      if (failureCount > 0) {
        console.log(`✗ Failed: ${failureCount} destinations`);
      }
    } else {
      console.log('\n✓ No updates required (all destinations already have flag_path)');
    }

    // 5. Log detailed results
    if (summary.failures.length > 0) {
      console.log(`\n⚠️  Issues found:`);
      summary.failures.forEach((failure) => {
        console.log(`   - ${failure.country_name}: ${failure.reason}`);
      });
      console.log(
        `\nNote: You may need to add SVG flags for these countries, or update the flag mapping.`
      );
    }

    // 6. Verify and fetch updated table
    const { data: updatedDestinations, error: verifyError } = await supabase
      .from('destinations')
      .select('country_name, flag_path')
      .not('flag_path', 'is', null);

    if (verifyError) throw verifyError;

    console.log(
      `\n✓ Verification: ${updatedDestinations.length} destinations now have flag_path set`
    );
    console.log('\nDestinations with SVG flags:');
    updatedDestinations.forEach((dest) => {
      console.log(`   - ${dest.country_name}: ${dest.flag_path}`);
    });

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration
migrateFlags();
