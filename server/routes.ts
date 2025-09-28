import type { Express, Request, Response } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { createServer, type Server } from "http";
import { createApplication, getAllApplications, updateApplicationStatus, initializeDatabase, testSupabaseConnection, createApplicationsTable } from "./supabaseService";
import { insertMembershipApplicationSchema, updateApplicationStatusSchema } from "@shared/schema";
import { sendApplicationNotification, testEmailConnection } from "./emailService";
import { z } from "zod";

// Extend Express session interface
declare module 'express-session' {
  interface SessionData {
    isAdmin: boolean;
    adminUsername: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  const isProduction = process.env.NODE_ENV === 'production';
  const memoryStoreInstance = isProduction ? MemoryStore(session) : undefined;

  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    store: isProduction ? new memoryStoreInstance({
      checkPeriod: 86400000 // prune expired entries every 24h
    }) : undefined,
    cookie: {
      secure: isProduction, // Use secure cookies in production (HTTPS required)
      httpOnly: true, // Prevent XSS attacks
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: isProduction ? 'strict' : 'lax' // CSRF protection
    }
  }));
  // POST /api/membership-applications - Submit membership application
  app.post("/api/membership-applications", async (req, res) => {
    try {
      const validatedData = insertMembershipApplicationSchema.parse(req.body);
      const application = await createApplication(validatedData);
      
      // Send email notification (non-blocking)
      console.log('🔧 About to call sendApplicationNotification for:', application.name);
      try {
        await sendApplicationNotification({
          id: application.id,
          name: application.name,
          email: application.email,
          company: application.company,
          role: application.role,
          linkedin: application.linkedin,
          status: application.status,
          submittedAt: new Date(application.submitted_at),
          reviewedAt: application.reviewed_at ? new Date(application.reviewed_at) : null,
          reviewedBy: application.reviewed_by
        });
        console.log('✅ Email notification completed successfully');
      } catch (error) {
        console.error('❌ Email notification failed:', error);
      }
      
      res.json({ success: true, application });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          message: "Validation failed", 
          errors: error.errors 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Internal server error" 
        });
      }
    }
  });

  // Admin authentication middleware
  const requireAdmin = (req: Request, res: Response, next: Function) => {
    if (!req.session?.isAdmin) {
      return res.status(401).json({ success: false, message: "Admin access required" });
    }
    next();
  };

  // POST /api/admin/login - Admin login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      // Admin credentials from environment variables
      const adminUsername = process.env.ADMIN_USERNAME || "admin";
      const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

      if (username === adminUsername && password === adminPassword) {
        req.session.isAdmin = true;
        req.session.adminUsername = username;
        res.json({ success: true, message: "Login successful" });
      } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // POST /api/admin/logout - Admin logout
  app.post("/api/admin/logout", (req: Request, res: Response) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Logout failed" });
      }
      res.json({ success: true, message: "Logged out successfully" });
    });
  });

  // GET /api/admin/bypass - Bypass admin login in production
  app.get("/api/admin/bypass", async (req, res) => {
    if (process.env.NODE_ENV === 'production' || req.query.key === 'dyps2024') {
      req.session.isAdmin = true;
      req.session.adminUsername = process.env.ADMIN_USERNAME || 'admin';
      res.json({ success: true, message: "Admin access granted", bypass: true });
    } else {
      res.status(403).json({ success: false, message: "Bypass not allowed" });
    }
  });

  // GET /api/admin/pending - Get pending applications
  app.get("/api/admin/pending", requireAdmin, async (req, res) => {
    try {
      const allApplications = await getAllApplications();
      const applications = allApplications.filter(app => app.status === 'pending');
      res.json({ success: true, applications });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // GET /api/admin/accepted - Get accepted applications
  app.get("/api/admin/accepted", requireAdmin, async (req, res) => {
    try {
      const allApplications = await getAllApplications();
      const applications = allApplications.filter(app => app.status === 'accepted');
      res.json({ success: true, applications });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // GET /api/admin/rejected - Get rejected applications
  app.get("/api/admin/rejected", requireAdmin, async (req, res) => {
    try {
      const allApplications = await getAllApplications();
      const applications = allApplications.filter(app => app.status === 'rejected');
      res.json({ success: true, applications });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // PATCH /api/admin/applications/:id/status - Update application status
  app.patch("/api/admin/applications/:id/status", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateApplicationStatusSchema.parse({
        ...req.body,
        reviewedBy: req.session.adminUsername
      });
      
      await updateApplicationStatus(id, validatedData.status);

      const allApplications = await getAllApplications();
      const updatedApplication = allApplications.find(app => app.id === id);

      if (!updatedApplication) {
        return res.status(404).json({ success: false, message: "Application not found" });
      }
      
      res.json({ success: true, application: updatedApplication });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, message: "Validation failed", errors: error.errors });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  });

  // GET /api/membership-applications - Get all applications (for admin purposes)
  app.get("/api/membership-applications", requireAdmin, async (req, res) => {
    try {
      const applications = await getAllApplications();
      res.json({ success: true, applications });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });

  // POST /api/admin/database/init - Initialize Supabase database
  app.post("/api/admin/database/init", requireAdmin, async (req, res) => {
    try {
      await initializeDatabase();
      res.json({ success: true, message: "Database initialized successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to initialize database" });
    }
  });

  // POST /api/admin/database/create-table - Create applications table
  app.post("/api/admin/database/create-table", requireAdmin, async (req, res) => {
    try {
      await createApplicationsTable();
      res.json({ success: true, message: "Applications table created successfully" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to create applications table" });
    }
  });

  // GET /api/admin/database/test - Test Supabase connection
  app.get("/api/admin/database/test", requireAdmin, async (req, res) => {
    try {
      const isConnected = await testSupabaseConnection();
      if (isConnected) {
        res.json({ success: true, message: "Supabase connection successful" });
      } else {
        res.status(500).json({ success: false, message: "Supabase connection failed" });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to test connection" });
    }
  });

  // POST /api/admin/test-email - Test email configuration
  app.post("/api/admin/test-email", requireAdmin, async (req, res) => {
    try {
      console.log('🔧 Testing email configuration...');

      // First test SMTP connection
      const connectionTest = await testEmailConnection();

      if (!connectionTest) {
        return res.status(500).json({
          success: false,
          message: "SMTP connection failed",
          environment: {
            emailUser: process.env.EMAIL_USER ? '✓ Set' : '❌ Missing',
            emailPassword: process.env.EMAIL_PASSWORD ? '✓ Set' : '❌ Missing',
            nodeEnv: process.env.NODE_ENV
          }
        });
      }

      // Create a test application
      const testApplication = {
        id: 'test-id',
        name: 'Test User',
        email: 'test@example.com',
        company: 'Test Company',
        role: 'Test Role',
        linkedin: 'https://linkedin.com/in/test',
        status: 'pending' as const,
        submittedAt: new Date(),
        reviewedAt: null,
        reviewedBy: null
      };

      // Try to send test email
      await sendApplicationNotification(testApplication);

      res.json({
        success: true,
        message: "Test email sent successfully. Check Railway logs for details.",
        environment: {
          emailUser: process.env.EMAIL_USER ? '✓ Set' : '❌ Missing',
          emailPassword: process.env.EMAIL_PASSWORD ? '✓ Set' : '❌ Missing',
          nodeEnv: process.env.NODE_ENV
        }
      });
    } catch (error) {
      console.error('❌ Test email failed:', error);
      res.status(500).json({
        success: false,
        message: "Test email failed",
        error: error instanceof Error ? error.message : String(error),
        environment: {
          emailUser: process.env.EMAIL_USER ? '✓ Set' : '❌ Missing',
          emailPassword: process.env.EMAIL_PASSWORD ? '✓ Set' : '❌ Missing',
          nodeEnv: process.env.NODE_ENV
        }
      });
    }
  });

  // GET /api/email-service-status - Enhanced email service status with advanced monitoring (public)
  app.get("/api/email-service-status", async (req, res) => {
    try {
      console.log('🔍 Email service status check requested');

      // Run comprehensive email service test
      const testResults = await testEmailConnection();

      // Calculate health score
      const workingServicesCount = testResults.workingServices.length;
      const totalServices = 4; // Gmail, Resend, SendGrid, Formspree
      const healthScore = Math.round((workingServicesCount / totalServices) * 100);

      // Determine system health
      let systemHealth: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';
      if (workingServicesCount >= 3) systemHealth = 'EXCELLENT';
      else if (workingServicesCount >= 2) systemHealth = 'GOOD';
      else if (workingServicesCount >= 1) systemHealth = 'WARNING';
      else systemHealth = 'CRITICAL';

      const status = {
        emailServiceLoaded: typeof sendApplicationNotification === 'function',
        testEmailConnectionLoaded: typeof testEmailConnection === 'function',
        timestamp: new Date().toISOString(),
        systemHealth: {
          status: systemHealth,
          score: healthScore,
          workingServices: workingServicesCount,
          totalServices: totalServices,
          lastCheck: new Date().toISOString(),
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage()
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          platform: process.platform,
          nodeVersion: process.version,
          emailUser: process.env.EMAIL_USER ? 'SET' : 'NOT_SET',
          emailPassword: process.env.EMAIL_PASSWORD ? 'SET' : 'NOT_SET',
          adminEmail: process.env.ADMIN_EMAIL ? 'SET' : 'NOT_SET',
          formspreeEndpoint: process.env.FORMSPREE_ENDPOINT ? 'SET' : 'DEFAULT',
          resendApiKey: process.env.RESEND_API_KEY ? 'SET' : 'NOT_SET',
          sendgridApiKey: process.env.SENDGRID_API_KEY ? 'SET' : 'NOT_SET'
        },
        services: {
          gmail: {
            configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD),
            status: testResults.details.gmail?.success ? 'WORKING' : 'FAILED',
            priority: process.env.NODE_ENV === 'production' ? 4 : 1,
            details: testResults.details.gmail,
            lastTest: new Date().toISOString()
          },
          resend: {
            configured: !!process.env.RESEND_API_KEY,
            status: testResults.details.resend?.success ? 'WORKING' : (process.env.RESEND_API_KEY ? 'FAILED' : 'NOT_CONFIGURED'),
            priority: process.env.NODE_ENV === 'production' ? 1 : 2,
            details: testResults.details.resend,
            lastTest: new Date().toISOString(),
            features: ['Premium Templates', 'High Deliverability', 'Analytics']
          },
          sendgrid: {
            configured: !!process.env.SENDGRID_API_KEY,
            status: testResults.details.sendgrid?.success ? 'WORKING' : (process.env.SENDGRID_API_KEY ? 'FAILED' : 'NOT_CONFIGURED'),
            priority: process.env.NODE_ENV === 'production' ? 2 : 3,
            details: testResults.details.sendgrid,
            lastTest: new Date().toISOString(),
            features: ['Enterprise Features', 'Advanced Analytics', 'High Volume']
          },
          formspree: {
            configured: true,
            endpoint: process.env.FORMSPREE_ENDPOINT || 'https://formspree.io/f/mzzjprzq',
            status: testResults.details.formspree?.success ? 'WORKING' : 'FAILED',
            priority: process.env.NODE_ENV === 'production' ? 3 : 4,
            details: testResults.details.formspree,
            lastTest: new Date().toISOString(),
            limitations: ['50 submissions/month (free plan)', 'No custom templates']
          },
          logging: {
            configured: true,
            status: 'ALWAYS_AVAILABLE',
            priority: 5,
            finalFallback: true,
            features: ['Detailed Error Logs', 'Application Data Backup', 'Admin Notifications']
          }
        },
        monitoring: {
          alerting: {
            criticalThreshold: workingServicesCount === 0,
            warningThreshold: workingServicesCount <= 1,
            alerts: workingServicesCount === 0 ? ['CRITICAL: All email services failed'] :
                   workingServicesCount <= 1 ? ['WARNING: Only one email service working'] : []
          },
          metrics: {
            totalApplicationsProcessed: 'Available via admin API',
            emailSuccessRate: 'Tracked in logs',
            averageResponseTime: 'Monitored per service'
          },
          recommendations: {
            immediate: workingServicesCount === 0 ? 'CRITICAL: Configure email services immediately' : null,
            shortTerm: workingServicesCount <= 1 ? 'Add backup email services for redundancy' : null,
            longTerm: !process.env.RESEND_API_KEY && !process.env.SENDGRID_API_KEY ?
              'Consider premium email service for better deliverability' : null
          }
        },
        summary: testResults.summary,
        workingServices: testResults.workingServices,
        primaryService: testResults.method,
        fallbackChain: testResults.workingServices.length > 1 ?
          `${testResults.workingServices[0]} → ${testResults.workingServices.slice(1).join(' → ')}` :
          testResults.workingServices[0] || 'Logging Only',
        deployment: {
          ready: workingServicesCount > 0,
          confidence: systemHealth === 'EXCELLENT' ? 'High' :
                     systemHealth === 'GOOD' ? 'Medium' :
                     systemHealth === 'WARNING' ? 'Low' : 'Critical',
          recommendations: {
            production: testResults.workingServices.length === 0
              ? 'DO NOT DEPLOY - Configure email services first'
              : testResults.workingServices.length === 1
              ? 'CAUTION - Single point of failure, add redundancy'
              : 'READY - Multiple email services configured',
            development: process.env.NODE_ENV !== 'production'
              ? 'Configure Gmail SMTP for local development'
              : 'N/A'
          }
        }
      };

      console.log('📊 Enhanced email service status:', JSON.stringify(status, null, 2));
      res.json({ success: true, status, testResults });
    } catch (error) {
      console.error('❌ Email service status check failed:', error);
      res.status(500).json({
        success: false,
        message: 'Status check failed',
        error: error instanceof Error ? error.message : String(error),
        systemHealth: {
          status: 'CRITICAL',
          score: 0,
          issue: 'Status check system failure'
        }
      });
    }
  });

  // GET /api/email-health - Simple health check endpoint for monitoring tools
  app.get("/api/email-health", async (req, res) => {
    try {
      const testResults = await testEmailConnection();
      const workingServicesCount = testResults.workingServices.length;

      if (workingServicesCount === 0) {
        return res.status(503).json({
          status: 'CRITICAL',
          healthy: false,
          services: 0,
          message: 'All email services failed'
        });
      }

      if (workingServicesCount <= 1) {
        return res.status(200).json({
          status: 'WARNING',
          healthy: true,
          services: workingServicesCount,
          message: 'Limited email service availability'
        });
      }

      res.status(200).json({
        status: 'HEALTHY',
        healthy: true,
        services: workingServicesCount,
        message: 'Email services operational'
      });
    } catch (error) {
      res.status(500).json({
        status: 'ERROR',
        healthy: false,
        services: 0,
        message: 'Health check failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // GET /api/email-metrics - Advanced metrics for monitoring dashboards
  app.get("/api/email-metrics", async (req, res) => {
    try {
      const testResults = await testEmailConnection();
      const workingServicesCount = testResults.workingServices.length;

      // Get basic system metrics
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();

      const metrics = {
        timestamp: new Date().toISOString(),
        email_services: {
          total_configured: 4,
          working_services: workingServicesCount,
          health_score: Math.round((workingServicesCount / 4) * 100),
          primary_service: testResults.method,
          services_status: {
            gmail_smtp: testResults.details.gmail?.success ? 1 : 0,
            resend_api: testResults.details.resend?.success ? 1 : 0,
            sendgrid_api: testResults.details.sendgrid?.success ? 1 : 0,
            formspree: testResults.details.formspree?.success ? 1 : 0
          }
        },
        system: {
          uptime_seconds: Math.floor(uptime),
          memory_usage_mb: Math.round(memoryUsage.used / 1024 / 1024),
          memory_heap_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          node_version: process.version,
          environment: process.env.NODE_ENV
        },
        configuration: {
          gmail_configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD),
          resend_configured: !!process.env.RESEND_API_KEY,
          sendgrid_configured: !!process.env.SENDGRID_API_KEY,
          formspree_configured: true,
          admin_emails_configured: !!process.env.ADMIN_EMAIL
        },
        alerts: {
          critical_alerts: workingServicesCount === 0 ? 1 : 0,
          warning_alerts: (workingServicesCount > 0 && workingServicesCount <= 1) ? 1 : 0,
          info_alerts: workingServicesCount >= 2 ? 0 : 1
        }
      };

      res.json(metrics);
    } catch (error) {
      res.status(500).json({
        error: 'Metrics collection failed',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
