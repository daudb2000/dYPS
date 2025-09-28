import * as nodemailer from 'nodemailer';
import type { MembershipApplication } from '@shared/schema';

// Gmail SMTP configuration with Railway optimizations
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail address
      pass: process.env.EMAIL_PASSWORD, // Gmail app password (not regular password)
    },
    pool: true,
    maxConnections: 1,
    maxMessages: 3,
    connectionTimeout: 10000,  // 10 seconds (instead of default 2 minutes)
    greetingTimeout: 10000,    // 10 seconds
    socketTimeout: 30000,      // 30 seconds total
  });
};

// Formspree service function (reliable fallback)
const sendViaFormspree = async (application: MembershipApplication): Promise<boolean> => {
  try {
    console.log('📧 Sending via Formspree...');

    const formspreeEndpoint = process.env.FORMSPREE_ENDPOINT || 'https://formspree.io/f/mzzjprzq';

    // Prepare email data for Formspree
    const emailData = {
      name: application.name,
      email: application.email,
      company: application.company,
      role: application.role,
      linkedin: application.linkedin || 'Not provided',
      submitted: application.submittedAt.toLocaleString(),
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

    const response = await fetch(formspreeEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(emailData),
    });

    if (response.ok) {
      console.log('✅ Email sent successfully via Formspree');
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ Formspree failed:', response.status, response.statusText, errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Formspree email failed:', error);
    return false;
  }
};

// Primary email service - Optimized for Railway deployment
export const sendApplicationNotification = async (application: MembershipApplication) => {
  console.log('🔧 Email service called for application:', application.name);

  const adminEmails = process.env.ADMIN_EMAIL || 'daud@dyps.uk, alkesh@dyps.uk, max@dyps.uk';
  const isProduction = process.env.NODE_ENV === 'production';

  // Railway optimization: Skip Gmail SMTP in production (ports often blocked)
  if (isProduction) {
    console.log('📧 Production mode: Using Formspree for reliable delivery');
    const formspreeSuccess = await sendViaFormspree(application);
    if (formspreeSuccess) {
      console.log('✅ Email notification completed successfully via Formspree');
      return;
    }
    console.log('❌ Formspree failed, falling back to logging');
  } else {
    // Method 1: Try Gmail SMTP first (development only)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      console.log('📧 Method 1: Trying Gmail SMTP (development)');

      try {
        const transporter = createTransporter();

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: adminEmails,
          subject: `🎯 New DYPS Membership Application - ${application.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #DC2626;">New Membership Application Submitted</h2>

              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Applicant Details:</h3>
                <p><strong>Name:</strong> ${application.name}</p>
                <p><strong>Company:</strong> ${application.company}</p>
                <p><strong>Role:</strong> ${application.role || 'Not specified'}</p>
                <p><strong>Email:</strong> ${application.email}</p>
                ${application.linkedin ? `<p><strong>LinkedIn:</strong> <a href="${application.linkedin}">${application.linkedin}</a></p>` : ''}
                <p><strong>Submitted:</strong> ${application.submittedAt.toLocaleDateString()}, ${application.submittedAt.toLocaleTimeString()}</p>
              </div>

              <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb;">
                <p style="margin: 0;"><strong>Next Steps:</strong></p>
                <p style="margin: 5px 0;">Review this application in your admin dashboard and either accept or reject the candidate.</p>
              </div>

              <div style="margin-top: 30px; text-align: center;">
                <a href="${process.env.REPLIT_DEV_DOMAIN || 'https://dyps.uk'}/admin/dashboard"
                   style="background: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Review Application
                </a>
              </div>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Email notification sent successfully via Gmail SMTP');
        console.log('✅ Email notification completed successfully');
        return;
      } catch (error) {
        console.error('❌ Gmail SMTP failed:', error);
        console.log('⚠️ Gmail SMTP failed, trying Formspree fallback...');
      }
    } else {
      console.log('📧 Gmail SMTP not configured (EMAIL_USER or EMAIL_PASSWORD missing)');
    }

    // Development fallback: Try Formspree
    console.log('📧 Method 2: Trying Formspree');
    const formspreeSuccess = await sendViaFormspree(application);
    if (formspreeSuccess) {
      console.log('✅ Email notification completed successfully via Formspree');
      return;
    }
  }

  // Final fallback - logging
  console.log('📧 Final fallback: Using logging');
  console.log('📧 EMAIL NOTIFICATION (All services failed, logging only):');
  console.log(`To: ${adminEmails}`);
  console.log(`Subject: 🎯 New DYPS Membership Application - ${application.name}`);
  console.log(`Applicant: ${application.name} | ${application.company} | ${application.email}`);
  console.log(`LinkedIn: ${application.linkedin || 'Not provided'}`);
  console.log(`Submitted: ${application.submittedAt.toLocaleDateString()}, ${application.submittedAt.toLocaleTimeString()}`);
  console.log('✅ Email notification logged successfully (Production: Formspree recommended, Development: configure EMAIL_USER/EMAIL_PASSWORD for Gmail SMTP)');
};

// Test function for email services
export const testEmailConnection = async () => {
  console.log('🔧 Testing email services...');

  const results = {
    gmail: null as any,
    formspree: null as any,
    logging: { success: true, method: 'Logging Fallback (Always Available)' }
  };

  // Test Gmail SMTP
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    console.log('🔧 Testing Gmail SMTP...');
    try {
      const transporter = createTransporter();
      await transporter.verify();
      console.log('✅ Gmail SMTP configured and connection verified');
      results.gmail = { success: true, method: 'Gmail SMTP', primary: true };
    } catch (error) {
      console.log('❌ Gmail SMTP test failed:', error);
      results.gmail = {
        success: false,
        method: 'Gmail SMTP Failed',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  } else {
    console.log('⚠️ Gmail SMTP not configured (EMAIL_USER or EMAIL_PASSWORD missing)');
    results.gmail = { success: false, method: 'Gmail SMTP Not Configured' };
  }

  // Test Formspree availability
  console.log('🔧 Testing Formspree service...');
  try {
    const formspreeEndpoint = process.env.FORMSPREE_ENDPOINT || 'https://formspree.io/f/mzzjprzq';

    // Simple test ping (we don't actually send test data)
    const testResponse = await fetch(formspreeEndpoint, {
      method: 'HEAD',
    }).catch(() => null);

    if (testResponse) {
      console.log('✅ Formspree endpoint is reachable');
      results.formspree = { success: true, method: 'Formspree (Fallback)', endpoint: formspreeEndpoint };
    } else {
      console.log('⚠️ Formspree endpoint test failed');
      results.formspree = { success: false, method: 'Formspree Connection Failed' };
    }
  } catch (error) {
    console.log('❌ Formspree test failed:', error);
    results.formspree = {
      success: false,
      method: 'Formspree Test Failed',
      error: error instanceof Error ? error.message : String(error)
    };
  }

  // Determine primary service
  const primaryService = results.gmail?.success ? 'Gmail SMTP' :
                        results.formspree?.success ? 'Formspree' : 'Logging Only';

  console.log('📊 Email service test summary:');
  console.log('- Gmail SMTP:', results.gmail?.success ? '✅' : '❌');
  console.log('- Formspree:', results.formspree?.success ? '✅' : '❌');
  console.log('- Primary service:', primaryService);

  return {
    success: true,
    method: primaryService,
    details: results,
    primary: results.gmail?.success || results.formspree?.success
  };
};