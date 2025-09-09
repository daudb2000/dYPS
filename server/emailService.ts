import nodemailer from 'nodemailer';
import type { MembershipApplication } from '@shared/schema';

// Create transporter using Gmail SMTP (free)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Gmail address
      pass: process.env.EMAIL_PASSWORD, // Gmail app password (not regular password)
    },
  });
};

export const sendApplicationNotification = async (application: MembershipApplication) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD || !process.env.ADMIN_EMAIL) {
    console.log('Email configuration missing, skipping email notification');
    return;
  }

  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `New DYPS Membership Application - ${application.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #DC2626;">New Membership Application Submitted</h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Applicant Details:</h3>
            <p><strong>Name:</strong> ${application.name}</p>
            <p><strong>Company:</strong> ${application.company}</p>
            <p><strong>Role:</strong> ${application.role}</p>
            <p><strong>Email:</strong> ${application.email}</p>
            <p><strong>Submitted:</strong> ${application.submittedAt.toLocaleDateString()} at ${application.submittedAt.toLocaleTimeString()}</p>
          </div>
          
          <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb;">
            <p style="margin: 0;"><strong>Next Steps:</strong></p>
            <p style="margin: 5px 0;">Review this application in your admin dashboard and either accept or reject the candidate.</p>
          </div>
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="${process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000'}/admin/dashboard" 
               style="background: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Review Application
            </a>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Application notification sent successfully');
  } catch (error) {
    console.error('Failed to send email notification:', error);
  }
};