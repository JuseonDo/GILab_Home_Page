import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getSession, requireAuth, requireAdmin } from "./auth";
import { insertUserSchema, loginSchema, insertPublicationSchema, insertResearchProjectSchema, insertNewsSchema, insertMemberSchema, insertResearchAreaSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  app.use(getSession());

  // Authentication Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json({ 
        message: "Registration successful. Please wait for admin approval.",
        user: { 
          id: user.id, 
          email: user.email, 
          firstName: user.firstName,
          lastName: user.lastName,
          isApproved: user.isApproved 
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      const user = await storage.loginUser(credentials);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials or account not approved" });
      }

      req.session.userId = user.id;
      req.session.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin,
        isApproved: user.isApproved
      };

      res.json({ 
        message: "Login successful", 
        user: req.session.user 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data" });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/auth/user", (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.session.user);
  });

  // Admin Routes
  app.get("/api/admin/pending-users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const pendingUsers = await storage.getAllPendingUsers();
      res.json(pendingUsers);
    } catch (error) {
      console.error("Failed to fetch pending users:", error);
      res.status(500).json({ message: "Failed to fetch pending users" });
    }
  });

  app.post("/api/admin/approve-user/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const approved = await storage.approveUser(req.params.id);
      if (!approved) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User approved successfully" });
    } catch (error) {
      console.error("Failed to approve user:", error);
      res.status(500).json({ message: "Failed to approve user" });
    }
  });

  // Research Projects API
  app.get("/api/research-projects", async (req, res) => {
    try {
      const projects = await storage.getAllResearchProjects();
      res.json(projects);
    } catch (error) {
      console.error("Failed to fetch research projects:", error);
      res.status(500).json({ message: "Failed to fetch research projects" });
    }
  });

  app.post("/api/research-projects", requireAuth, async (req, res) => {
    try {
      const projectData = insertResearchProjectSchema.parse(req.body);
      const project = await storage.createResearchProject(projectData, req.session.userId!);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error("Failed to create research project:", error);
      res.status(500).json({ message: "Failed to create research project" });
    }
  });

  // Team Members API
  app.get("/api/team-members", async (req, res) => {
    try {
      const { type } = req.query;
      let members;
      
      if (type && typeof type === 'string') {
        members = await storage.getTeamMembersByType(type);
      } else {
        members = await storage.getAllTeamMembers();
      }
      
      res.json(members);
    } catch (error) {
      console.error("Failed to fetch team members:", error);
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  // Publications API
  app.get("/api/publications", async (req, res) => {
    try {
      const { year } = req.query;
      let publications;
      
      if (year && typeof year === 'string') {
        publications = await storage.getPublicationsByYear(year);
      } else {
        publications = await storage.getAllPublicationsWithAuthors();
      }
      
      res.json(publications);
    } catch (error) {
      console.error("Failed to fetch publications:", error);
      res.status(500).json({ message: "Failed to fetch publications" });
    }
  });

  // Create publication with authors
  app.post("/api/publications", requireAuth, async (req, res) => {
    try {
      const { publication, authors } = req.body;
      
      const publicationData = insertPublicationSchema.parse(publication);
      const authorsData = z.array(z.object({
        name: z.string(),
        homepage: z.string().optional()
      })).parse(authors);

      const newPublication = await storage.createPublication(
        publicationData, 
        req.session.userId!, 
        authorsData
      );

      res.status(201).json(newPublication);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error("Failed to create publication:", error);
      res.status(500).json({ message: "Failed to create publication" });
    }
  });

  // News API
  app.get("/api/news", async (req, res) => {
    try {
      const { limit } = req.query;
      let newsItems;
      
      if (limit && typeof limit === 'string') {
        newsItems = await storage.getRecentNews(parseInt(limit));
      } else {
        newsItems = await storage.getAllNews();
      }
      
      res.json(newsItems);
    } catch (error) {
      console.error("Failed to fetch news:", error);
      res.status(500).json({ message: "Failed to fetch news" });
    }
  });

  app.get("/api/news/:id", async (req, res) => {
    try {
      const newsItem = await storage.getNewsById(req.params.id);
      if (!newsItem) {
        return res.status(404).json({ message: "News item not found" });
      }
      res.json(newsItem);
    } catch (error) {
      console.error("Failed to fetch news item:", error);
      res.status(500).json({ message: "Failed to fetch news item" });
    }
  });

  app.post("/api/news", requireAuth, async (req, res) => {
    try {
      const newsData = insertNewsSchema.parse(req.body);
      const newsItem = await storage.createNews(newsData, req.session.userId!);
      res.status(201).json(newsItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error("Failed to create news:", error);
      res.status(500).json({ message: "Failed to create news" });
    }
  });

  app.put("/api/news/:id", requireAuth, async (req, res) => {
    try {
      const newsData = insertNewsSchema.partial().parse(req.body);
      const newsItem = await storage.updateNews(req.params.id, newsData);
      if (!newsItem) {
        return res.status(404).json({ message: "News item not found" });
      }
      res.json(newsItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error("Failed to update news:", error);
      res.status(500).json({ message: "Failed to update news" });
    }
  });

  app.delete("/api/news/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteNews(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "News item not found" });
      }
      res.json({ message: "News item deleted successfully" });
    } catch (error) {
      console.error("Failed to delete news:", error);
      res.status(500).json({ message: "Failed to delete news" });
    }
  });

  // Members API
  app.get("/api/members", async (req, res) => {
    try {
      const { grouped } = req.query;
      
      if (grouped === 'true') {
        const members = await storage.getMembersByDegreeLevel();
        res.json(members);
      } else {
        const members = await storage.getAllMembers();
        res.json(members);
      }
    } catch (error) {
      console.error("Failed to fetch members:", error);
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  app.get("/api/members/:id", async (req, res) => {
    try {
      const member = await storage.getMemberById(req.params.id);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      res.json(member);
    } catch (error) {
      console.error("Failed to fetch member:", error);
      res.status(500).json({ message: "Failed to fetch member" });
    }
  });

  app.post("/api/members", requireAuth, async (req, res) => {
    try {
      const memberData = insertMemberSchema.parse(req.body);
      const member = await storage.createMember(memberData);
      res.status(201).json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error("Failed to create member:", error);
      res.status(500).json({ message: "Failed to create member" });
    }
  });

  app.put("/api/members/:id", requireAuth, async (req, res) => {
    try {
      const memberData = insertMemberSchema.partial().parse(req.body);
      const member = await storage.updateMember(req.params.id, memberData);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      res.json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error("Failed to update member:", error);
      res.status(500).json({ message: "Failed to update member" });
    }
  });

  app.delete("/api/members/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteMember(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Member not found" });
      }
      res.json({ message: "Member deleted successfully" });
    } catch (error) {
      console.error("Failed to delete member:", error);
      res.status(500).json({ message: "Failed to delete member" });
    }
  });

  // Research Areas API
  app.get("/api/research-areas", async (req, res) => {
    try {
      const { parentId } = req.query;
      let areas;
      
      if (parentId && typeof parentId === 'string') {
        areas = await storage.getResearchAreasByParent(parentId);
      } else if (parentId === null || parentId === 'null') {
        areas = await storage.getResearchAreasByParent();
      } else {
        areas = await storage.getAllResearchAreas();
      }
      
      res.json(areas);
    } catch (error) {
      console.error("Failed to fetch research areas:", error);
      res.status(500).json({ message: "Failed to fetch research areas" });
    }
  });

  app.get("/api/research-areas/:id", async (req, res) => {
    try {
      const area = await storage.getResearchAreaById(req.params.id);
      if (!area) {
        return res.status(404).json({ message: "Research area not found" });
      }
      res.json(area);
    } catch (error) {
      console.error("Failed to fetch research area:", error);
      res.status(500).json({ message: "Failed to fetch research area" });
    }
  });

  app.post("/api/research-areas", requireAuth, async (req, res) => {
    try {
      const areaData = insertResearchAreaSchema.parse(req.body);
      const area = await storage.createResearchArea(areaData);
      res.status(201).json(area);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error("Failed to create research area:", error);
      res.status(500).json({ message: "Failed to create research area" });
    }
  });

  app.put("/api/research-areas/:id", requireAuth, async (req, res) => {
    try {
      const areaData = insertResearchAreaSchema.partial().parse(req.body);
      const area = await storage.updateResearchArea(req.params.id, areaData);
      if (!area) {
        return res.status(404).json({ message: "Research area not found" });
      }
      res.json(area);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error("Failed to update research area:", error);
      res.status(500).json({ message: "Failed to update research area" });
    }
  });

  app.delete("/api/research-areas/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteResearchArea(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Research area not found" });
      }
      res.json({ message: "Research area deleted successfully" });
    } catch (error) {
      console.error("Failed to delete research area:", error);
      res.status(500).json({ message: "Failed to delete research area" });
    }
  });

  // Contact form submission
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      console.log("Contact form submission:", { name, email, subject, message });
      res.json({ message: "Message sent successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
