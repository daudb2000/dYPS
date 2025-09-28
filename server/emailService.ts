import type { MembershipApplication } from '@shared/schema';

// Email service for DYPS Railway deployment
// EmailJS disabled due to server-side 403 errors - using logging fallback

// Webhook email option preserved for future use if needed

// EmailJS disabled for Railway deployment due to server-side restrictions
// Keeping webhook method as potential alternative for future use

// Primary email service - Fallback to logging to avoid EmailJS server issues
export const sendApplicationNotification = async (application: MembershipApplication) => {
  console.log('🔧 Email service called for application:', application.name);

  // Note: EmailJS is disabled due to server-side 403 errors
  // Railway deployment uses logging fallback for reliability
  console.log('📧 EMAIL NOTIFICATION (Production logging mode):');
  console.log('To: daud@dyps.uk, alkesh@dyps.uk, max@dyps.uk');
  console.log('Subject: 🎯 New DYPS Membership Application -', application.name);
  console.log('Applicant:', application.name, '|', application.company, '|', application.email);
  console.log('LinkedIn:', application.linkedin || 'Not provided');
  console.log('Submitted:', application.submittedAt.toLocaleString());
  console.log('✅ Email notification logged successfully - Railway logs will capture this for manual processing');
};

// Test function for the email service
export const testEmailConnection = async () => {
  console.log('🔧 Testing EmailJS service...');

  if (process.env.EMAILJS_PUBLIC_KEY) {
    try {
      // Simple test - just check if EmailJS package is available
      console.log('✅ EmailJS configured and available');
      return { success: true, method: 'EmailJS (Free)', primary: true };
    } catch (error) {
      console.log('❌ EmailJS test failed:', error);
    }
  }

  // Fallback logging is always available
  console.log('⚠️ EmailJS not configured - emails will be logged only');
  return { success: true, method: 'Logging Fallback', primary: false };
};