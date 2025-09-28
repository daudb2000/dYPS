import * as nodemailer from 'nodemailer';
import type { MembershipApplication } from '@shared/schema';

// Gmail SMTP configuration (free and reliable)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail address
      pass: process.env.EMAIL_PASSWORD, // Gmail app password (not regular password)
    },
  });
};

// Primary email service - Gmail SMTP with fallback to logging
export const sendApplicationNotification = async (application: MembershipApplication) => {
  console.log('🔧 About to call sendApplicationNotification for:', application.name);

  const adminEmails = process.env.ADMIN_EMAIL || 'daud@dyps.uk, alkesh@dyps.uk, max@dyps.uk';

  // Try Gmail SMTP first if configured
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    console.log('🔧 Email service called for application:', application.name);
    console.log('📧 Using Gmail SMTP');

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
      console.error('❌ Failed to send email notification via Gmail SMTP:', error);
      console.log('⚠️ Gmail SMTP failed, falling back to logging...');
    }
  } else {
    console.log('📧 Gmail SMTP not configured (EMAIL_USER or EMAIL_PASSWORD missing)');
  }

  // Fallback to logging
  console.log('📧 EMAIL NOTIFICATION (Gmail SMTP not configured, logging only):');
  console.log(`To: ${adminEmails}`);
  console.log(`Subject: 🎯 New DYPS Membership Application - ${application.name}`);
  console.log(`Applicant: ${application.name} | ${application.company} | ${application.email}`);
  console.log(`LinkedIn: ${application.linkedin || 'Not provided'}`);
  console.log(`Submitted: ${application.submittedAt.toLocaleDateString()}, ${application.submittedAt.toLocaleTimeString()}`);
  console.log('✅ Email notification logged successfully (configure EMAIL_USER and EMAIL_PASSWORD to send actual emails)');
};

// Test function for Gmail SMTP
export const testEmailConnection = async () => {
  console.log('🔧 Testing Gmail SMTP service...');

  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    try {
      const transporter = createTransporter();
      // Verify SMTP connection
      await transporter.verify();
      console.log('✅ Gmail SMTP configured and connection verified');
      return { success: true, method: 'Gmail SMTP', primary: true };
    } catch (error) {
      console.log('❌ Gmail SMTP test failed:', error);
      return { success: false, method: 'Gmail SMTP Failed', primary: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  // Fallback logging is always available
  console.log('⚠️ Gmail SMTP not configured - emails will be logged only');
  return { success: true, method: 'Logging Fallback', primary: false };
};