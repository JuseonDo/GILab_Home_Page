import { db } from './db';
import { users, researchProjects, teamMembers, publications, authors, news, members, researchAreas } from '@shared/schema';
import type { 
  User, InsertUser, LoginUser, 
  ResearchProject, InsertResearchProject, 
  TeamMember, InsertTeamMember, 
  Publication, InsertPublication,
  Author, InsertAuthor,
  News, InsertNews,
  Member, InsertMember,
  ResearchArea, InsertResearchArea
} from '@shared/schema';
import { eq, desc, and } from 'drizzle-orm';
import { hashPassword, verifyPassword } from './auth';

export interface IStorage {
  // User management
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  loginUser(credentials: LoginUser): Promise<User | null>;
  approveUser(id: string): Promise<boolean>;
  getAllPendingUsers(): Promise<User[]>;
  
  // Research projects
  getAllResearchProjects(): Promise<ResearchProject[]>;
  getResearchProject(id: string): Promise<ResearchProject | undefined>;
  createResearchProject(project: InsertResearchProject, authorId: string): Promise<ResearchProject>;
  
  // Team members
  getAllTeamMembers(): Promise<TeamMember[]>;
  getTeamMembersByType(type: string): Promise<TeamMember[]>;
  createTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  
  // Publications with authors
  getAllPublicationsWithAuthors(): Promise<(Publication & { authors: Author[] })[]>;
  getPublicationsByYear(year: string): Promise<(Publication & { authors: Author[] })[]>;
  createPublication(publication: InsertPublication, authorId: string, authorsList: InsertAuthor[]): Promise<Publication>;
  
  // News management
  getAllNews(): Promise<News[]>;
  getRecentNews(limit?: number): Promise<News[]>;
  getNewsById(id: string): Promise<News | undefined>;
  createNews(newsItem: InsertNews, authorId: string): Promise<News>;
  updateNews(id: string, newsItem: Partial<InsertNews>): Promise<News | undefined>;
  deleteNews(id: string): Promise<boolean>;
  
  // Members management
  getAllMembers(): Promise<Member[]>;
  getMembersByDegreeLevel(): Promise<{ masters: Member[], bachelors: Member[], phd: Member[], other: Member[] }>;
  getMemberById(id: string): Promise<Member | undefined>;
  createMember(member: InsertMember): Promise<Member>;
  updateMember(id: string, member: Partial<InsertMember>): Promise<Member | undefined>;
  deleteMember(id: string): Promise<boolean>;
  
  // Research Areas management
  getAllResearchAreas(): Promise<ResearchArea[]>;
  getResearchAreasByParent(parentId?: string): Promise<ResearchArea[]>;
  getResearchAreaById(id: string): Promise<ResearchArea | undefined>;
  createResearchArea(area: InsertResearchArea): Promise<ResearchArea>;
  updateResearchArea(id: string, area: Partial<InsertResearchArea>): Promise<ResearchArea | undefined>;
  deleteResearchArea(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User management
  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const hashedPassword = await hashPassword(userData.password);
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        password: hashedPassword,
        isApproved: false, // Requires admin approval
      })
      .returning();
    return user;
  }

  async loginUser(credentials: LoginUser): Promise<User | null> {
    const user = await this.getUserByEmail(credentials.email);
    if (!user || !user.isApproved) {
      return null;
    }

    const isValidPassword = await verifyPassword(credentials.password, user.password);
    if (!isValidPassword) {
      return null;
    }

    return user;
  }

  async approveUser(id: string): Promise<boolean> {
    const [user] = await db
      .update(users)
      .set({ isApproved: true, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return !!user;
  }

  async getAllPendingUsers(): Promise<User[]> {
    return db.select().from(users).where(eq(users.isApproved, false));
  }

  // Research projects
  async getAllResearchProjects(): Promise<ResearchProject[]> {
    return db.select().from(researchProjects).orderBy(researchProjects.order);
  }

  async getResearchProject(id: string): Promise<ResearchProject | undefined> {
    const [project] = await db.select().from(researchProjects).where(eq(researchProjects.id, id));
    return project;
  }

  async createResearchProject(projectData: InsertResearchProject, authorId: string): Promise<ResearchProject> {
    const [project] = await db
      .insert(researchProjects)
      .values({
        ...projectData,
        authorId,
      })
      .returning();
    return project;
  }

  // Team members
  async getAllTeamMembers(): Promise<TeamMember[]> {
    return db.select().from(teamMembers).orderBy(teamMembers.type, teamMembers.order);
  }

  async getTeamMembersByType(type: string): Promise<TeamMember[]> {
    return db.select().from(teamMembers)
      .where(eq(teamMembers.type, type))
      .orderBy(teamMembers.order);
  }

  async createTeamMember(memberData: InsertTeamMember): Promise<TeamMember> {
    const [member] = await db
      .insert(teamMembers)
      .values(memberData)
      .returning();
    return member;
  }

  // Publications with authors
  async getAllPublicationsWithAuthors(): Promise<(Publication & { authors: Author[] })[]> {
    const publicationsList = await db.select().from(publications).orderBy(desc(publications.year));
    
    const result = [];
    for (const publication of publicationsList) {
      const authorsList = await db.select()
        .from(authors)
        .where(eq(authors.publicationId, publication.id))
        .orderBy(authors.order);
      
      result.push({
        ...publication,
        authors: authorsList,
      });
    }
    
    return result;
  }

  async getPublicationsByYear(year: string): Promise<(Publication & { authors: Author[] })[]> {
    const publicationsList = await db.select()
      .from(publications)
      .where(eq(publications.year, year))
      .orderBy(desc(publications.createdAt));
    
    const result = [];
    for (const publication of publicationsList) {
      const authorsList = await db.select()
        .from(authors)
        .where(eq(authors.publicationId, publication.id))
        .orderBy(authors.order);
      
      result.push({
        ...publication,
        authors: authorsList,
      });
    }
    
    return result;
  }

  async createPublication(publicationData: InsertPublication, authorId: string, authorsList: InsertAuthor[]): Promise<Publication> {
    const [publication] = await db
      .insert(publications)
      .values({
        ...publicationData,
        authorId,
      })
      .returning();

    // Insert authors
    if (authorsList.length > 0) {
      await db.insert(authors).values(
        authorsList.map((author, index) => ({
          ...author,
          publicationId: publication.id,
          order: index,
        }))
      );
    }

    return publication;
  }

  // News management
  async getAllNews(): Promise<News[]> {
    return db.select().from(news)
      .where(eq(news.isPublished, true))
      .orderBy(desc(news.publishedAt));
  }

  async getRecentNews(limit: number = 5): Promise<News[]> {
    return db.select().from(news)
      .where(eq(news.isPublished, true))
      .orderBy(desc(news.publishedAt))
      .limit(limit);
  }

  async getNewsById(id: string): Promise<News | undefined> {
    const [newsItem] = await db.select().from(news).where(eq(news.id, id));
    return newsItem;
  }

  async createNews(newsData: InsertNews, authorId: string): Promise<News> {
    const [newsItem] = await db
      .insert(news)
      .values({
        ...newsData,
        authorId,
      })
      .returning();
    return newsItem;
  }

  async updateNews(id: string, newsData: Partial<InsertNews>): Promise<News | undefined> {
    const [newsItem] = await db
      .update(news)
      .set({ ...newsData, updatedAt: new Date() })
      .where(eq(news.id, id))
      .returning();
    return newsItem;
  }

  async deleteNews(id: string): Promise<boolean> {
    const [deletedNews] = await db.delete(news).where(eq(news.id, id)).returning();
    return !!deletedNews;
  }

  // Members management
  async getAllMembers(): Promise<Member[]> {
    return db.select().from(members)
      .where(eq(members.status, "current"))
      .orderBy(members.order);
  }

  async getMembersByDegreeLevel(): Promise<{ masters: Member[], bachelors: Member[], phd: Member[], other: Member[] }> {
    const allMembers = await this.getAllMembers();
    
    return {
      masters: allMembers.filter(m => m.degree.startsWith("M")),
      bachelors: allMembers.filter(m => m.degree.startsWith("B")),
      phd: allMembers.filter(m => m.degree.toLowerCase().includes("phd")),
      other: allMembers.filter(m => !m.degree.startsWith("M") && !m.degree.startsWith("B") && !m.degree.toLowerCase().includes("phd"))
    };
  }

  async getMemberById(id: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    return member;
  }

  async createMember(memberData: InsertMember): Promise<Member> {
    const [member] = await db
      .insert(members)
      .values(memberData)
      .returning();
    return member;
  }

  async updateMember(id: string, memberData: Partial<InsertMember>): Promise<Member | undefined> {
    const [member] = await db
      .update(members)
      .set({ ...memberData, updatedAt: new Date() })
      .where(eq(members.id, id))
      .returning();
    return member;
  }

  async deleteMember(id: string): Promise<boolean> {
    const [deletedMember] = await db.delete(members).where(eq(members.id, id)).returning();
    return !!deletedMember;
  }

  // Research Areas management
  async getAllResearchAreas(): Promise<ResearchArea[]> {
    return db.select().from(researchAreas)
      .where(eq(researchAreas.isActive, true))
      .orderBy(researchAreas.order);
  }

  async getResearchAreasByParent(parentId?: string): Promise<ResearchArea[]> {
    if (parentId) {
      return db.select().from(researchAreas)
        .where(and(eq(researchAreas.parentId, parentId), eq(researchAreas.isActive, true)))
        .orderBy(researchAreas.order);
    } else {
      return db.select().from(researchAreas)
        .where(and(eq(researchAreas.parentId, null), eq(researchAreas.isActive, true)))
        .orderBy(researchAreas.order);
    }
  }

  async getResearchAreaById(id: string): Promise<ResearchArea | undefined> {
    const [area] = await db.select().from(researchAreas).where(eq(researchAreas.id, id));
    return area;
  }

  async createResearchArea(areaData: InsertResearchArea): Promise<ResearchArea> {
    const [area] = await db
      .insert(researchAreas)
      .values(areaData)
      .returning();
    return area;
  }

  async updateResearchArea(id: string, areaData: Partial<InsertResearchArea>): Promise<ResearchArea | undefined> {
    const [area] = await db
      .update(researchAreas)
      .set({ ...areaData, updatedAt: new Date() })
      .where(eq(researchAreas.id, id))
      .returning();
    return area;
  }

  async deleteResearchArea(id: string): Promise<boolean> {
    const [deletedArea] = await db.delete(researchAreas).where(eq(researchAreas.id, id)).returning();
    return !!deletedArea;
  }
}

export const storage = new DatabaseStorage();
