import type { Express, Request, Response } from "express";
import session from "express-session";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMembershipApplicationSchema, updateApplicationStatusSchema } from "@shared/schema";
import { sendApplicationNotification } from "./emailService";
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
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));
  // POST /api/membership-applications - Submit membership application
  app.post("/api/membership-applications", async (req, res) => {
    try {
      const validatedData = insertMembershipApplicationSchema.parse(req.body);
      const application = await storage.createMembershipApplication(validatedData);
      
      // Send email notification (non-blocking)
      sendApplicationNotification(application).catch(console.error);
      
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
      
      // Simple admin check (you can enhance this later with proper hashing)
      if (username === "admin" && password === "admin123") {
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

  const httpServer = createServer(app);

  return httpServer;
}
