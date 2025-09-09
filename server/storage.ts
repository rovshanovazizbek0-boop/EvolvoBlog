import {
  users,
  services,
  orders,
  blogPosts,
  clients,
  imageUsage,
  portfolio,
  type User,
  type InsertUser,
  type Service,
  type InsertService,
  type Order,
  type InsertOrder,
  type BlogPost,
  type InsertBlogPost,
  type Client,
  type InsertClient,
  type Portfolio,
  type InsertPortfolio,
  type ImageUsage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Service operations
  getServices(): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, service: Partial<InsertService>): Promise<Service>;
  deleteService(id: string): Promise<void>;

  // Order operations
  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order>;
  getOrdersByClient(telegramUsername: string): Promise<Order[]>;

  // Blog operations
  getBlogPosts(limit?: number): Promise<BlogPost[]>;
  getBlogPost(slug: string): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: string, post: Partial<InsertBlogPost>): Promise<BlogPost>;
  getScheduledPosts(): Promise<BlogPost[]>;

  // Client operations
  getClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client>;
  getClientByTelegram(telegramUsername: string): Promise<Client | undefined>;

  // Portfolio operations
  getPortfolioItems(): Promise<Portfolio[]>;
  getPortfolioItem(id: string): Promise<Portfolio | undefined>;
  createPortfolioItem(item: InsertPortfolio): Promise<Portfolio>;
  updatePortfolioItem(id: string, item: Partial<InsertPortfolio>): Promise<Portfolio>;
  deletePortfolioItem(id: string): Promise<void>;
  getFeaturedPortfolioItems(): Promise<Portfolio[]>;

  // Image tracking
  isImageUsedRecently(unsplashId: string, days: number): Promise<boolean>;
  recordImageUsage(unsplashId: string): Promise<void>;
  getUsedImageIds(since: Date): Promise<string[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
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

  // Service operations
  async getServices(): Promise<Service[]> {
    return await db.select().from(services).where(eq(services.isActive, true)).orderBy(desc(services.createdAt));
  }

  async getService(id: string): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async createService(insertService: InsertService): Promise<Service> {
    const [service] = await db.insert(services).values(insertService).returning();
    return service;
  }

  async updateService(id: string, updateData: Partial<InsertService>): Promise<Service> {
    const [service] = await db
      .update(services)
      .set(updateData)
      .where(eq(services.id, id))
      .returning();
    return service;
  }

  async deleteService(id: string): Promise<void> {
    await db.update(services).set({ isActive: false }).where(eq(services.id, id));
  }

  // Order operations
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values({
      ...insertOrder,
      updatedAt: new Date(),
    }).returning();
    
    // Update or create client
    await this.upsertClientFromOrder(order);
    
    return order;
  }

  async updateOrder(id: string, updateData: Partial<InsertOrder>): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async getOrdersByClient(telegramUsername: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.telegramUsername, telegramUsername))
      .orderBy(desc(orders.createdAt));
  }

  // Blog operations
  async getBlogPosts(limit = 20): Promise<BlogPost[]> {
    return await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.status, "published"))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(limit);
  }

  async getBlogPost(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return post;
  }

  async createBlogPost(insertPost: InsertBlogPost): Promise<BlogPost> {
    const [post] = await db.insert(blogPosts).values(insertPost).returning();
    return post;
  }

  async updateBlogPost(id: string, updateData: Partial<InsertBlogPost>): Promise<BlogPost> {
    const [post] = await db
      .update(blogPosts)
      .set(updateData)
      .where(eq(blogPosts.id, id))
      .returning();
    return post;
  }

  async getScheduledPosts(): Promise<BlogPost[]> {
    return await db
      .select()
      .from(blogPosts)
      .where(
        and(
          eq(blogPosts.status, "scheduled"),
          lte(blogPosts.publishedAt, new Date())
        )
      )
      .orderBy(blogPosts.publishedAt);
  }

  // Client operations
  async getClients(): Promise<Client[]> {
    return await db.select().from(clients).orderBy(desc(clients.updatedAt));
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db.insert(clients).values(insertClient).returning();
    return client;
  }

  async updateClient(id: string, updateData: Partial<InsertClient>): Promise<Client> {
    const [client] = await db
      .update(clients)
      .set(updateData)
      .where(eq(clients.id, id))
      .returning();
    return client;
  }

  async getClientByTelegram(telegramUsername: string): Promise<Client | undefined> {
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.telegramUsername, telegramUsername));
    return client;
  }

  // Image tracking
  async isImageUsedRecently(unsplashId: string, days: number): Promise<boolean> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const [usage] = await db
      .select()
      .from(imageUsage)
      .where(
        and(
          eq(imageUsage.unsplashId, unsplashId),
          gte(imageUsage.usedAt, cutoffDate)
        )
      );

    return !!usage;
  }

  async recordImageUsage(unsplashId: string): Promise<void> {
    await db.insert(imageUsage).values({ unsplashId }).onConflictDoUpdate({
      target: imageUsage.unsplashId,
      set: { usedAt: new Date() },
    });
  }

  async getUsedImageIds(since: Date): Promise<string[]> {
    const usages = await db
      .select({ unsplashId: imageUsage.unsplashId })
      .from(imageUsage)
      .where(gte(imageUsage.usedAt, since));
    
    return usages.map(usage => usage.unsplashId);
  }

  // Portfolio operations
  async getPortfolioItems(): Promise<Portfolio[]> {
    return await db
      .select()
      .from(portfolio)
      .where(eq(portfolio.isPublic, true))
      .orderBy(desc(portfolio.sortOrder), desc(portfolio.completedAt));
  }

  async getPortfolioItem(id: string): Promise<Portfolio | undefined> {
    const [item] = await db.select().from(portfolio).where(eq(portfolio.id, id));
    return item;
  }

  async createPortfolioItem(insertItem: InsertPortfolio): Promise<Portfolio> {
    const [item] = await db.insert(portfolio).values({
      ...insertItem,
      updatedAt: new Date(),
    }).returning();
    return item;
  }

  async updatePortfolioItem(id: string, updateData: Partial<InsertPortfolio>): Promise<Portfolio> {
    const [item] = await db
      .update(portfolio)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(portfolio.id, id))
      .returning();
    return item;
  }

  async deletePortfolioItem(id: string): Promise<void> {
    await db.delete(portfolio).where(eq(portfolio.id, id));
  }

  async getFeaturedPortfolioItems(): Promise<Portfolio[]> {
    return await db
      .select()
      .from(portfolio)
      .where(and(eq(portfolio.isPublic, true), eq(portfolio.featured, true)))
      .orderBy(desc(portfolio.sortOrder), desc(portfolio.completedAt))
      .limit(6);
  }

  // Helper method to upsert client from order
  private async upsertClientFromOrder(order: Order): Promise<void> {
    const existingClient = await this.getClientByTelegram(order.telegramUsername);
    
    if (existingClient) {
      await this.updateClient(existingClient.id, {
        totalOrders: (existingClient.totalOrders || 0) + 1,
      });
    } else {
      await this.createClient({
        name: order.clientName,
        phone: order.phone,
        telegramUsername: order.telegramUsername,
        totalOrders: 1,
        totalSpent: 0,
      });
    }
  }
}

export const storage = new DatabaseStorage();
