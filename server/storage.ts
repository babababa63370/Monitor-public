import { users, sites, logs, type User, type InsertUser, type Site, type InsertSite, type Log, type InsertLog } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Sites
  getSite(id: number): Promise<Site | undefined>;
  getSitesByUserId(userId: number): Promise<Site[]>;
  getAllActiveSites(): Promise<Site[]>;
  createSite(site: InsertSite): Promise<Site>;
  updateSite(id: number, site: Partial<InsertSite>): Promise<Site>;
  deleteSite(id: number): Promise<void>;
  updateSiteLastChecked(id: number, lastChecked: Date): Promise<void>;

  // Logs
  getLogsBySiteId(siteId: number, limit?: number): Promise<Log[]>;
  createLog(log: InsertLog): Promise<Log>;
  getSiteStats(siteId: number): Promise<{ uptime: number; avgResponseTime: number; lastStatus: string }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Sites
  async getSite(id: number): Promise<Site | undefined> {
    const [site] = await db.select().from(sites).where(eq(sites.id, id));
    return site;
  }

  async getSitesByUserId(userId: number): Promise<Site[]> {
    return await db.select().from(sites).where(eq(sites.userId, userId)).orderBy(desc(sites.createdAt));
  }

  async getAllActiveSites(): Promise<Site[]> {
    return await db.select().from(sites).where(eq(sites.isActive, true));
  }

  async createSite(site: InsertSite): Promise<Site> {
    const [newSite] = await db.insert(sites).values(site).returning();
    return newSite;
  }

  async updateSite(id: number, site: Partial<InsertSite>): Promise<Site> {
    const [updatedSite] = await db.update(sites).set(site).where(eq(sites.id, id)).returning();
    return updatedSite;
  }

  async deleteSite(id: number): Promise<void> {
    await db.delete(logs).where(eq(logs.siteId, id));
    await db.delete(sites).where(eq(sites.id, id));
  }

  async updateSiteLastChecked(id: number, lastChecked: Date): Promise<void> {
    await db.update(sites).set({ lastChecked }).where(eq(sites.id, id));
  }

  // Logs
  async getLogsBySiteId(siteId: number, limit: number = 50): Promise<Log[]> {
    return await db.select().from(logs)
      .where(eq(logs.siteId, siteId))
      .orderBy(desc(logs.createdAt))
      .limit(limit);
  }

  async createLog(log: InsertLog): Promise<Log> {
    const [newLog] = await db.insert(logs).values(log).returning();
    return newLog;
  }

  async getSiteStats(siteId: number): Promise<{ uptime: number; avgResponseTime: number; lastStatus: string }> {
    const siteLogs = await db.select().from(logs)
      .where(eq(logs.siteId, siteId))
      .orderBy(desc(logs.createdAt))
      .limit(100);

    if (siteLogs.length === 0) {
      return { uptime: 100, avgResponseTime: 0, lastStatus: 'UNKNOWN' };
    }

    const upLogs = siteLogs.filter(l => l.status === 'UP');
    const uptime = (upLogs.length / siteLogs.length) * 100;
    const avgResponseTime = Math.round(siteLogs.reduce((acc, l) => acc + l.responseTime, 0) / siteLogs.length);
    const lastStatus = siteLogs[0].status;

    return { uptime, avgResponseTime, lastStatus };
  }
}

export const storage = new DatabaseStorage();
