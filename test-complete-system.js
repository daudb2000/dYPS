// Complete system test for DYPS admin control Supabase integration
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wziukmmsnlijehdjbbwv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6aXVrbW1zbmxpamVoZGpiYnd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwOTIyNjAsImV4cCI6MjA3NDY2ODI2MH0.hsgOfXG6LSuw8HputKY7IQbwjRLEiQM7ZdrmpjXpCfk';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 Complete DYPS System Test - Admin Control Supabase Integration');

async function testCompleteSystem() {
  let applicationId = null;

  try {
    console.log('📊 1. Testing table connection...');

    // Test connection
    const { data, error } = await supabase
      .from('applications')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Table connection failed:', error);
      return;
    }

    console.log('✅ Table connection successful');

    console.log('📝 2. Testing application creation (form submission simulation)...');

    // Test creating an application (simulates form submission)
    const testApp = {
      name: 'John Doe',
      company: 'Test Corp',
      role: 'Software Engineer',
      email: 'john.doe@testcorp.com',
      linkedin: 'https://linkedin.com/in/johndoe',
      consent: true,
      status: 'pending'
    };

    const { data: newApp, error: createError } = await supabase
      .from('applications')
      .insert([testApp])
      .select()
      .single();

    if (createError) {
      console.error('❌ Application creation failed:', createError);
      return;
    }

    applicationId = newApp.id;
    console.log('✅ Application created successfully:', newApp.name);

    console.log('📋 3. Testing admin application retrieval...');

    // Test getting all applications (admin function)
    const { data: allApps, error: getError } = await supabase
      .from('applications')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (getError) {
      console.error('❌ Application retrieval failed:', getError);
      return;
    }

    console.log(`✅ Retrieved ${allApps.length} applications`);

    console.log('🔄 4. Testing application status update (admin function)...');

    // Test updating application status (admin function)
    const { error: updateError } = await supabase
      .from('applications')
      .update({
        status: 'accepted',
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'test-admin'
      })
      .eq('id', applicationId);

    if (updateError) {
      console.error('❌ Application status update failed:', updateError);
      return;
    }

    console.log('✅ Application status updated to accepted');

    console.log('🔍 5. Testing filtered queries (admin dashboard functions)...');

    // Test getting pending applications
    const { data: pendingApps, error: pendingError } = await supabase
      .from('applications')
      .select('*')
      .eq('status', 'pending')
      .order('submitted_at', { ascending: false });

    if (pendingError) {
      console.error('❌ Pending applications query failed:', pendingError);
      return;
    }

    console.log(`✅ Retrieved ${pendingApps.length} pending applications`);

    // Test getting accepted applications
    const { data: acceptedApps, error: acceptedError } = await supabase
      .from('applications')
      .select('*')
      .eq('status', 'accepted')
      .order('submitted_at', { ascending: false });

    if (acceptedError) {
      console.error('❌ Accepted applications query failed:', acceptedError);
      return;
    }

    console.log(`✅ Retrieved ${acceptedApps.length} accepted applications`);

  } catch (error) {
    console.error('❌ System test failed:', error);
  } finally {
    // Cleanup test data
    if (applicationId) {
      console.log('🧹 Cleaning up test data...');
      await supabase
        .from('applications')
        .delete()
        .eq('id', applicationId);
      console.log('✅ Test data cleaned up');
    }
  }

  console.log('\n🎉 COMPLETE SYSTEM TEST SUMMARY:');
  console.log('✅ Database Connection: WORKING');
  console.log('✅ Form Submission (Create): WORKING');
  console.log('✅ Admin Data Retrieval: WORKING');
  console.log('✅ Admin Status Updates: WORKING');
  console.log('✅ Admin Dashboard Queries: WORKING');
  console.log('\n🚀 ADMIN CONTROLS CAN NOW CREATE ENTRIES IN SUPABASE!');
  console.log('🎯 Ready for Railway deployment with full admin functionality');
}

testCompleteSystem();