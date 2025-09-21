import sqlite3 from 'sqlite3';
import { type User, type InsertUser, type MembershipApplication, type InsertMembershipApplication, type UpdateApplicationStatus } from "@shared/schema";
import { randomUUID } from "crypto";
import type { IStorage } from "./storage";

export class SqliteStorage implements IStorage {
  private db: sqlite3.Database;

  constructor(dbPath: string = './dyps.db') {
    this.db = new sqlite3.Database(dbPath);
    this.initializeTables();
  }

  private initializeTables() {
    // Create users table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      );

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
      );
    `);

    console.log('✅ Database tables initialized');
  }

  async getUser(id: string): Promise<User | undefined> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM users WHERE id = ?', [id], (err, row: User) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM users WHERE username = ?', [username], (err, row: User) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };

    return new Promise((resolve, reject) => {
      this.db.run('INSERT INTO users (id, username, password) VALUES (?, ?, ?)',
        [user.id, user.username, user.password],
        function(err) {
          if (err) reject(err);
          else resolve(user);
        }
      );
    });
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

    return new Promise((resolve, reject) => {
      this.db.run(`
        INSERT INTO membership_applications
        (id, name, email, company, role, linkedin, status, submitted_at, reviewed_at, reviewed_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
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
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          console.log(`🗄️ Application saved to database: ${application.id} - ${application.name}`);
          resolve(application);
        }
      });
    });
  }

  async getMembershipApplications(): Promise<MembershipApplication[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM membership_applications ORDER BY submitted_at DESC', [], (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const applications = rows.map(row => ({
            ...row,
            submittedAt: new Date(row.submitted_at),
            reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : null,
          }));
          resolve(applications);
        }
      });
    });
  }

  async getPendingApplications(): Promise<MembershipApplication[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM membership_applications WHERE status = ? ORDER BY submitted_at DESC',
        ['pending'], (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const applications = rows.map(row => ({
            ...row,
            submittedAt: new Date(row.submitted_at),
            reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : null,
          }));
          resolve(applications);
        }
      });
    });
  }

  async getAcceptedApplications(): Promise<MembershipApplication[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM membership_applications WHERE status = ? ORDER BY submitted_at DESC',
        ['accepted'], (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const applications = rows.map(row => ({
            ...row,
            submittedAt: new Date(row.submitted_at),
            reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : null,
          }));
          resolve(applications);
        }
      });
    });
  }

  async getRejectedApplications(): Promise<MembershipApplication[]> {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM membership_applications WHERE status = ? ORDER BY submitted_at DESC',
        ['rejected'], (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const applications = rows.map(row => ({
            ...row,
            submittedAt: new Date(row.submitted_at),
            reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : null,
          }));
          resolve(applications);
        }
      });
    });
  }

  async updateApplicationStatus(id: string, update: UpdateApplicationStatus): Promise<MembershipApplication | undefined> {
    const reviewedAt = new Date().toISOString();

    return new Promise((resolve, reject) => {
      this.db.run(`
        UPDATE membership_applications
        SET status = ?, reviewed_at = ?, reviewed_by = ?
        WHERE id = ?
      `, [update.status, reviewedAt, update.reviewedBy, id], function(err) {
        if (err) {
          reject(err);
        } else {
          // Get the updated application
          this.get('SELECT * FROM membership_applications WHERE id = ?', [id], (err: any, row: any) => {
            if (err) {
              reject(err);
            } else if (!row) {
              resolve(undefined);
            } else {
              resolve({
                ...row,
                submittedAt: new Date(row.submitted_at),
                reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : null,
              });
            }
          });
        }
      });
    });
  }

  close() {
    this.db.close();
  }
}