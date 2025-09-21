import type { Express, Request, Response } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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
      const application = await storage.createMembershipApplication(validatedData);
      
      // Send email notification (non-blocking)
      console.log('🔧 About to call sendApplicationNotification for:', application.name);
      try {
        await sendApplicationNotification(application);
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

  // GET /api/admin/pending - Get pending applications
  app.get("/api/admin/pending", requireAdmin, async (req, res) => {
    try {
      const applications = await storage.getPendingApplications();
      res.json({ success: true, applications });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // GET /api/admin/accepted - Get accepted applications
  app.get("/api/admin/accepted", requireAdmin, async (req, res) => {
    try {
      const applications = await storage.getAcceptedApplications();
      res.json({ success: true, applications });
    } catch (error) {
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // GET /api/admin/rejected - Get rejected applications
  app.get("/api/admin/rejected", requireAdmin, async (req, res) => {
    try {
      const applications = await storage.getRejectedApplications();
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
      
      const updatedApplication = await storage.updateApplicationStatus(id, validatedData);
      
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
      const applications = await storage.getMembershipApplications();
      res.json({ success: true, applications });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
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

  // GET /api/email-service-status - Check email service status (public)
  app.get("/api/email-service-status", async (req, res) => {
    try {
      console.log('🔍 Email service status check requested');

      const status = {
        emailServiceLoaded: typeof sendApplicationNotification === 'function',
        testEmailConnectionLoaded: typeof testEmailConnection === 'function',
        environment: {
          nodeEnv: process.env.NODE_ENV,
          emailjsPublicKey: process.env.EMAILJS_PUBLIC_KEY ? 'SET' : 'NOT_SET',
          formspreeEndpoint: process.env.FORMSPREE_ENDPOINT ? 'SET' : 'NOT_SET',
          testEmailOverride: process.env.TEST_EMAIL_OVERRIDE ? 'SET' : 'NOT_SET'
        }
      };

      console.log('📊 Email service status:', JSON.stringify(status, null, 2));
      res.json({ success: true, status });
    } catch (error) {
      console.error('❌ Email service status check failed:', error);
      res.status(500).json({
        success: false,
        message: 'Status check failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
