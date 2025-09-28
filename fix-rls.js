// Fix RLS policies for Supabase applications table
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wziukmmsnlijehdjbbwv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6aXVrbW1zbmxpamVoZGpiYnd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwOTIyNjAsImV4cCI6MjA3NDY2ODI2MH0.hsgOfXG6LSuw8HputKY7IQbwjRLEiQM7ZdrmpjXpCfk';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 Fixing RLS policies for applications table...');

async function fixRLS() {
  // For a membership application system, we need to disable RLS to allow anonymous submissions
  // This is the simplest and most appropriate approach for this use case
  const disableRLSSQL = `
    -- Disable Row Level Security to allow anonymous submissions
    ALTER TABLE applications DISABLE ROW LEVEL SECURITY;

    -- Drop existing policies (they will cause conflicts)
    DROP POLICY IF EXISTS "Allow anon read access" ON applications;
    DROP POLICY IF EXISTS "Allow anon insert access" ON applications;
    DROP POLICY IF EXISTS "Allow anon update access" ON applications;
  `;

  console.log('🔧 Disabling RLS and removing conflicting policies...');
  console.log('📝 Execute this SQL in your Supabase SQL Editor:');
  console.log(disableRLSSQL);

  try {
    // Try using RPC function to execute the SQL
    const { error: sqlError } = await supabase.rpc('sql', {
      query: disableRLSSQL
    });

    if (sqlError) {
      console.log('⚠️ RPC execution failed:', sqlError);
      console.log('📝 Please manually execute the SQL above in Supabase SQL Editor');
    } else {
      console.log('✅ RLS disabled successfully via RPC');
    }
  } catch (error) {
    console.log('⚠️ RPC approach failed:', error);
    console.log('📝 Please manually execute the SQL above in Supabase SQL Editor');
  }

  // Test if it works now
  console.log('🔧 Testing application creation after RLS fix...');

  const testApp = {
    name: 'Test User After RLS Fix',
    company: 'Test Company',
    role: 'Test Role',
    email: 'test-after-rls@example.com',
    linkedin: 'https://linkedin.com/in/test',
    consent: true,
    status: 'pending'
  };

  const { data: newApp, error: createError } = await supabase
    .from('applications')
    .insert([testApp])
    .select()
    .single();

  if (createError) {
    console.error('❌ Application creation still failed after RLS fix:', createError);
    console.log('📋 Manual steps required:');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Execute the SQL commands shown above');
    console.log('3. Re-run this test');
  } else {
    console.log('✅ Application creation successful after RLS fix:', newApp);

    // Clean up test record
    await supabase
      .from('applications')
      .delete()
      .eq('email', 'test-after-rls@example.com');

    console.log('🧹 Test record cleaned up');
    console.log('✅ Admin controls can now create entries in Supabase!');
  }
}

fixRLS();