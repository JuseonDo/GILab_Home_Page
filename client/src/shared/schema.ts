// client/src/shared/schema.ts
import { sql } from "drizzle-orm";
import {
  pgTable, text, varchar, integer, timestamp, boolean, jsonb, index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/** =========================
 *  Auth / Users / Sessions
 *  ========================= */
export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: text("password").notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  isApproved: boolean("is_approved").default(false).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/** =========================
 *  Publications / Authors
 *  ========================= */
export const publications = pgTable(
  "publications",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    title: text("title").notNull(),
    journal: text("journal"),
    conference: text("conference"),
    // ⭐ 숫자 컬럼로 정의 (TS 타입도 number로 추론됨)
    year: integer("year").notNull(),
    type: text("type").notNull(), // 'journal' | 'conference'
    abstract: text("abstract").notNull(),
    pdfUrl: text("pdf_url"),
    imageUrl: text("image_url"),
    order: integer("order").notNull().default(0),
    authorId: varchar("author_id").references(() => users.id).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    pubOrderIdx: index("publications_order_idx").on(t.order),
  })
);

export const authors = pgTable("authors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  homepage: text("homepage"),
  publicationId: varchar("publication_id")
    .references(() => publications.id, { onDelete: "cascade" })
    .notNull(),
  order: integer("order").notNull().default(0),
});

/** =========================
 *  Research Projects
 *  ========================= */
export const researchProjects = pgTable("research_projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  date: text("date").notNull(),
  leadResearcher: text("lead_researcher").notNull(),
  imageUrl: text("image_url").notNull(),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  authorId: varchar("author_id").references(() => users.id),
});

/** =========================
 *  Members
 *  ========================= */
export const members = pgTable("members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").unique(), // 선택값 허용
  imageUrl: text("image_url"),
  homepage: text("homepage"),
  degree: text("degree").notNull(),
  joinedAt: text("joined_at").notNull(),
  status: text("status").default("current").notNull(),
  bio: text("bio"),
  researchInterests: text("research_interests"),
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/** =========================
 *  Research Areas
 *  ========================= */
export const researchAreas = pgTable("research_areas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  // drizzle의 self reference
  parentId: varchar("parent_id").references((): any => researchAreas.id),
  imageUrl: text("image_url"),
  order: integer("order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/** =========================
 *  News
 *  ========================= */
export const news = pgTable("news", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  summary: text("summary"),
  imageUrl: text("image_url"),
  publishedAt: timestamp("published_at").defaultNow().notNull(),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/** =========================
 *  Lab Info (single row)
 *  ========================= */
export const labInfo = pgTable("lab_info", {
  id: varchar("id").primaryKey().default(sql`'lab_settings'`),
  labName: text("lab_name").notNull(),
  principalInvestigator: text("principal_investigator").notNull(),
  piTitle: text("pi_title").notNull(),
  piEmail: text("pi_email"),
  piPhone: text("pi_phone"),
  piPhoto: text("pi_photo"),
  piBio: text("pi_bio"),
  description: text("description"),
  address: text("address").notNull(),
  latitude: text("latitude"),
  longitude: text("longitude"),
  building: text("building"),
  room: text("room"),
  university: text("university").notNull(),
  department: text("department").notNull(),
  website: text("website"),
  establishedYear: text("established_year"),
  researchFocus: text("research_focus"),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  officeHours: text("office_hours"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/** =========================
 *  Zod Schemas (insert)
 *  ========================= */
export const insertUserSchema = createInsertSchema(users).omit({
  id: true, createdAt: true, updatedAt: true,
});

export const loginSchema = z.object({
  email: z.string(),
  password: z.string().min(6),
});

// ⭐ year는 number로 추론되지만, 폼과 궁합을 위해 coerce.number() 사용 권장
export const insertPublicationSchema = createInsertSchema(publications).extend({
  year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 10),
}).omit({
  id: true, createdAt: true, authorId: true,
});

export const insertAuthorSchema = createInsertSchema(authors).omit({
  id: true, publicationId: true,
});

export const insertResearchProjectSchema = createInsertSchema(researchProjects).omit({
  id: true, createdAt: true, authorId: true,
});

export const insertMemberSchema = createInsertSchema(members).omit({
  id: true, createdAt: true, updatedAt: true,
});

export const insertResearchAreaSchema = createInsertSchema(researchAreas).omit({
  id: true, createdAt: true, updatedAt: true,
});

export const insertNewsSchema = createInsertSchema(news).omit({
  id: true, createdAt: true, updatedAt: true, authorId: true, publishedAt: true,
});

/** =========================
 *  Types
 *  ========================= */
export type User = typeof users.$inferSelect;
export type Publication = typeof publications.$inferSelect;
export type Author = typeof authors.$inferSelect;
export type ResearchProject = typeof researchProjects.$inferSelect;
export type Member = typeof members.$inferSelect;
export type ResearchArea = typeof researchAreas.$inferSelect;
export type News = typeof news.$inferSelect;

export type InsertPublication = z.infer<typeof insertPublicationSchema>;
export type InsertAuthor = z.infer<typeof insertAuthorSchema>;
export type InsertResearchProject = z.infer<typeof insertResearchProjectSchema>;
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type InsertResearchArea = z.infer<typeof insertResearchAreaSchema>;
export type InsertNews = z.infer<typeof insertNewsSchema>;
