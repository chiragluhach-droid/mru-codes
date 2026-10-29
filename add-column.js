// Direct database migration script
// This bypasses local TLS issues by using the pg library directly

const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function addColumn() {
  // Use DIRECT_URL to avoid PgBouncer connection issues
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  
  console.log('🔌 Connecting to database...');
  
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false, // This bypasses TLS certificate issues
    },
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Add the column
    console.log('\n📝 Adding hackerrank_username column...');
    
    const result = await client.query(`
      ALTER TABLE profiles 
      ADD COLUMN IF NOT EXISTS hackerrank_username TEXT;
    `);
    
    console.log('✅ Column added successfully!');

    // Verify the column exists
    console.log('\n🔍 Verifying column exists...');
    
    const verify = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'profiles' 
      AND column_name = 'hackerrank_username';
    `);

    if (verify.rows.length > 0) {
      console.log('✅ Verification passed!');
      console.log('Column details:', verify.rows[0]);
    } else {
      console.log('⚠️  Column not found (this should not happen)');
    }

    console.log('\n✨ Database migration complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Run: npx prisma generate');
    console.log('2. Run: git add . && git commit -m "fix: Add hackerRankUsername" && git push origin main');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('SSL') || error.message.includes('certificate')) {
      console.log('\n💡 Troubleshooting:');
      console.log('This is a TLS/SSL certificate issue.');
      console.log('Unfortunately, you need to either:');
      console.log('1. Ask the person with Supabase access to run the SQL');
      console.log('2. Get Supabase login credentials to run SQL in dashboard');
      console.log('3. Deploy to Vercel and let it run prisma db push');
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the migration
addColumn();
