import * as nodemailer from 'nodemailer';
import type { MembershipApplication } from '@shared/schema';

// Enhanced logging function
function emailLog(level: 'INFO' | 'ERROR' | 'SUCCESS' | 'WARN', message: string, details?: any) {
  const timestamp = new Date().toISOString();
  const emoji = level === 'SUCCESS' ? '✅' : level === 'ERROR' ? '❌' : level === 'WARN' ? '⚠️' : '🔧';
  console.log(`[${timestamp}] ${emoji} EMAIL ${level}: ${message}`);
  if (details) {
    console.log(`[${timestamp}] 📊 Details:`, JSON.stringify(details, null, 2));
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

// Enhanced Formspree service with multiple submission methods
const sendViaFormspree = async (application: MembershipApplication): Promise<boolean> => {
  const formspreeEndpoint = process.env.FORMSPREE_ENDPOINT || 'https://formspree.io/f/mzzjprzq';

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

    const response = await fetch(formspreeEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'DYPS-Server/1.0'
      },
      body: formData.toString(),
    });

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

      const jsonResponse = await fetch(formspreeEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'DYPS-Server/1.0'
        },
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
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
};

// Resend API service (premium alternative)
const sendViaResend = async (application: MembershipApplication): Promise<boolean> => {
  if (!process.env.RESEND_API_KEY) {
    emailLog('WARN', 'Resend API key not configured');
    return false;
  }

  try {
    emailLog('INFO', 'Attempting Resend API submission');

    const adminEmails = (process.env.ADMIN_EMAIL || 'daud@dyps.uk,alkesh@dyps.uk,max@dyps.uk')
      .split(',')
      .map(email => email.trim());

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'DYPS <noreply@dyps.uk>',
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
      }),
    });

    if (response.ok) {
      const responseData = await response.json();
      emailLog('SUCCESS', 'Resend API submission successful', { response: responseData });
      return true;
    } else {
      const errorText = await response.text();
      emailLog('ERROR', 'Resend API failed', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return false;
    }
  } catch (error) {
    emailLog('ERROR', 'Resend API submission threw exception', {
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
};

// SendGrid API service (another premium alternative)
const sendViaSendGrid = async (application: MembershipApplication): Promise<boolean> => {
  if (!process.env.SENDGRID_API_KEY) {
    emailLog('WARN', 'SendGrid API key not configured');
    return false;
  }

  try {
    emailLog('INFO', 'Attempting SendGrid API submission');

    const adminEmails = (process.env.ADMIN_EMAIL || 'daud@dyps.uk,alkesh@dyps.uk,max@dyps.uk')
      .split(',')
      .map(email => ({ email: email.trim() }));

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: {
          email: process.env.SENDGRID_FROM_EMAIL || 'noreply@dyps.uk',
          name: 'DYPS Membership System'
        },
        personalizations: [{
          to: adminEmails,
          subject: `🎯 New DYPS Membership Application - ${application.name}`
        }],
        content: [{
          type: 'text/html',
          value: `
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

              <div style="margin-top: 30px; text-align: center;">
                <a href="${process.env.REPLIT_DEV_DOMAIN || 'https://dyps.uk'}/admin/dashboard"
                   style="background: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Review Application
                </a>
              </div>
            </div>
          `
        }]
      }),
    });

    if (response.status === 202) { // SendGrid returns 202 for success
      emailLog('SUCCESS', 'SendGrid API submission successful');
      return true;
    } else {
      const errorText = await response.text();
      emailLog('ERROR', 'SendGrid API failed', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return false;
    }
  } catch (error) {
    emailLog('ERROR', 'SendGrid API submission threw exception', {
      error: error instanceof Error ? error.message : String(error)
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