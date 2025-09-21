import nodemailer from 'nodemailer';
import type { MembershipApplication } from '@shared/schema';

// Create primary transporter (SSL port 465) - Optimized for Railway
const createPrimaryTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
      ciphers: 'SSLv3',
      servername: 'smtp.gmail.com'
    },
    connectionTimeout: 30000, // Increased for cloud environments
    greetingTimeout: 30000,
    socketTimeout: 30000,
    pool: false, // Disable connection pooling for Railway
    maxConnections: 1,
    maxMessages: 1,
    debug: process.env.NODE_ENV === 'production', // Enable debug in production
    logger: process.env.NODE_ENV === 'production'
  });
};

// Create fallback transporter (STARTTLS port 587) - Railway optimized
const createFallbackTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
      ciphers: 'SSLv3',
      servername: 'smtp.gmail.com'
    },
    connectionTimeout: 45000, // Extra time for Railway
    greetingTimeout: 30000,
    socketTimeout: 45000,
    pool: false,
    maxConnections: 1,
    maxMessages: 1,
    debug: process.env.NODE_ENV === 'production',
    logger: process.env.NODE_ENV === 'production'
  });
};

// Create final fallback using Gmail service shortcut - Railway safe
const createServiceTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false
    },
    pool: false,
    maxConnections: 1,
    maxMessages: 1,
    debug: process.env.NODE_ENV === 'production',
    logger: process.env.NODE_ENV === 'production'
  });
};

// Test connection with retries
export const testEmailConnection = async () => {
  console.log('🔧 Testing email connection...');

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('❌ Email configuration missing');
    return false;
  }

  const transporters = [
    { name: 'Primary (SSL 465)', transporter: createPrimaryTransporter() },
    { name: 'Fallback (STARTTLS 587)', transporter: createFallbackTransporter() },
    { name: 'Service (Gmail)', transporter: createServiceTransporter() }
  ];

  for (const { name, transporter } of transporters) {
    try {
      console.log(`📧 Testing ${name}...`);
      await transporter.verify();
      console.log(`✅ ${name} connection successful`);
      return { success: true, method: name, transporter };
    } catch (error) {
      console.error(`❌ ${name} failed:`, error);
    }
  }

  return false;
};

export const sendApplicationNotification = async (application: MembershipApplication) => {
  console.log('🔧 Email service called for application:', application.name);

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('❌ Email configuration missing:');
    console.error('EMAIL_USER:', process.env.EMAIL_USER ? '✓ Set' : '❌ Missing');
    console.error('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✓ Set' : '❌ Missing');
    return;
  }

  try {
    // Test connection and get working transporter
    console.log('🔗 Finding working SMTP connection...');
    const connectionResult = await testEmailConnection();

    if (!connectionResult || !connectionResult.success) {
      console.error('❌ All SMTP connection attempts failed');
      return;
    }

    console.log(`✅ Using ${connectionResult.method} for sending`);
    const transporter = connectionResult.transporter;

    // Use test email override if provided, otherwise use DYPS emails
    const recipients = process.env.TEST_EMAIL_OVERRIDE
      ? [process.env.TEST_EMAIL_OVERRIDE]
      : [
          'daud@dyps.uk',
          'alkesh@dyps.uk',
          'max@dyps.uk'
        ];

    console.log('📬 Email recipients:', recipients);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipients.join(', '),
      subject: `🎯 New DYPS Membership Application - ${application.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New DYPS Membership Application</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div style="max-width: 650px; margin: 0 auto; background: #ffffff; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">

            <!-- Header with DYPS Logo -->
            <div style="background: linear-gradient(135deg, #B45309 0%, #1E293B 100%); color: white; padding: 40px 30px; text-align: center; position: relative;">
              <div style="margin-bottom: 20px;">
                <!-- DYPS Logo SVG -->
                <div style="display: inline-block; width: 80px; height: 80px; background: rgba(255,255,255,0.15); border-radius: 50%; padding: 20px; margin-bottom: 15px;">
                  <div style="width: 40px; height: 40px; border: 3px solid #FEF3C7; border-radius: 50%; margin: 0 auto; position: relative;">
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-weight: bold; font-size: 18px; color: #FEF3C7;">D</div>
                  </div>
                </div>
              </div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">DYPS</h1>
              <p style="margin: 8px 0 0 0; color: #FEF3C7; font-size: 16px; font-weight: 500;">Deals Young Professional Society</p>
              <p style="margin: 5px 0 0 0; color: rgba(254, 243, 199, 0.8); font-size: 14px;">Manchester's Elite Professional Network</p>
            </div>

            <!-- Main Content -->
            <div style="padding: 40px 30px;">
              <!-- Alert Banner -->
              <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%); border: 1px solid #F59E0B; border-radius: 10px; padding: 20px; margin-bottom: 30px; text-align: center;">
                <div style="font-size: 24px; margin-bottom: 8px;">🚨</div>
                <h2 style="margin: 0; color: #92400E; font-size: 20px; font-weight: 700;">New Membership Application</h2>
                <p style="margin: 8px 0 0 0; color: #B45309; font-size: 14px;">Requires immediate review</p>
              </div>

              <!-- Applicant Details Card -->
              <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                <div style="background: linear-gradient(135deg, #1E293B 0%, #374151 100%); color: white; padding: 20px;">
                  <h3 style="margin: 0; font-size: 18px; font-weight: 600;">📋 Applicant Information</h3>
                </div>
                <div style="padding: 25px;">
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 12px 0; font-weight: 600; color: #1E293B; width: 30%;">👤 Name:</td>
                      <td style="padding: 12px 0; color: #374151;">${application.name}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 12px 0; font-weight: 600; color: #1E293B;">🏢 Company:</td>
                      <td style="padding: 12px 0; color: #374151;">${application.company}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 12px 0; font-weight: 600; color: #1E293B;">💼 Role:</td>
                      <td style="padding: 12px 0; color: #374151;">${application.role}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 12px 0; font-weight: 600; color: #1E293B;">📧 Email:</td>
                      <td style="padding: 12px 0;"><a href="mailto:${application.email}" style="color: #B45309; text-decoration: none; font-weight: 500;">${application.email}</a></td>
                    </tr>
                    ${application.linkedin ? `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 12px 0; font-weight: 600; color: #1E293B;">💼 LinkedIn:</td>
                      <td style="padding: 12px 0;"><a href="${application.linkedin}" style="color: #0066cc; text-decoration: none; font-weight: 500;" target="_blank">View Profile</a></td>
                    </tr>
                    ` : ''}
                    <tr>
                      <td style="padding: 12px 0; font-weight: 600; color: #1E293B;">⏰ Submitted:</td>
                      <td style="padding: 12px 0; color: #374151;">${application.submittedAt.toLocaleDateString('en-GB')} at ${application.submittedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>
                  </table>
                </div>
              </div>

              <!-- Action Required Section -->
              <div style="background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%); border: 1px solid #3B82F6; border-radius: 10px; padding: 25px; margin-bottom: 30px; text-align: center;">
                <div style="font-size: 20px; margin-bottom: 10px;">⚡</div>
                <h3 style="margin: 0 0 10px 0; color: #1E40AF; font-size: 18px; font-weight: 700;">Action Required</h3>
                <p style="margin: 0; color: #1E3A8A; font-size: 14px; line-height: 1.5;">
                  This application is awaiting your review. Please evaluate the candidate's suitability for Manchester's most exclusive deals community.
                </p>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 35px 0;">
                <a href="${process.env.REPLIT_DEV_DOMAIN || 'https://dyps.uk'}/admin/dashboard"
                   style="display: inline-block; background: linear-gradient(135deg, #B45309 0%, #1E293B 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(180, 83, 9, 0.3); transition: all 0.3s ease;">
                  🔍 Review Application
                </a>
              </div>

              <!-- Quick Stats -->
              <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-top: 30px;">
                <div style="text-align: center; color: #64748B; font-size: 13px;">
                  <p style="margin: 0 0 5px 0; font-weight: 600;">📊 DYPS Admin Dashboard</p>
                  <p style="margin: 0;">Manage applications • Review candidates • Build Manchester's elite network</p>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div style="background: #1E293B; color: #94A3B8; padding: 25px 30px; text-align: center;">
              <div style="margin-bottom: 15px;">
                <div style="display: inline-block; width: 40px; height: 40px; background: rgba(180, 83, 9, 0.2); border-radius: 50%; padding: 10px;">
                  <div style="width: 20px; height: 20px; border: 2px solid #B45309; border-radius: 50%; margin: 0 auto; position: relative;">
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-weight: bold; font-size: 10px; color: #B45309;">D</div>
                  </div>
                </div>
              </div>
              <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #F1F5F9;">DYPS</p>
              <p style="margin: 0 0 5px 0; font-size: 12px;">Deals Young Professional Society</p>
              <p style="margin: 0; font-size: 11px; color: #64748B;">Manchester's Referral-Only Society for Deal-Making Professionals</p>

              <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #374151; font-size: 10px; color: #64748B;">
                <p style="margin: 0;">This email was sent because a new membership application was submitted to DYPS.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    console.log('📤 Sending email...');
    await transporter.sendMail(mailOptions);
    console.log('✅ Application notification sent successfully to:', recipients.join(', '));
  } catch (error) {
    console.error('❌ Failed to send email notification:');
    console.error('Error details:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
};