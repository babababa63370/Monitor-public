import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("user").notNull(), // 'admin' | 'user'
  createdAt: timestamp("created_at").defaultNow(),
});

export const sites = pgTable("sites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  intervalMinutes: integer("interval_minutes").default(5).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastChecked: timestamp("last_checked"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  siteId: integer("site_id").references(() => sites.id).notNull(),
  status: text("status").notNull(), // 'UP' | 'DOWN'
  responseTime: integer("response_time").notNull(), // in ms
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sites: many(sites),
}));

export const sitesRelations = relations(sites, ({ one, many }) => ({
  user: one(users, {
    fields: [sites.userId],
    references: [users.id],
  }),
  logs: many(logs),
}));

export const logsRelations = relations(logs, ({ one }) => ({
  site: one(sites, {
    fields: [logs.siteId],
    references: [sites.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  role: true,
});

export const insertSiteSchema = createInsertSchema(sites).omit({ 
  id: true, 
  userId: true, 
  lastChecked: true, 
  createdAt: true 
});

export const insertLogSchema = createInsertSchema(logs).omit({ 
  id: true, 
  createdAt: true 
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Site = typeof sites.$inferSelect;
export type InsertSite = z.infer<typeof insertSiteSchema>;
export type Log = typeof logs.$inferSelect;
export type InsertLog = z.infer<typeof insertLogSchema>;

export type AuthResponse = {
  user: Omit<User, 'password'>;
  token?: string;
};

export type SiteWithStats = Site & {
  uptime: number; // percentage
  avgResponseTime: number;
  lastStatus: string;
};
