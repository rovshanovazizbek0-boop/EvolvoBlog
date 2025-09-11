import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for admin authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").default("admin"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Services table
export const services = pgTable("services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priceRange: text("price_range").notNull(),
  duration: text("duration").notNull(),
  imageUrl: text("image_url"),
  aiPromptTemplate: text("ai_prompt_template").notNull(),
  features: jsonb("features").default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Orders table
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientName: text("client_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  telegramUsername: text("telegram_username").notNull(),
  serviceId: varchar("service_id").references(() => services.id).notNull(),
  details: text("details").notNull(),
  budget: text("budget"),
  deadline: timestamp("deadline"),
  status: text("status").default("new"), // new, in_progress, completed
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Blog posts table
export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt").notNull(),
  metaDescription: text("meta_description").notNull(),
  keywords: text("keywords").notNull(),
  imageUrl: text("image_url").notNull(),
  imageUnsplashId: text("image_unsplash_id").notNull(),
  category: text("category").notNull(),
  readTime: integer("read_time").notNull(),
  publishedAt: timestamp("published_at"),
  status: text("status").default("scheduled"), // scheduled, published
  telegramPosted: boolean("telegram_posted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Clients table (derived from orders for CRM)
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  telegramUsername: text("telegram_username").notNull(),
  email: text("email"),
  totalOrders: integer("total_orders").default(0),
  totalSpent: integer("total_spent").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Image tracking for uniqueness
export const imageUsage = pgTable("image_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  unsplashId: text("unsplash_id").notNull().unique(),
  usedAt: timestamp("used_at").defaultNow(),
});

// Portfolio table
export const portfolio = pgTable("portfolio", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  projectUrl: text("project_url"),
  category: text("category").notNull(),
  technologies: jsonb("technologies").default([]),
  clientName: text("client_name"),
  completedAt: timestamp("completed_at").notNull(),
  isPublic: boolean("is_public").default(true),
  featured: boolean("featured").default(false),
  sortOrder: integer("sort_order").default(0),
  metaDescription: text("meta_description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat conversations table
export const chatConversations = pgTable("chat_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull().unique(),
  clientId: varchar("client_id").references(() => clients.id),
  clientName: text("client_name"),
  clientPhone: text("client_phone"),
  clientTelegram: text("client_telegram"),
  status: text("status").default("active"), // active, converted, archived
  leadScore: integer("lead_score").default(0),
  interestedServices: jsonb("interested_services").default([]),
  lastMessage: text("last_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat messages table
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => chatConversations.id).notNull(),
  content: text("content").notNull(),
  isUser: boolean("is_user").notNull(),
  messageType: text("message_type").default("text"), // text, service_card, lead_form, quick_reply
  metadata: jsonb("metadata").default({}), // for storing service recommendations, form data, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// Chat leads table (extends client information with chat-specific data)
export const chatLeads = pgTable("chat_leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").references(() => chatConversations.id).notNull(),
  name: text("name"),
  phone: text("phone"),
  telegramUsername: text("telegram_username"),
  email: text("email"),
  interestedService: text("interested_service"),
  budget: text("budget"),
  timeline: text("timeline"),
  requirements: text("requirements"),
  leadQuality: text("lead_quality").default("cold"), // cold, warm, hot
  status: text("status").default("new"), // new, contacted, converted, lost
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Create schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPortfolioSchema = createInsertSchema(portfolio).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatConversationSchema = createInsertSchema(chatConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertChatLeadSchema = createInsertSchema(chatLeads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Portfolio = typeof portfolio.$inferSelect;
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;

export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = z.infer<typeof insertChatConversationSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type ChatLead = typeof chatLeads.$inferSelect;
export type InsertChatLead = z.infer<typeof insertChatLeadSchema>;

export type ImageUsage = typeof imageUsage.$inferSelect;
