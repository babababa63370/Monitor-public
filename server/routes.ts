import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { insertUserSchema, insertSiteSchema } from "@shared/schema";
import OpenAI from "openai";

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
  }
  return _openai;
}

const JWT_SECRET = process.env.SESSION_SECRET || "default_secret";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // Auth Routes
  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(input.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);
      const user = await storage.createUser({
        ...input,
        password: hashedPassword,
      });

      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      const user = await storage.getUserByEmail(input.email);

      if (!user || !(await bcrypt.compare(input.password, user.password))) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      const { password, ...userWithoutPassword } = user;

      res.json({ user: userWithoutPassword, token });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.auth.me.path, authenticateToken, async (req: any, res) => {
    const user = await storage.getUser(req.user.id);
    if (!user) return res.sendStatus(404);
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // Sites Routes
  app.get(api.sites.list.path, authenticateToken, async (req: any, res) => {
    const sites = await storage.getSitesByUserId(req.user.id);
    const sitesWithStats = await Promise.all(sites.map(async (site) => {
      const stats = await storage.getSiteStats(site.id);
      return { ...site, ...stats };
    }));
    res.json(sitesWithStats);
  });

  app.post(api.sites.create.path, authenticateToken, async (req: any, res) => {
    try {
      const input = api.sites.create.input.parse(req.body);
      const site = await storage.createSite({
        name: input.name,
        url: input.url,
        intervalMinutes: input.intervalMinutes,
        isActive: input.isActive,
        userId: req.user.id
      });
      res.status(201).json(site);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.sites.get.path, authenticateToken, async (req: any, res) => {
    const site = await storage.getSite(parseInt(req.params.id));
    if (!site) return res.status(404).json({ message: "Site not found" });
    if (site.userId !== req.user.id && req.user.role !== 'admin') return res.sendStatus(403);
    res.json(site);
  });

  app.patch(api.sites.update.path, authenticateToken, async (req: any, res) => {
    const id = parseInt(req.params.id);
    const site = await storage.getSite(id);
    if (!site) return res.status(404).json({ message: "Site not found" });
    if (site.userId !== req.user.id && req.user.role !== 'admin') return res.sendStatus(403);

    const updatedSite = await storage.updateSite(id, req.body);
    res.json(updatedSite);
  });

  app.delete(api.sites.delete.path, authenticateToken, async (req: any, res) => {
    const id = parseInt(req.params.id);
    const site = await storage.getSite(id);
    if (!site) return res.status(404).json({ message: "Site not found" });
    if (site.userId !== req.user.id && req.user.role !== 'admin') return res.sendStatus(403);

    await storage.deleteSite(id);
    res.sendStatus(204);
  });

  // Logs Routes
  app.get(api.logs.list.path, authenticateToken, async (req: any, res) => {
    const siteId = parseInt(req.params.siteId);
    const site = await storage.getSite(siteId);
    if (!site) return res.status(404).json({ message: "Site not found" });
    if (site.userId !== req.user.id && req.user.role !== 'admin') return res.sendStatus(403);

    const logs = await storage.getLogsBySiteId(siteId);
    res.json(logs);
  });

  // AI Analysis Route
  app.post(api.ai.analyze.path, authenticateToken, async (req: any, res) => {
    const siteId = parseInt(req.params.siteId);
    const site = await storage.getSite(siteId);
    if (!site) return res.status(404).json({ message: "Site not found" });
    if (site.userId !== req.user.id && req.user.role !== 'admin') return res.sendStatus(403);

    const siteLogs = await storage.getLogsBySiteId(siteId, 50); // Analyze last 50 logs
    
    // Construct prompt for OpenAI
    const logsText = siteLogs.map(l => `[${l.createdAt}] Status: ${l.status}, Response Time: ${l.responseTime}ms`).join('\n');
    const prompt = `
      Analyze the following server logs for site "${site.name}" (${site.url}).
      Identify any anomalies, patterns of downtime, or high latency.
      Provide suggestions for improvement.
      
      Logs:
      ${logsText}
      
      Format the response as JSON with keys: "analysis" (string), "suggestions" (array of strings), "anomalies" (array of strings).
    `;

    try {
      const response = await getOpenAI().chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      res.json(result);
    } catch (error) {
      console.error("AI Analysis failed:", error);
      res.status(500).json({ message: "Failed to analyze logs" });
    }
  });

  // Background Ping Job
  setInterval(async () => {
    const sites = await storage.getAllActiveSites();
    const now = new Date();

    for (const site of sites) {
      // Check if it's time to ping
      const lastChecked = site.lastChecked ? new Date(site.lastChecked) : new Date(0);
      const nextCheck = new Date(lastChecked.getTime() + site.intervalMinutes * 60000);

      if (now >= nextCheck) {
        const startTime = Date.now();
        let status = 'DOWN';
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          const response = await fetch(site.url, { 
            method: 'GET', // Using GET for better compatibility
            signal: controller.signal,
            headers: {
              'User-Agent': 'AI-Sentinel-Bot/1.0'
            }
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            status = 'UP';
          }
        } catch (error) {
          status = 'DOWN';
          console.error(`Ping failed for ${site.url}:`, error instanceof Error ? error.message : error);
        }
        const responseTime = Date.now() - startTime;

        await storage.createLog({
          siteId: site.id,
          status,
          responseTime,
        });
        await storage.updateSiteLastChecked(site.id, now);
      }
    }
  }, 30 * 1000); // Check every 30 seconds for better responsiveness

  return httpServer;
}
