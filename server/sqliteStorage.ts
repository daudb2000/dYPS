import Database from 'better-sqlite3';
import { type User, type InsertUser, type MembershipApplication, type InsertMembershipApplication, type UpdateApplicationStatus } from "@shared/schema";
import { randomUUID } from "crypto";
import type { IStorage } from "./storage";

export class SqliteStorage implements IStorage {
  private db: Database;

  constructor(dbPath: string = './dyps.db') {
    this.db = new Database(dbPath);
    this.initializeTables();
  }

  private initializeTables() {
    // Create users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )
    `);

    // Create membership_applications table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS membership_applications (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        company TEXT NOT NULL,
        role TEXT NOT NULL,
        linkedin TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        submitted_at TEXT NOT NULL,
        reviewed_at TEXT,
        reviewed_by TEXT
      )
    `);

    console.log('✅ Database tables initialized');
  }

  async getUser(id: string): Promise<User | undefined> {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    const user = stmt.get(id) as User | undefined;
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const stmt = this.db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username) as User | undefined;
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };

    const stmt = this.db.prepare('INSERT INTO users (id, username, password) VALUES (?, ?, ?)');
    stmt.run(user.id, user.username, user.password);

    return user;
  }

  async createMembershipApplication(insertApplication: InsertMembershipApplication): Promise<MembershipApplication> {
    const id = randomUUID();
    const submittedAt = new Date();
    const application: MembershipApplication = {
      ...insertApplication,
      id,
      status: "pending",
      submittedAt,
      reviewedAt: null,
      reviewedBy: null,
    };

    const stmt = this.db.prepare(`
      INSERT INTO membership_applications
      (id, name, email, company, role, linkedin, status, submitted_at, reviewed_at, reviewed_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      application.id,
      application.name,
      application.email,
      application.company,
      application.role,
      application.linkedin,
      application.status,
      application.submittedAt.toISOString(),
      application.reviewedAt,
      application.reviewedBy
    );

    console.log(`🗄️ Application saved to database: ${application.id} - ${application.name}`);
    return application;
  }

  async getMembershipApplications(): Promise<MembershipApplication[]> {
    const stmt = this.db.prepare('SELECT * FROM membership_applications ORDER BY submitted_at DESC');
    const rows = stmt.all() as any[];

    return rows.map(row => ({
      ...row,
      submittedAt: new Date(row.submitted_at),
      reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : null,
    }));
  }

  async getPendingApplications(): Promise<MembershipApplication[]> {
    const stmt = this.db.prepare('SELECT * FROM membership_applications WHERE status = ? ORDER BY submitted_at DESC');
    const rows = stmt.all('pending') as any[];

    return rows.map(row => ({
      ...row,
      submittedAt: new Date(row.submitted_at),
      reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : null,
    }));
  }

  async getAcceptedApplications(): Promise<MembershipApplication[]> {
    const stmt = this.db.prepare('SELECT * FROM membership_applications WHERE status = ? ORDER BY submitted_at DESC');
    const rows = stmt.all('accepted') as any[];

    return rows.map(row => ({
      ...row,
      submittedAt: new Date(row.submitted_at),
      reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : null,
    }));
  }

  async getRejectedApplications(): Promise<MembershipApplication[]> {
    const stmt = this.db.prepare('SELECT * FROM membership_applications WHERE status = ? ORDER BY submitted_at DESC');
    const rows = stmt.all('rejected') as any[];

    return rows.map(row => ({
      ...row,
      submittedAt: new Date(row.submitted_at),
      reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : null,
    }));
  }

  async updateApplicationStatus(id: string, update: UpdateApplicationStatus): Promise<MembershipApplication | undefined> {
    const reviewedAt = new Date().toISOString();

    const stmt = this.db.prepare(`
      UPDATE membership_applications
      SET status = ?, reviewed_at = ?, reviewed_by = ?
      WHERE id = ?
    `);

    stmt.run(update.status, reviewedAt, update.reviewedBy, id);

    // Return the updated application
    const getStmt = this.db.prepare('SELECT * FROM membership_applications WHERE id = ?');
    const row = getStmt.get(id) as any;

    if (!row) return undefined;

    return {
      ...row,
      submittedAt: new Date(row.submitted_at),
      reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : null,
    };
  }

  close() {
    this.db.close();
  }
}