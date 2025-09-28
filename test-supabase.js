// Test Supabase database connection and table creation directly
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wziukmmsnlijehdjbbwv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6aXVrbW1zbmxpamVoZGpiYnd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwOTIyNjAsImV4cCI6MjA3NDY2ODI2MH0.hsgOfXG6LSuw8HputKY7IQbwjRLEiQM7ZdrmpjXpCfk';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 Testing Supabase connection...');

async function testConnection() {
  try {
    console.log('📊 Testing simple connection...');

    // First, test if we can connect at all
    const { data, error } = await supabase
      .from('applications')
      .select('count', { count: 'exact', head: true });

    if (error && error.code === 'PGRST116') {
      console.log('⚠️ Applications table does not exist');
      console.log('🔧 Attempting to create table...');

      // Try to create the table
      await createTable();

    } else if (error) {
      console.error('❌ Database connection error:', error);
    } else {
      console.log('✅ Table exists and is accessible');
    }

    // Test creating an entry
    console.log('🔧 Testing application creation...');
    const testApp = {
      name: 'Test User',
      company: 'Test Company',
      role: 'Test Role',
      email: 'test@example.com',
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
      console.error('❌ Failed to create test application:', createError);
    } else {
      console.log('✅ Test application created successfully:', newApp);

      // Clean up - delete the test record
      await supabase
        .from('applications')
        .delete()
        .eq('email', 'test@example.com');

      console.log('🧹 Test record cleaned up');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function createTable() {
  const tableCreationSQL = `
    -- Create applications table
    CREATE TABLE IF NOT EXISTS applications (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT NOT NULL,
      role TEXT NOT NULL,
      email TEXT NOT NULL,
      linkedin TEXT,
      consent BOOLEAN NOT NULL DEFAULT false,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
      submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      reviewed_at TIMESTAMP WITH TIME ZONE,
      reviewed_by TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
    CREATE INDEX IF NOT EXISTS idx_applications_submitted_at ON applications(submitted_at);

    -- Enable Row Level Security
    ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

    -- Create policies for anon access (required for our anon key to work)
    CREATE POLICY IF NOT EXISTS "Allow anon read access" ON applications
      FOR SELECT USING (true);

    CREATE POLICY IF NOT EXISTS "Allow anon insert access" ON applications
      FOR INSERT WITH CHECK (true);

    CREATE POLICY IF NOT EXISTS "Allow anon update access" ON applications
      FOR UPDATE USING (true);
  `;

  console.log('🔧 Executing table creation SQL...');

  try {
    // Try using RPC function first
    const { error: sqlError } = await supabase.rpc('sql', {
      query: tableCreationSQL
    });

    if (sqlError) {
      console.log('⚠️ RPC sql function not available:', sqlError);
      console.log('📝 Manual table creation required. Please execute this SQL in Supabase SQL Editor:');
      console.log(tableCreationSQL);
    } else {
      console.log('✅ Table creation SQL executed successfully via RPC');
    }
  } catch (error) {
    console.log('⚠️ RPC approach failed:', error);
    console.log('📝 Manual table creation required. Please execute this SQL in Supabase SQL Editor:');
    console.log(tableCreationSQL);
  }
}

testConnection();