import * as nodemailer from 'nodemailer';
import { Resend } from 'resend';
import sgMail from '@sendgrid/mail';
import type { MembershipApplication } from '@shared/schema';

// Enhanced logging function with production optimizations
function emailLog(level: 'INFO' | 'ERROR' | 'SUCCESS' | 'WARN', message: string, details?: any) {
  const timestamp = new Date().toISOString();
  const emoji = level === 'SUCCESS' ? '✅' : level === 'ERROR' ? '❌' : level === 'WARN' ? '⚠️' : '🔧';
  const isProduction = process.env.NODE_ENV === 'production';

  // Always log errors and successes in production, but limit INFO messages for performance
  if (isProduction && level === 'INFO' && !message.includes('Starting email notification')) {
    return; // Skip verbose INFO logs in production for performance
  }

  console.log(`[${timestamp}] ${emoji} EMAIL ${level}: ${message}`);

  if (details) {
    // In production, limit detail logging for performance unless it's an error
    if (!isProduction || level === 'ERROR' || level === 'WARN') {
      console.log(`[${timestamp}] 📊 Details:`, JSON.stringify(details, null, 2));
    }
  }
}

// Gmail SMTP configuration with Railway optimizations
const createTransporter = () => {
  emailLog('INFO', 'Creating Gmail SMTP transporter');
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

// Enhanced Formspree service with multiple submission methods and production optimizations
const sendViaFormspree = async (application: MembershipApplication): Promise<boolean> => {
  const formspreeEndpoint = process.env.FORMSPREE_ENDPOINT || 'https://formspree.io/f/mzzjprzq';
  const isProduction = process.env.NODE_ENV === 'production';

  emailLog('INFO', 'Starting Formspree submission', {
    endpoint: formspreeEndpoint,
    applicantName: application.name,
    applicantEmail: application.email
  });

  // Method 1: Try HTML form-compatible submission
  try {
    emailLog('INFO', 'Attempting Formspree Method 1: HTML Form Compatible');

    const formData = new URLSearchParams({
      _replyto: application.email,
      _subject: `🎯 New DYPS Membership Application - ${application.name}`,
      name: application.name,
      email: application.email,
      company: application.company,
      role: application.role,
      linkedin: application.linkedin || 'Not provided',
      message: `NEW DYPS MEMBERSHIP APPLICATION

📋 Applicant Details:
👤 Name: ${application.name}
🏢 Company: ${application.company}
💼 Role: ${application.role}
📧 Email: ${application.email}
${application.linkedin ? `💼 LinkedIn: ${application.linkedin}
` : ''}⏰ Submitted: ${application.submittedAt.toLocaleString()}

⚡ This application requires immediate review.

🔍 Review at: ${process.env.REPLIT_DEV_DOMAIN || 'https://dyps.uk'}/admin/dashboard

---
DYPS - Deals Young Professional Society
Manchester's Elite Professional Network`
    });

    // Production optimization: Add timeouts for Railway reliability
    const timeoutDuration = isProduction ? 15000 : 30000; // 15s in production, 30s in development
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

    const response = await fetch(formspreeEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'DYPS-Server/1.0'
      },
      body: formData.toString(),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    emailLog('INFO', 'Formspree response received', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (response.ok) {
      const responseData = await response.text();
      emailLog('SUCCESS', 'Formspree submission successful (Method 1)', { response: responseData });
      return true;
    } else {
      const errorText = await response.text();
      emailLog('ERROR', 'Formspree Method 1 failed', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });

      // Method 2: Try JSON submission for paid plans
      emailLog('INFO', 'Attempting Formspree Method 2: JSON submission');

      const jsonController = new AbortController();
      const jsonTimeoutId = setTimeout(() => jsonController.abort(), timeoutDuration);

      const jsonResponse = await fetch(formspreeEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'DYPS-Server/1.0'
        },
        signal: jsonController.signal,
        body: JSON.stringify({
          _replyto: application.email,
          _subject: `🎯 New DYPS Membership Application - ${application.name}`,
          name: application.name,
          email: application.email,
          company: application.company,
          role: application.role,
          linkedin: application.linkedin || 'Not provided',
          message: `NEW DYPS MEMBERSHIP APPLICATION

📋 Applicant Details:
👤 Name: ${application.name}
🏢 Company: ${application.company}
💼 Role: ${application.role}
📧 Email: ${application.email}
${application.linkedin ? `💼 LinkedIn: ${application.linkedin}
` : ''}⏰ Submitted: ${application.submittedAt.toLocaleString()}

⚡ This application requires immediate review.

🔍 Review at: ${process.env.REPLIT_DEV_DOMAIN || 'https://dyps.uk'}/admin/dashboard

---
DYPS - Deals Young Professional Society
Manchester's Elite Professional Network`
        }),
      });

      clearTimeout(jsonTimeoutId);

      if (jsonResponse.ok) {
        const responseData = await jsonResponse.text();
        emailLog('SUCCESS', 'Formspree submission successful (Method 2)', { response: responseData });
        return true;
      } else {
        const jsonErrorText = await jsonResponse.text();
        emailLog('ERROR', 'Formspree Method 2 also failed', {
          status: jsonResponse.status,
          statusText: jsonResponse.statusText,
          error: jsonErrorText
        });
        return false;
      }
    }
  } catch (error) {
    emailLog('ERROR', 'Formspree submission threw exception', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      isProductionTimeout: isProduction && error instanceof Error && error.name === 'AbortError'
    });
    return false;
  }
};

// Enhanced Resend API service with SDK (premium alternative)
const sendViaResend = async (application: MembershipApplication): Promise<boolean> => {
  if (!process.env.RESEND_API_KEY) {
    emailLog('WARN', 'Resend API key not configured');
    return false;
  }

  try {
    emailLog('INFO', 'Attempting Resend API submission with SDK');

    const resend = new Resend(process.env.RESEND_API_KEY);
    const adminEmails = (process.env.ADMIN_EMAIL || 'daud@dyps.uk,alkesh@dyps.uk,max@dyps.uk')
      .split(',')
      .map(email => email.trim());

    // Premium DYPS-branded email template matching website format
    const emailTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New DYPS Membership Application</title>
    <style>
        @media (max-width: 600px) {
            .grid-2 { grid-template-columns: 1fr !important; }
            .padding-responsive { padding: 20px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);">
    <div style="max-width: 800px; margin: 40px auto; background-color: white; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); overflow: hidden; border: 1px solid #e5e7eb;">

        <!-- Header with DYPS Branding -->
        <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%); padding: 40px 30px; position: relative; overflow: hidden;">
            <div style="position: absolute; top: -50%; right: -50%; width: 200%; height: 200%; background: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><circle cx=\"50\" cy=\"50\" r=\"2\" fill=\"white\" opacity=\"0.1\"/></svg>') repeat; opacity: 0.1;"></div>
            <div style="text-align: center; position: relative; z-index: 1;">
                <h1 style="color: white; margin: 0; font-size: 36px; font-weight: 800; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">DYPS</h1>
                <p style="color: rgba(255,255,255,0.95); margin: 8px 0 20px 0; font-size: 14px; letter-spacing: 2px; font-weight: 500; text-transform: uppercase;">Deals Young Professional Society</p>
                <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); padding: 12px 24px; border-radius: 50px; display: inline-block; border: 1px solid rgba(255,255,255,0.2);">
                    <span style="color: white; font-size: 16px; font-weight: 600;">🎯 New Membership Application Received</span>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="padding-responsive" style="padding: 40px;">

            <!-- Application Summary -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #f59e0b; border-radius: 12px; padding: 24px; margin-bottom: 32px; position: relative;">
                <div style="position: absolute; top: 16px; right: 16px; background: #f59e0b; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">URGENT</div>
                <h2 style="color: #92400e; margin: 0 0 12px 0; font-size: 20px; font-weight: 700;">📢 Application Summary</h2>
                <p style="color: #78350f; margin: 0; font-size: 16px; line-height: 1.5;">
                    <strong>${application.name}</strong> from <strong>${application.company}</strong> has submitted a membership application to join DYPS Manchester's elite professional network. This application requires immediate review and approval from the admin team.
                </p>
            </div>

            <!-- Applicant Profile Card -->
            <div style="border: 2px solid #e5e7eb; border-radius: 16px; overflow: hidden; margin-bottom: 32px; background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);">

                <!-- Profile Header -->
                <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 24px; border-bottom: 1px solid #e5e7eb; position: relative;">
                    <div style="position: absolute; top: 0; right: 0; bottom: 0; width: 4px; background: linear-gradient(to bottom, #dc2626, #b91c1c);"></div>
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #dc2626, #b91c1c); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; color: white; font-weight: bold;">
                            ${application.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 style="color: #1f2937; margin: 0 0 4px 0; font-size: 24px; font-weight: 700;">${application.name}</h3>
                            <p style="color: #6b7280; margin: 0; font-size: 14px; font-weight: 500;">${application.role || 'Professional'} at ${application.company}</p>
                        </div>
                    </div>
                </div>

                <!-- Profile Details -->
                <div style="padding: 32px;">
                    <div class="grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px;">

                        <!-- Company Info -->
                        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border-left: 4px solid #3b82f6;">
                            <div style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Company</div>
                            <div style="color: #1f2937; font-size: 18px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                                🏢 ${application.company}
                            </div>
                        </div>

                        <!-- Role Info -->
                        <div style="background: #f0f9ff; padding: 20px; border-radius: 12px; border-left: 4px solid #0ea5e9;">
                            <div style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Position</div>
                            <div style="color: #1f2937; font-size: 18px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                                💼 ${application.role || 'Not specified'}
                            </div>
                        </div>
                    </div>

                    <div class="grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">

                        <!-- Contact Info -->
                        <div style="background: #fef2f2; padding: 20px; border-radius: 12px; border-left: 4px solid #ef4444;">
                            <div style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Contact Email</div>
                            <div style="color: #1f2937; font-size: 16px; font-weight: 500;">
                                📧 <a href="mailto:${application.email}" style="color: #dc2626; text-decoration: none; font-weight: 600;">${application.email}</a>
                            </div>
                        </div>

                        <!-- LinkedIn Profile -->
                        <div style="background: #f0f9ff; padding: 20px; border-radius: 12px; border-left: 4px solid #0077b5;">
                            <div style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">LinkedIn Profile</div>
                            <div style="color: #1f2937; font-size: 16px; font-weight: 500;">
                                ${application.linkedin ?
                                    `🔗 <a href="${application.linkedin}" style="color: #0077b5; text-decoration: none; font-weight: 600;" target="_blank">View Professional Profile</a>` :
                                    '➖ <span style="color: #9ca3af;">Not provided</span>'
                                }
                            </div>
                        </div>
                    </div>

                    <!-- Submission Details -->
                    <div style="margin-top: 24px; padding-top: 24px; border-top: 2px solid #e5e7eb; background: #f9fafb; padding: 20px; border-radius: 12px;">
                        <div style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Application Submitted</div>
                        <div style="color: #1f2937; font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                            ⏰ ${application.submittedAt.toLocaleDateString('en-GB', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })} at ${application.submittedAt.toLocaleTimeString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Call to Action -->
            <div style="text-align: center; margin: 40px 0;">
                <a href="${process.env.REPLIT_DEV_DOMAIN || 'https://dyps.uk'}/admin"
                   style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%); color: white; text-decoration: none; padding: 18px 40px; border-radius: 12px; font-weight: 700; font-size: 18px; box-shadow: 0 10px 15px -3px rgba(220, 38, 38, 0.4), 0 4px 6px -2px rgba(220, 38, 38, 0.2); transform: translateY(0); transition: all 0.3s ease; border: 2px solid #dc2626;"
                   onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 20px 25px -5px rgba(220, 38, 38, 0.4), 0 10px 10px -5px rgba(220, 38, 38, 0.2)';"
                   onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 10px 15px -3px rgba(220, 38, 38, 0.4), 0 4px 6px -2px rgba(220, 38, 38, 0.2)';">
                    🔍 Review Application in Admin Panel
                </a>
                <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 14px;">Click above to access the admin dashboard and review this application</p>
            </div>

            <!-- Review Guidelines -->
            <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1px solid #3b82f6; border-radius: 12px; padding: 24px; margin-top: 32px;">
                <h4 style="color: #1e40af; margin: 0 0 16px 0; font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                    📋 Application Review Checklist
                </h4>
                <div style="color: #1e3a8a; margin: 0;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                        <div style="background: white; padding: 16px; border-radius: 8px; border-left: 3px solid #3b82f6;">
                            <strong style="color: #1e40af;">Professional Assessment</strong>
                            <ul style="margin: 8px 0 0 0; padding-left: 20px; line-height: 1.6;">
                                <li>Verify company and role information</li>
                                <li>Review professional background</li>
                                <li>Assess career progression</li>
                            </ul>
                        </div>
                        <div style="background: white; padding: 16px; border-radius: 8px; border-left: 3px solid #0ea5e9;">
                            <strong style="color: #0369a1;">Network Evaluation</strong>
                            <ul style="margin: 8px 0 0 0; padding-left: 20px; line-height: 1.6;">
                                <li>Check LinkedIn connections</li>
                                <li>Review endorsements and skills</li>
                                <li>Assess network quality</li>
                            </ul>
                        </div>
                    </div>
                    <div style="background: white; padding: 16px; border-radius: 8px; border-left: 3px solid #059669; text-align: center;">
                        <strong style="color: #047857;">Final Decision: </strong>
                        <span style="color: #065f46;">Make acceptance/rejection decision in the admin dashboard based on DYPS membership criteria</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div style="background: linear-gradient(135deg, #1f2937 0%, #111827 100%); color: white; padding: 32px; text-align: center; border-top: 4px solid #dc2626;">
            <div style="margin-bottom: 16px;">
                <div style="font-size: 24px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.5px;">DYPS</div>
                <div style="font-size: 14px; color: #9ca3af; font-weight: 500; letter-spacing: 1px;">MANCHESTER'S ELITE PROFESSIONAL NETWORK</div>
            </div>
            <div style="border-top: 1px solid #374151; padding-top: 16px; margin-top: 16px;">
                <p style="font-size: 12px; color: #6b7280; margin: 0; line-height: 1.5;">
                    This email was automatically generated by the DYPS membership system.<br>
                    For technical support or membership inquiries, contact the admin team.
                </p>
            </div>
        </div>
    </div>
</body>
</html>`;

    const emailData = {
      from: process.env.RESEND_FROM_EMAIL || 'DYPS <noreply@dyps.uk>',
      to: adminEmails,
      subject: `🎯 New DYPS Membership Application - ${application.name} (${application.company})`,
      html: emailTemplate,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      },
      tags: [
        {
          name: 'category',
          value: 'membership-application'
        },
        {
          name: 'applicant',
          value: application.name.toLowerCase().replace(/\s+/g, '-')
        }
      ]
    };

    emailLog('INFO', 'Sending premium email via Resend SDK', {
      to: adminEmails,
      subject: emailData.subject,
      tags: emailData.tags
    });

    const result = await resend.emails.send(emailData);

    if (result.data) {
      emailLog('SUCCESS', 'Resend API submission successful with SDK', {
        emailId: result.data.id,
        to: adminEmails
      });
      return true;
    } else {
      emailLog('ERROR', 'Resend API failed with SDK', {
        error: result.error
      });
      return false;
    }
  } catch (error) {
    emailLog('ERROR', 'Resend API submission threw exception', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
};

// SendGrid API service with SDK (premium alternative)
const sendViaSendGrid = async (application: MembershipApplication): Promise<boolean> => {
  if (!process.env.SENDGRID_API_KEY) {
    emailLog('WARN', 'SendGrid API key not configured');
    return false;
  }

  try {
    emailLog('INFO', 'Attempting SendGrid API submission with SDK');

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const adminEmails = (process.env.ADMIN_EMAIL || 'daud@dyps.uk,alkesh@dyps.uk,max@dyps.uk')
      .split(',')
      .map(email => email.trim());

    // Premium DYPS-branded email template for SendGrid matching website format
    const emailTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New DYPS Membership Application</title>
    <style>
        @media (max-width: 600px) {
            .grid-2 { grid-template-columns: 1fr !important; }
            .padding-responsive { padding: 20px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);">
    <div style="max-width: 800px; margin: 40px auto; background-color: white; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); overflow: hidden; border: 1px solid #e5e7eb;">

        <!-- Header with DYPS Branding -->
        <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%); padding: 40px 30px; position: relative; overflow: hidden;">
            <div style="text-align: center; position: relative; z-index: 1;">
                <h1 style="color: white; margin: 0; font-size: 36px; font-weight: 800; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">DYPS</h1>
                <p style="color: rgba(255,255,255,0.95); margin: 8px 0 20px 0; font-size: 14px; letter-spacing: 2px; font-weight: 500; text-transform: uppercase;">Deals Young Professional Society</p>
                <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); padding: 12px 24px; border-radius: 50px; display: inline-block; border: 1px solid rgba(255,255,255,0.2);">
                    <span style="color: white; font-size: 16px; font-weight: 600;">🎯 New Membership Application Received</span>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="padding-responsive" style="padding: 40px;">

            <!-- Application Summary -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #f59e0b; border-radius: 12px; padding: 24px; margin-bottom: 32px; position: relative;">
                <div style="position: absolute; top: 16px; right: 16px; background: #f59e0b; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">URGENT</div>
                <h2 style="color: #92400e; margin: 0 0 12px 0; font-size: 20px; font-weight: 700;">📢 Application Summary</h2>
                <p style="color: #78350f; margin: 0; font-size: 16px; line-height: 1.5;">
                    <strong>${application.name}</strong> from <strong>${application.company}</strong> has submitted a membership application to join DYPS Manchester's elite professional network. This application requires immediate review and approval from the admin team.
                </p>
            </div>

            <!-- Applicant Profile Card -->
            <div style="border: 2px solid #e5e7eb; border-radius: 16px; overflow: hidden; margin-bottom: 32px; background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);">

                <!-- Profile Header -->
                <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 24px; border-bottom: 1px solid #e5e7eb; position: relative;">
                    <div style="position: absolute; top: 0; right: 0; bottom: 0; width: 4px; background: linear-gradient(to bottom, #dc2626, #b91c1c);"></div>
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #dc2626, #b91c1c); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; color: white; font-weight: bold;">
                            ${application.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 style="color: #1f2937; margin: 0 0 4px 0; font-size: 24px; font-weight: 700;">${application.name}</h3>
                            <p style="color: #6b7280; margin: 0; font-size: 14px; font-weight: 500;">${application.role || 'Professional'} at ${application.company}</p>
                        </div>
                    </div>
                </div>

                <!-- Profile Details -->
                <div style="padding: 32px;">
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                        <tr>
                            <td style="width: 50%; padding-right: 12px; vertical-align: top;">
                                <!-- Company Info -->
                                <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border-left: 4px solid #3b82f6; margin-bottom: 16px;">
                                    <div style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Company</div>
                                    <div style="color: #1f2937; font-size: 18px; font-weight: 600;">
                                        🏢 ${application.company}
                                    </div>
                                </div>
                            </td>
                            <td style="width: 50%; padding-left: 12px; vertical-align: top;">
                                <!-- Role Info -->
                                <div style="background: #f0f9ff; padding: 20px; border-radius: 12px; border-left: 4px solid #0ea5e9; margin-bottom: 16px;">
                                    <div style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Position</div>
                                    <div style="color: #1f2937; font-size: 18px; font-weight: 600;">
                                        💼 ${application.role || 'Not specified'}
                                    </div>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td style="width: 50%; padding-right: 12px; vertical-align: top;">
                                <!-- Contact Info -->
                                <div style="background: #fef2f2; padding: 20px; border-radius: 12px; border-left: 4px solid #ef4444;">
                                    <div style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Contact Email</div>
                                    <div style="color: #1f2937; font-size: 16px; font-weight: 500;">
                                        📧 <a href="mailto:${application.email}" style="color: #dc2626; text-decoration: none; font-weight: 600;">${application.email}</a>
                                    </div>
                                </div>
                            </td>
                            <td style="width: 50%; padding-left: 12px; vertical-align: top;">
                                <!-- LinkedIn Profile -->
                                <div style="background: #f0f9ff; padding: 20px; border-radius: 12px; border-left: 4px solid #0077b5;">
                                    <div style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">LinkedIn Profile</div>
                                    <div style="color: #1f2937; font-size: 16px; font-weight: 500;">
                                        ${application.linkedin ?
                                            `🔗 <a href="${application.linkedin}" style="color: #0077b5; text-decoration: none; font-weight: 600;" target="_blank">View Professional Profile</a>` :
                                            '➖ <span style="color: #9ca3af;">Not provided</span>'
                                        }
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </table>

                    <!-- Submission Details -->
                    <div style="background: #f9fafb; padding: 20px; border-radius: 12px; border-top: 2px solid #e5e7eb;">
                        <div style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Application Submitted</div>
                        <div style="color: #1f2937; font-size: 16px; font-weight: 600;">
                            ⏰ ${application.submittedAt.toLocaleDateString('en-GB', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })} at ${application.submittedAt.toLocaleTimeString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Call to Action -->
            <div style="text-align: center; margin: 40px 0;">
                <a href="${process.env.REPLIT_DEV_DOMAIN || 'https://dyps.uk'}/admin"
                   style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%); color: white; text-decoration: none; padding: 18px 40px; border-radius: 12px; font-weight: 700; font-size: 18px; box-shadow: 0 10px 15px -3px rgba(220, 38, 38, 0.4), 0 4px 6px -2px rgba(220, 38, 38, 0.2); border: 2px solid #dc2626;">
                    🔍 Review Application in Admin Panel
                </a>
                <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 14px;">Click above to access the admin dashboard and review this application</p>
            </div>

            <!-- Review Guidelines -->
            <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1px solid #3b82f6; border-radius: 12px; padding: 24px;">
                <h4 style="color: #1e40af; margin: 0 0 16px 0; font-size: 18px; font-weight: 700;">
                    📋 Application Review Checklist
                </h4>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
                    <tr>
                        <td style="width: 50%; padding-right: 8px; vertical-align: top;">
                            <div style="background: white; padding: 16px; border-radius: 8px; border-left: 3px solid #3b82f6; margin-bottom: 8px;">
                                <strong style="color: #1e40af;">Professional Assessment</strong>
                                <ul style="margin: 8px 0 0 0; padding-left: 20px; line-height: 1.6; color: #1e3a8a;">
                                    <li>Verify company and role information</li>
                                    <li>Review professional background</li>
                                    <li>Assess career progression</li>
                                </ul>
                            </div>
                        </td>
                        <td style="width: 50%; padding-left: 8px; vertical-align: top;">
                            <div style="background: white; padding: 16px; border-radius: 8px; border-left: 3px solid #0ea5e9; margin-bottom: 8px;">
                                <strong style="color: #0369a1;">Network Evaluation</strong>
                                <ul style="margin: 8px 0 0 0; padding-left: 20px; line-height: 1.6; color: #1e3a8a;">
                                    <li>Check LinkedIn connections</li>
                                    <li>Review endorsements and skills</li>
                                    <li>Assess network quality</li>
                                </ul>
                            </div>
                        </td>
                    </tr>
                </table>
                <div style="background: white; padding: 16px; border-radius: 8px; border-left: 3px solid #059669; text-align: center;">
                    <strong style="color: #047857;">Final Decision: </strong>
                    <span style="color: #065f46;">Make acceptance/rejection decision in the admin dashboard based on DYPS membership criteria</span>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div style="background: linear-gradient(135deg, #1f2937 0%, #111827 100%); color: white; padding: 32px; text-align: center; border-top: 4px solid #dc2626;">
            <div style="margin-bottom: 16px;">
                <div style="font-size: 24px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.5px;">DYPS</div>
                <div style="font-size: 14px; color: #9ca3af; font-weight: 500; letter-spacing: 1px;">MANCHESTER'S ELITE PROFESSIONAL NETWORK</div>
            </div>
            <div style="border-top: 1px solid #374151; padding-top: 16px; margin-top: 16px;">
                <p style="font-size: 12px; color: #6b7280; margin: 0; line-height: 1.5;">
                    This email was automatically generated by the DYPS membership system.<br>
                    For technical support or membership inquiries, contact the admin team.
                </p>
            </div>
        </div>
    </div>
</body>
</html>`;

    const emailData = {
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@dyps.uk',
        name: 'DYPS Membership System'
      },
      to: adminEmails,
      subject: `🎯 New DYPS Membership Application - ${application.name} (${application.company})`,
      html: emailTemplate,
      headers: {
        'X-Priority': '1',
        'Priority': 'Urgent',
        'X-MSMail-Priority': 'High'
      },
      categories: ['membership-application', 'dyps-notifications'],
      customArgs: {
        'applicant_name': application.name.toLowerCase().replace(/\s+/g, '-'),
        'company': application.company.toLowerCase().replace(/\s+/g, '-'),
        'environment': process.env.NODE_ENV || 'development'
      }
    };

    emailLog('INFO', 'Sending premium email via SendGrid SDK', {
      to: adminEmails,
      subject: emailData.subject,
      categories: emailData.categories
    });

    const result = await sgMail.send(emailData);

    if (result && result[0] && result[0].statusCode === 202) {
      emailLog('SUCCESS', 'SendGrid API submission successful with SDK', {
        statusCode: result[0].statusCode,
        messageId: result[0].headers['x-message-id'],
        to: adminEmails
      });
      return true;
    } else {
      emailLog('ERROR', 'SendGrid API failed with SDK', {
        result: result
      });
      return false;
    }
  } catch (error) {
    emailLog('ERROR', 'SendGrid API submission threw exception', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
};

// Primary email service - Enhanced multi-provider system
export const sendApplicationNotification = async (application: MembershipApplication) => {
  emailLog('INFO', 'Starting email notification process', {
    applicantName: application.name,
    applicantEmail: application.email,
    environment: process.env.NODE_ENV,
    timestamp: application.submittedAt.toISOString()
  });

  const adminEmails = process.env.ADMIN_EMAIL || 'daud@dyps.uk,alkesh@dyps.uk,max@dyps.uk';
  const isProduction = process.env.NODE_ENV === 'production';

  // Email providers to try in order of preference
  const emailProviders = [];

  // In production, prioritize paid services, then free services
  if (isProduction) {
    if (process.env.RESEND_API_KEY) emailProviders.push({ name: 'Resend', fn: sendViaResend });
    if (process.env.SENDGRID_API_KEY) emailProviders.push({ name: 'SendGrid', fn: sendViaSendGrid });
    emailProviders.push({ name: 'Formspree', fn: sendViaFormspree });
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      emailProviders.push({ name: 'Gmail SMTP', fn: sendViaGmailSMTP });
    }
  } else {
    // In development, try Gmail first, then others
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      emailProviders.push({ name: 'Gmail SMTP', fn: sendViaGmailSMTP });
    }
    if (process.env.RESEND_API_KEY) emailProviders.push({ name: 'Resend', fn: sendViaResend });
    if (process.env.SENDGRID_API_KEY) emailProviders.push({ name: 'SendGrid', fn: sendViaSendGrid });
    emailProviders.push({ name: 'Formspree', fn: sendViaFormspree });
  }

  emailLog('INFO', `Attempting email delivery using ${emailProviders.length} providers`, {
    providers: emailProviders.map(p => p.name),
    environment: isProduction ? 'production' : 'development'
  });

  // Try each provider in sequence
  for (const provider of emailProviders) {
    emailLog('INFO', `Trying email provider: ${provider.name}`);

    try {
      const success = await provider.fn(application);
      if (success) {
        emailLog('SUCCESS', `Email notification completed successfully via ${provider.name}`, {
          provider: provider.name,
          applicantName: application.name,
          adminEmails: adminEmails
        });
        return;
      }
    } catch (error) {
      emailLog('ERROR', `${provider.name} provider threw exception`, {
        provider: provider.name,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Final fallback - comprehensive logging
  emailLog('WARN', 'All email providers failed, falling back to comprehensive logging');
  emailLog('ERROR', 'EMAIL NOTIFICATION FAILED - All services failed', {
    applicantDetails: {
      name: application.name,
      email: application.email,
      company: application.company,
      role: application.role,
      linkedin: application.linkedin || 'Not provided',
      submitted: application.submittedAt.toISOString()
    },
    adminEmails: adminEmails,
    environment: process.env.NODE_ENV,
    configuredServices: {
      gmail: !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD),
      resend: !!process.env.RESEND_API_KEY,
      sendgrid: !!process.env.SENDGRID_API_KEY,
      formspree: true
    },
    troubleshooting: {
      message: 'Check Railway logs for detailed error information',
      nextSteps: [
        'Verify environment variables are set correctly',
        'Check email service provider dashboards for quota limits',
        'Test email service status endpoint: /api/email-service-status',
        'Consider upgrading Formspree plan or adding paid email service'
      ]
    }
  });

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    ⚠️  EMAIL DELIVERY FAILED ⚠️                 ║
╠══════════════════════════════════════════════════════════════╣
║ Application Details:                                          ║
║ • Name: ${application.name.padEnd(50)} ║
║ • Email: ${application.email.padEnd(49)} ║
║ • Company: ${application.company.padEnd(47)} ║
║ • Role: ${(application.role || 'Not specified').padEnd(50)} ║
║ • LinkedIn: ${(application.linkedin || 'Not provided').padEnd(44)} ║
║ • Submitted: ${application.submittedAt.toLocaleString().padEnd(41)} ║
╠══════════════════════════════════════════════════════════════╣
║ 🚨 IMMEDIATE ACTION REQUIRED:                                 ║
║ • Check admin dashboard for new applications                  ║
║ • Manually contact applicant if needed                       ║
║ • Fix email service configuration                            ║
╚══════════════════════════════════════════════════════════════╝
  `);
};

// Gmail SMTP service function
const sendViaGmailSMTP = async (application: MembershipApplication): Promise<boolean> => {
  try {
    emailLog('INFO', 'Attempting Gmail SMTP submission');

    const transporter = createTransporter();
    const adminEmails = process.env.ADMIN_EMAIL || 'daud@dyps.uk,alkesh@dyps.uk,max@dyps.uk';

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: adminEmails,
      subject: `🎯 New DYPS Membership Application - ${application.name} (${application.company})`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New DYPS Membership Application</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; background: #f8fafc;">
    <div style="max-width: 700px; margin: 20px auto; background-color: white; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid #e5e7eb;">

        <!-- Header with DYPS Branding -->
        <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%); padding: 32px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.5px;">DYPS</h1>
            <p style="color: rgba(255,255,255,0.95); margin: 8px 0 16px 0; font-size: 13px; letter-spacing: 1.5px; font-weight: 500; text-transform: uppercase;">Deals Young Professional Society</p>
            <div style="background: rgba(255,255,255,0.15); padding: 10px 20px; border-radius: 25px; display: inline-block;">
                <span style="color: white; font-size: 15px; font-weight: 600;">🎯 New Membership Application</span>
            </div>
        </div>

        <!-- Main Content -->
        <div style="padding: 32px;">

            <!-- Application Summary -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #f59e0b; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
                <h2 style="color: #92400e; margin: 0 0 10px 0; font-size: 18px; font-weight: 700;">📢 Application Summary</h2>
                <p style="color: #78350f; margin: 0; font-size: 15px; line-height: 1.5;">
                    <strong>${application.name}</strong> from <strong>${application.company}</strong> has submitted a membership application to join DYPS Manchester's elite professional network.
                </p>
            </div>

            <!-- Applicant Profile -->
            <div style="border: 2px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
                <!-- Profile Header -->
                <div style="background: #f8fafc; padding: 20px; border-bottom: 1px solid #e5e7eb;">
                    <h3 style="color: #1f2937; margin: 0; font-size: 20px; font-weight: 700;">${application.name}</h3>
                    <p style="color: #6b7280; margin: 4px 0 0 0; font-size: 14px;">${application.role || 'Professional'} at ${application.company}</p>
                </div>

                <!-- Profile Details -->
                <div style="padding: 24px;">
                    <div style="margin-bottom: 16px;">
                        <div style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">Company & Role</div>
                        <div style="color: #1f2937; font-size: 16px; font-weight: 500;">🏢 ${application.company} • 💼 ${application.role || 'Not specified'}</div>
                    </div>

                    <div style="margin-bottom: 16px;">
                        <div style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">Contact Information</div>
                        <div style="color: #1f2937; font-size: 16px; font-weight: 500;">
                            📧 <a href="mailto:${application.email}" style="color: #dc2626; text-decoration: none;">${application.email}</a>
                        </div>
                        ${application.linkedin ? `
                        <div style="color: #1f2937; font-size: 16px; font-weight: 500; margin-top: 8px;">
                            🔗 <a href="${application.linkedin}" style="color: #0077b5; text-decoration: none;" target="_blank">View LinkedIn Profile</a>
                        </div>
                        ` : '<div style="color: #9ca3af; font-size: 14px; margin-top: 8px;">LinkedIn profile not provided</div>'}
                    </div>

                    <div>
                        <div style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">Submitted</div>
                        <div style="color: #1f2937; font-size: 16px; font-weight: 500;">
                            ⏰ ${application.submittedAt.toLocaleDateString('en-GB', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })} at ${application.submittedAt.toLocaleTimeString('en-GB', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Call to Action -->
            <div style="text-align: center; margin: 32px 0;">
                <a href="${process.env.REPLIT_DEV_DOMAIN || 'https://dyps.uk'}/admin"
                   style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.3);">
                    🔍 Review Application in Admin Panel
                </a>
                <p style="margin: 12px 0 0 0; color: #6b7280; font-size: 13px;">Click above to access the admin dashboard</p>
            </div>

            <!-- Quick Review Guide -->
            <div style="background: #eff6ff; border: 1px solid #3b82f6; border-radius: 10px; padding: 20px;">
                <h4 style="color: #1e40af; margin: 0 0 12px 0; font-size: 16px; font-weight: 700;">📋 Review Checklist</h4>
                <div style="color: #1e3a8a; font-size: 14px; line-height: 1.6;">
                    <div style="margin-bottom: 8px;">✓ Verify professional background and company</div>
                    <div style="margin-bottom: 8px;">✓ Review LinkedIn profile and network quality</div>
                    <div style="margin-bottom: 8px;">✓ Assess alignment with DYPS membership criteria</div>
                    <div>✓ Make final decision in admin dashboard</div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div style="background: #1f2937; color: white; padding: 24px; text-align: center;">
            <div style="font-size: 20px; font-weight: 800; margin-bottom: 4px;">DYPS</div>
            <div style="font-size: 12px; color: #9ca3af;">Manchester's Elite Professional Network</div>
        </div>
    </div>
</body>
</html>
      `,
    };

    await transporter.sendMail(mailOptions);
    emailLog('SUCCESS', 'Gmail SMTP submission successful');
    return true;
  } catch (error) {
    emailLog('ERROR', 'Gmail SMTP submission failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
};

// Enhanced test function for email services
export const testEmailConnection = async () => {
  emailLog('INFO', 'Starting comprehensive email service test');

  const results = {
    gmail: null as any,
    resend: null as any,
    sendgrid: null as any,
    formspree: null as any,
    logging: { success: true, method: 'Logging Fallback (Always Available)' }
  };

  // Test Gmail SMTP
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    emailLog('INFO', 'Testing Gmail SMTP connection');
    try {
      const transporter = createTransporter();
      await transporter.verify();
      emailLog('SUCCESS', 'Gmail SMTP connection verified');
      results.gmail = { success: true, method: 'Gmail SMTP', configured: true };
    } catch (error) {
      emailLog('ERROR', 'Gmail SMTP connection failed', { error: error instanceof Error ? error.message : String(error) });
      results.gmail = {
        success: false,
        method: 'Gmail SMTP Failed',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  } else {
    emailLog('WARN', 'Gmail SMTP not configured (EMAIL_USER or EMAIL_PASSWORD missing)');
    results.gmail = { success: false, method: 'Gmail SMTP Not Configured' };
  }

  // Test Resend API
  if (process.env.RESEND_API_KEY) {
    emailLog('INFO', 'Testing Resend API connection');
    try {
      const response = await fetch('https://api.resend.com/domains', {
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        },
      });
      if (response.ok) {
        emailLog('SUCCESS', 'Resend API connection verified');
        results.resend = { success: true, method: 'Resend API', configured: true };
      } else {
        emailLog('ERROR', 'Resend API connection failed', { status: response.status });
        results.resend = { success: false, method: 'Resend API Failed' };
      }
    } catch (error) {
      emailLog('ERROR', 'Resend API test failed', { error: error instanceof Error ? error.message : String(error) });
      results.resend = { success: false, method: 'Resend API Failed' };
    }
  } else {
    results.resend = { success: false, method: 'Resend API Not Configured' };
  }

  // Test SendGrid API
  if (process.env.SENDGRID_API_KEY) {
    emailLog('INFO', 'Testing SendGrid API connection');
    try {
      const response = await fetch('https://api.sendgrid.com/v3/user/account', {
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        },
      });
      if (response.ok) {
        emailLog('SUCCESS', 'SendGrid API connection verified');
        results.sendgrid = { success: true, method: 'SendGrid API', configured: true };
      } else {
        emailLog('ERROR', 'SendGrid API connection failed', { status: response.status });
        results.sendgrid = { success: false, method: 'SendGrid API Failed' };
      }
    } catch (error) {
      emailLog('ERROR', 'SendGrid API test failed', { error: error instanceof Error ? error.message : String(error) });
      results.sendgrid = { success: false, method: 'SendGrid API Failed' };
    }
  } else {
    results.sendgrid = { success: false, method: 'SendGrid API Not Configured' };
  }

  // Test Formspree availability
  emailLog('INFO', 'Testing Formspree service');
  try {
    const formspreeEndpoint = process.env.FORMSPREE_ENDPOINT || 'https://formspree.io/f/mzzjprzq';
    const testResponse = await fetch(formspreeEndpoint, {
      method: 'HEAD',
    }).catch(() => null);

    if (testResponse) {
      emailLog('SUCCESS', 'Formspree endpoint is reachable');
      results.formspree = { success: true, method: 'Formspree (Free Plan)', endpoint: formspreeEndpoint };
    } else {
      emailLog('WARN', 'Formspree endpoint test failed');
      results.formspree = { success: false, method: 'Formspree Connection Failed' };
    }
  } catch (error) {
    emailLog('ERROR', 'Formspree test failed', { error: error instanceof Error ? error.message : String(error) });
    results.formspree = {
      success: false,
      method: 'Formspree Test Failed',
      error: error instanceof Error ? error.message : String(error)
    };
  }

  // Determine primary service
  const workingServices = [
    results.gmail?.success && 'Gmail SMTP',
    results.resend?.success && 'Resend API',
    results.sendgrid?.success && 'SendGrid API',
    results.formspree?.success && 'Formspree'
  ].filter(Boolean);

  const primaryService = workingServices[0] || 'Logging Only';

  emailLog('INFO', 'Email service test summary', {
    gmail: results.gmail?.success ? '✅' : '❌',
    resend: results.resend?.success ? '✅' : '❌',
    sendgrid: results.sendgrid?.success ? '✅' : '❌',
    formspree: results.formspree?.success ? '✅' : '❌',
    primaryService,
    workingServices,
    totalWorkingServices: workingServices.length
  });

  return {
    success: true,
    method: primaryService,
    details: results,
    workingServices,
    primary: workingServices.length > 0,
    summary: {
      totalServices: 4,
      workingServices: workingServices.length,
      recommendedAction: workingServices.length === 0 ?
        'Configure at least one email service (Gmail SMTP, Resend, SendGrid, or upgrade Formspree)' :
        'Email system is operational with multiple fallbacks'
    }
  };
};