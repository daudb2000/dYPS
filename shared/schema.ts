import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const membershipApplications = pgTable("membership_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  company: text("company").notNull(),
  role: text("role").notNull(),
  email: text("email").notNull(),
  linkedin: text("linkedin"),
  consent: boolean("consent").notNull().default(false),
  status: text("status").notNull().default("pending"),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: text("reviewed_by"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertMembershipApplicationSchema = createInsertSchema(membershipApplications).omit({
  id: true,
  submittedAt: true,
  status: true,
  reviewedAt: true,
  reviewedBy: true,
}).extend({
  name: z.string().min(1, "Name is required"),
  company: z.string().min(1, "Company is required"),
  role: z.string().min(1, "Role is required"),
  email: z.string().email("Valid email is required"),
  linkedin: z.string().optional(),
  consent: z.boolean().refine((val) => val === true, "Consent is required"),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(["pending", "accepted", "rejected"]),
  reviewedBy: z.string().min(1, "Reviewer is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertMembershipApplication = z.infer<typeof insertMembershipApplicationSchema>;
export type MembershipApplication = typeof membershipApplications.$inferSelect;
export type UpdateApplicationStatus = z.infer<typeof updateApplicationStatusSchema>;
