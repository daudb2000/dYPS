import { type User, type InsertUser, type MembershipApplication, type InsertMembershipApplication } from "@shared/schema";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createMembershipApplication(application: InsertMembershipApplication): Promise<MembershipApplication>;
  getMembershipApplications(): Promise<MembershipApplication[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private membershipApplications: Map<string, MembershipApplication>;

  constructor() {
    this.users = new Map();
    this.membershipApplications = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createMembershipApplication(insertApplication: InsertMembershipApplication): Promise<MembershipApplication> {
    const id = randomUUID();
    const application: MembershipApplication = {
      ...insertApplication,
      id,
      submittedAt: new Date(),
    };
    this.membershipApplications.set(id, application);
    return application;
  }

  async getMembershipApplications(): Promise<MembershipApplication[]> {
    return Array.from(this.membershipApplications.values());
  }
}

export const storage = new MemStorage();
