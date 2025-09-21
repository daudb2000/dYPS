#!/usr/bin/env node

// Railway Email Test Script
const RAILWAY_URL = 'https://dyps-production.up.railway.app';

async function testRailwayEmailService() {
  console.log('🧪 Testing Railway FREE EMAIL SERVICE...');
  console.log('🔗 URL:', RAILWAY_URL);

  const testApplication = {
    name: 'Railway FREE Email Test',
    email: 'test-railway-free@example.com',
    company: 'Railway Free Email Co',
    role: 'Free Email Tester',
    linkedin: 'https://linkedin.com/in/railway-free-email-test',
    consent: true
  };

  try {
    console.log('📤 Submitting test application with FREE email service...');

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
      console.log('📧 FREE Email notification should be triggered automatically');
      console.log('\n🔍 Check Railway deployment logs for:');
      console.log('   - "🆓 Using completely free email methods"');
      console.log('   - "📧 EMAIL NOTIFICATION (would be sent)"');
      console.log('   - "✅ Email notification sent successfully via webhook"');
    } else {
      console.log('❌ Application submission failed:');
      console.log('Status:', response.status);
      console.log('Error:', result);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.log('⏳ Railway might still be deploying. Wait a few minutes and try again.');
  }
}

// Run the test
testRailwayEmailService();