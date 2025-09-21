// Test script for Railway deployment
const RAILWAY_URL = process.env.RAILWAY_URL || 'YOUR_RAILWAY_URL_HERE';

async function testRailwayEmail() {
  console.log('🧪 Testing Railway email service...');
  console.log('🔗 Railway URL:', RAILWAY_URL);

  if (RAILWAY_URL === 'YOUR_RAILWAY_URL_HERE') {
    console.log('❌ Please set RAILWAY_URL environment variable or update this script');
    return;
  }

  const testApplication = {
    name: 'Railway Email Test',
    email: 'test-railway@example.com',
    company: 'Railway Test Co',
    role: 'Email Tester',
    linkedin: 'https://linkedin.com/in/railway-test',
    consent: true
  };

  try {
    console.log('📤 Submitting test application...');

    const response = await fetch(`${RAILWAY_URL}/api/membership-applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testApplication),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Application submitted successfully!');
      console.log('📋 Application ID:', result.application.id);
      console.log('⏰ Submitted at:', result.application.submittedAt);
      console.log('📧 Email notification should be triggered');
      console.log('\n🔍 Check Railway logs for email processing details');
    } else {
      console.log('❌ Application submission failed:');
      console.log('Status:', response.status);
      console.log('Error:', result);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.log('🔗 Make sure Railway URL is correct and accessible');
  }
}

// Run the test
testRailwayEmail();