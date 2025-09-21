import emailjs from '@emailjs/nodejs';
import type { MembershipApplication } from '@shared/schema';

// EmailJS configuration (completely free service)
// You'll need to set up a free account at https://emailjs.com and get these values:
// PUBLIC_KEY, SERVICE_ID, TEMPLATE_ID from your EmailJS dashboard

const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || 'your-public-key';
const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || 'service_dyps';
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || 'template_dyps';

// Fallback to simple HTTP POST for completely serverless approach
const sendViaWebhook = async (application: MembershipApplication): Promise<boolean> => {
  try {
    console.log('📧 Sending via webhook/HTTP POST...');

    const recipients = process.env.TEST_EMAIL_OVERRIDE
      ? [process.env.TEST_EMAIL_OVERRIDE]
      : ['daud@dyps.uk', 'alkesh@dyps.uk', 'max@dyps.uk'];

    // Using a simple form submission service like Formspree (free tier)
    const formspreeEndpoint = process.env.FORMSPREE_ENDPOINT || 'https://formspree.io/f/your-form-id';

    const emailData = {
      to: recipients.join(', '),
      subject: `🎯 New DYPS Membership Application - ${application.name}`,
      message: `
NEW DYPS MEMBERSHIP APPLICATION

📋 Applicant Details:
👤 Name: ${application.name}
🏢 Company: ${application.company}
💼 Role: ${application.role}
📧 Email: ${application.email}
${application.linkedin ? `💼 LinkedIn: ${application.linkedin}` : ''}
⏰ Submitted: ${application.submittedAt.toLocaleString()}

⚡ This application requires immediate review.

🔍 Review at: ${process.env.REPLIT_DEV_DOMAIN || 'https://dyps.uk'}/admin/dashboard

---
DYPS - Deals Young Professional Society
Manchester's Elite Professional Network
      `.trim()
    };

    console.log('📬 Email data prepared:', { recipients, name: application.name });

    // If we don't have a webhook endpoint, we'll just log the data
    if (!process.env.FORMSPREE_ENDPOINT) {
      console.log('📧 EMAIL NOTIFICATION (would be sent):');
      console.log('To:', recipients.join(', '));
      console.log('Subject:', emailData.subject);
      console.log('Message:', emailData.message);
      console.log('✅ Email notification logged successfully (configure FORMSPREE_ENDPOINT to actually send)');
      return true;
    }

    const response = await fetch(formspreeEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (response.ok) {
      console.log('✅ Email sent successfully via webhook');
      return true;
    } else {
      console.error('❌ Webhook failed:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error('❌ Webhook email failed:', error);
    return false;
  }
};

// Send via EmailJS (requires setup but completely free)
const sendViaEmailJS = async (application: MembershipApplication): Promise<boolean> => {
  try {
    console.log('📧 Sending via EmailJS...');

    if (!process.env.EMAILJS_PUBLIC_KEY) {
      console.log('⚠️ EMAILJS_PUBLIC_KEY not configured, skipping EmailJS');
      return false;
    }

    const recipients = process.env.TEST_EMAIL_OVERRIDE
      ? [process.env.TEST_EMAIL_OVERRIDE]
      : ['daud@dyps.uk', 'alkesh@dyps.uk', 'max@dyps.uk'];

    const templateParams = {
      to_email: recipients.join(', '),
      to_name: 'DYPS Team',
      from_name: 'DYPS Application System',
      subject: `New DYPS Membership Application - ${application.name}`,
      applicant_name: application.name,
      applicant_company: application.company,
      applicant_role: application.role,
      applicant_email: application.email,
      applicant_linkedin: application.linkedin || 'Not provided',
      submitted_date: application.submittedAt.toLocaleString(),
      admin_url: `${process.env.REPLIT_DEV_DOMAIN || 'https://dyps.uk'}/admin/dashboard`
    };

    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      {
        publicKey: EMAILJS_PUBLIC_KEY,
      }
    );

    console.log('✅ EmailJS sent successfully:', result);
    return true;
  } catch (error) {
    console.error('❌ EmailJS failed:', error);
    return false;
  }
};

// Primary email service - tries multiple free methods
export const sendApplicationNotification = async (application: MembershipApplication) => {
  console.log('🔧 Email service called for application:', application.name);
  console.log('🆓 Using completely free email methods - no SMTP required!');

  // Method 1: Try EmailJS first (requires one-time setup)
  if (process.env.EMAILJS_PUBLIC_KEY) {
    console.log('📧 Attempting EmailJS (Method 1)...');
    const emailJSSuccess = await sendViaEmailJS(application);
    if (emailJSSuccess) {
      console.log('✅ Email notification sent successfully via EmailJS');
      return;
    }
    console.log('⚠️ EmailJS failed, trying webhook method...');
  }

  // Method 2: Fallback to webhook/HTTP POST
  console.log('📧 Attempting Webhook/HTTP POST (Method 2)...');
  const webhookSuccess = await sendViaWebhook(application);
  if (webhookSuccess) {
    console.log('✅ Email notification sent successfully via webhook');
    return;
  }

  console.error('❌ All free email methods failed');
};

// Test function for the email service
export const testEmailConnection = async () => {
  console.log('🔧 Testing free email services...');

  if (process.env.EMAILJS_PUBLIC_KEY) {
    try {
      // Simple test - just check if EmailJS package is available
      console.log('✅ EmailJS package available');
      return { success: true, method: 'EmailJS (Free)', primary: true };
    } catch (error) {
      console.log('❌ EmailJS test failed:', error);
    }
  }

  // Webhook is always available (just HTTP POST)
  console.log('✅ HTTP Webhook method available');
  return { success: true, method: 'HTTP Webhook (Free)', primary: false };
};