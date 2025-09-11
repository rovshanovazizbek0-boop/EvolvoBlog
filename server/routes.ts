import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool, checkDatabaseHealth } from "./db";
import { storage } from "./storage";
import { generateServiceExplanation, generateChatResponse, generateServiceRecommendations } from "./gemini";
import { notifyNewOrder, validateTelegramConfiguration, getTelegramSetupInstructions, validateTelegramChat } from "./telegram";
import { startScheduler, generateDailyBlogPosts, publishScheduledPosts, handleGenerateDailyPostsWebhook, handlePublishScheduledWebhook } from "./scheduler";
import { insertOrderSchema, insertServiceSchema, insertUserSchema, insertPortfolioSchema, insertChatConversationSchema, insertChatMessageSchema, insertChatLeadSchema } from "@shared/schema";

// Environment validation for production
if (process.env.NODE_ENV === "production") {
  const requiredEnvVars = ['SESSION_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables for production: ${missingVars.join(', ')}`);
    process.exit(1);
  }
}

// Session store configuration
const PostgresStore = connectPgSimple(session);

// Session configuration
const isHosted = !!(process.env.NODE_ENV === "production" || process.env.REPL_ID); // Replit or production
const sessionConfig = {
  secret: process.env.SESSION_SECRET || "evolvo-secret-key",
  resave: false,
  saveUninitialized: false,
  store: process.env.NODE_ENV === "production" 
    ? new PostgresStore({
        pool: pool,
        tableName: 'session',
        createTableIfMissing: true,
      })
    : undefined, // Use memory store for development
  cookie: {
    secure: isHosted, // Use secure cookies in hosted environments
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: isHosted ? "none" as const : "lax" as const, // Allow cross-site for hosted
  },
};

// Authentication middleware
function requireAuth(req: any, res: any, next: any) {
  if (req.session?.userId) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
}

// Extend session interface
declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // CORS middleware for development
  if (process.env.NODE_ENV === "development") {
    app.use((req, res, next) => {
      const origin = req.headers.origin;
      const allowedOrigins = ['http://localhost:5000', 'https://localhost:5000'];
      
      // Allow Replit domains
      if (origin && (origin.includes('.replit.dev') || origin.includes('.repl.co') || allowedOrigins.includes(origin))) {
        res.header("Access-Control-Allow-Origin", origin);
      } else {
        res.header("Access-Control-Allow-Origin", "http://localhost:5000");
      }
      
      res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
      res.header("Access-Control-Allow-Credentials", "true");
      if (req.method === "OPTIONS") {
        res.sendStatus(200);
      } else {
        next();
      }
    });
  }

  // Session middleware
  app.use(session(sessionConfig));

  // Validate Telegram configuration on startup
  try {
    const telegramValidation = await validateTelegramConfiguration();
    if (!telegramValidation.valid) {
      console.log('');
      console.log('⚠️  TELEGRAM CONFIGURATION ISSUES DETECTED:');
      telegramValidation.errors.forEach(error => console.log(`❌ ${error}`));
      console.log('');
      
      const instructions = getTelegramSetupInstructions();
      instructions.forEach(instruction => console.log(instruction));
      console.log('');
      
      console.log('📝 Note: Blog posts will still be generated and published to the website, but Telegram posting will be skipped.');
      console.log('🔧 Fix the above issues to enable Telegram posting.');
      console.log('');
    }
  } catch (error) {
    console.error('❌ Error during Telegram validation:', error);
  }

  // Initialize default services if none exist
  await initializeDefaultServices();

  // Start blog scheduler
  startScheduler();

  // Health check endpoint for Render
  app.get("/api/health", async (req, res) => {
    try {
      const dbHealth = await checkDatabaseHealth();
      
      if (dbHealth.healthy) {
        res.status(200).json({ 
          status: "OK", 
          timestamp: new Date().toISOString(),
          service: "evolvo-uz-api",
          database: {
            status: "connected",
            latency: `${dbHealth.latency}ms`
          }
        });
      } else {
        res.status(503).json({ 
          status: "SERVICE_UNAVAILABLE", 
          timestamp: new Date().toISOString(),
          service: "evolvo-uz-api",
          database: {
            status: "disconnected",
            error: dbHealth.error,
            latency: `${dbHealth.latency}ms`
          }
        });
      }
    } catch (error) {
      res.status(503).json({ 
        status: "SERVICE_UNAVAILABLE", 
        timestamp: new Date().toISOString(),
        service: "evolvo-uz-api",
        database: {
          status: "error",
          error: error instanceof Error ? error.message : String(error)
        }
      });
    }
  });

  // Public API routes

  // Get all services
  app.get("/api/services", async (req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  // Get service by ID
  app.get("/api/services/:id", async (req, res) => {
    try {
      const service = await storage.getService(req.params.id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      console.error("Error fetching service:", error);
      res.status(500).json({ message: "Failed to fetch service" });
    }
  });

  // AI explanation endpoint
  app.post("/api/ai/explain", async (req, res) => {
    try {
      const { serviceId, question } = req.body;

      if (!serviceId || !question) {
        return res.status(400).json({ message: "Service ID and question are required" });
      }

      const service = await storage.getService(serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      const explanation = await generateServiceExplanation(
        service.title,
        service.aiPromptTemplate,
        question
      );

      res.json({ explanation });
    } catch (error) {
      console.error("Error generating AI explanation:", error);
      res.status(500).json({ message: "Failed to generate explanation" });
    }
  });

  // Submit order
  app.post("/api/orders", async (req, res) => {
    try {
      // Convert deadline string to Date if provided
      const requestBody = {
        ...req.body,
        deadline: req.body.deadline ? new Date(req.body.deadline) : undefined,
      };
      
      const validatedData = insertOrderSchema.parse(requestBody);
      
      const order = await storage.createOrder(validatedData);
      
      // Get service details for notification
      const service = await storage.getService(order.serviceId);
      if (service) {
        // Send notifications
        await notifyNewOrder({
          id: order.id,
          clientName: order.clientName,
          telegramUsername: order.telegramUsername,
          serviceTitle: service.title,
          details: order.details,
        });
      }

      res.status(201).json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Get blog posts
  app.get("/api/blog", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const posts = await storage.getBlogPosts(limit);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  // Get blog post by slug
  app.get("/api/blog/:slug", async (req, res) => {
    try {
      const post = await storage.getBlogPost(req.params.slug);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching blog post:", error);
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  // Get all portfolio items
  app.get("/api/portfolio", async (req, res) => {
    try {
      const portfolioItems = await storage.getPortfolioItems();
      res.json(portfolioItems);
    } catch (error) {
      console.error("Error fetching portfolio items:", error);
      res.status(500).json({ message: "Failed to fetch portfolio items" });
    }
  });

  // Get featured portfolio items
  app.get("/api/portfolio/featured", async (req, res) => {
    try {
      const featuredItems = await storage.getFeaturedPortfolioItems();
      res.json(featuredItems);
    } catch (error) {
      console.error("Error fetching featured portfolio items:", error);
      res.status(500).json({ message: "Failed to fetch featured portfolio items" });
    }
  });

  // Get portfolio item by ID
  app.get("/api/portfolio/:id", async (req, res) => {
    try {
      const item = await storage.getPortfolioItem(req.params.id);
      if (!item) {
        return res.status(404).json({ message: "Portfolio item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error fetching portfolio item:", error);
      res.status(500).json({ message: "Failed to fetch portfolio item" });
    }
  });

  // Chat API endpoints

  // Start or get existing conversation
  app.post("/api/chat/conversation", async (req, res) => {
    try {
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }

      // Check if conversation already exists
      let conversation = await storage.getChatConversation(sessionId);
      
      if (!conversation) {
        // Create new conversation
        conversation = await storage.createChatConversation({
          sessionId,
          status: "active",
          leadScore: 0,
          interestedServices: [],
        });
      }

      res.json(conversation);
    } catch (error) {
      console.error("Error managing conversation:", error);
      res.status(500).json({ message: "Failed to manage conversation" });
    }
  });

  // Send message and get AI response
  app.post("/api/chat/message", async (req, res) => {
    try {
      const { conversationId, message, messageType = "text", metadata = {} } = req.body;

      if (!conversationId || !message) {
        return res.status(400).json({ message: "Conversation ID and message are required" });
      }

      // Verify conversation exists before creating messages (prevent foreign key violations)
      const existingConversation = await storage.getChatConversationById(conversationId);
      if (!existingConversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      // Save user message
      const userMessage = await storage.createChatMessage({
        conversationId,
        content: message,
        isUser: true,
        messageType,
        metadata,
      });

      // Generate AI response
      const aiResponse = await generateChatResponse(message, conversationId);
      
      // Save AI response
      const aiMessage = await storage.createChatMessage({
        conversationId,
        content: aiResponse.content,
        isUser: false,
        messageType: aiResponse.messageType || "text",
        metadata: aiResponse.metadata || {},
      });

      // Update conversation with last message
      await storage.updateChatConversation(conversationId, {
        lastMessage: message,
        leadScore: aiResponse.leadScore || 0,
        interestedServices: aiResponse.interestedServices || [],
      });

      res.json({
        userMessage,
        aiMessage,
        recommendations: aiResponse.recommendations || [],
        leadForm: aiResponse.leadForm || null,
      });
    } catch (error) {
      console.error("Error processing message:", error);
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  // Get conversation messages
  app.get("/api/chat/messages/:conversationId", async (req, res) => {
    try {
      const messages = await storage.getChatMessages(req.params.conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Create chat lead
  app.post("/api/chat/lead", async (req, res) => {
    try {
      console.log('🔍 Lead submission debug:', {
        body: req.body,
        conversationId: req.body.conversationId,
        sessionId: req.body.sessionId
      });
      
      // Accept both conversationId and sessionId (fallback)
      const { conversationId, sessionId, ...leadData } = req.body;
      
      // If no conversationId but sessionId provided, we'll find/create conversation first
      let tempConversationId = conversationId;
      
      if (!tempConversationId && sessionId) {
        // Try to find existing conversation by sessionId
        console.log(`🔍 No conversationId provided, looking up by sessionId: ${sessionId}`);
        let existingConversation = await storage.getChatConversation(sessionId);
        
        if (!existingConversation) {
          // Create new conversation for this sessionId
          console.log(`🆕 Creating new conversation for sessionId: ${sessionId}`);
          existingConversation = await storage.createChatConversation({
            sessionId,
            status: "active",
            leadScore: 0,
            interestedServices: [],
          });
          console.log(`✅ Created new conversation: ${existingConversation.id}`);
        }
        
        tempConversationId = existingConversation.id;
      }
      
      // Validate input data with proper schema - now we have a conversationId
      const validatedData = insertChatLeadSchema.parse({
        conversationId: tempConversationId,
        ...leadData
      });
      
      console.log('✅ Validated lead data:', {
        conversationId: validatedData.conversationId,
        name: validatedData.name,
        phone: validatedData.phone
      });

      // Final validation - ensure we have a valid conversationId
      if (!validatedData.conversationId) {
        console.error('❌ No conversationId available after processing. Original conversationId:', conversationId, 'SessionId:', sessionId);
        return res.status(400).json({ 
          message: "Cannot associate lead with conversation. Please provide conversationId or sessionId." 
        });
      }

      // Verify the conversation exists
      const conversation = await storage.getChatConversationById(validatedData.conversationId);
      console.log(`🔍 Final conversation verification (${validatedData.conversationId}):`, conversation ? 'FOUND' : 'NOT FOUND');
      
      if (!conversation) {
        console.error('❌ Conversation verification failed for ID:', validatedData.conversationId);
        return res.status(500).json({ message: "Failed to verify conversation" });
      }

      console.log(`🎯 Creating lead for conversation: ${conversation.id}`);
      const lead = await storage.createChatLead(validatedData);
      console.log(`✅ Lead created successfully:`, lead.id);
      
      // Update conversation status if lead is created
      await storage.updateChatConversation(conversation.id, {
        status: "converted",
        clientName: validatedData.name,
        clientPhone: validatedData.phone,
        clientTelegram: validatedData.telegramUsername,
      });
      console.log(`📝 Updated conversation status to converted`);

      res.status(201).json(lead);
    } catch (error: any) {
      console.error("❌ Error creating lead:", error);
      if (error.name === 'ZodError') {
        console.error("❌ Validation errors:", error.errors);
        return res.status(400).json({ message: "Invalid lead data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create lead" });
    }
  });

  // Get service recommendations
  app.post("/api/chat/recommendations", async (req, res) => {
    try {
      const { requirements, budget, timeline } = req.body;
      
      const services = await storage.getServices();
      const recommendations = await generateServiceRecommendations(services, requirements, budget, timeline);
      
      res.json(recommendations);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  // Webhook endpoints for scheduled tasks (public endpoints for external cron services)
  
  // Webhook to trigger daily blog post generation
  app.post("/api/webhooks/generate-daily-posts", async (req, res) => {
    try {
      console.log('🎣 Webhook called: Generate daily blog posts');
      const result = await handleGenerateDailyPostsWebhook();
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('❌ Webhook endpoint error - Generate daily posts:', error);
      res.status(500).json({
        success: false,
        message: `Internal server error: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  // Webhook to trigger scheduled post publishing
  app.post("/api/webhooks/publish-scheduled", async (req, res) => {
    try {
      console.log('🎣 Webhook called: Publish scheduled posts');
      const result = await handlePublishScheduledWebhook();
      
      res.status(200).json(result);
    } catch (error) {
      console.error('❌ Webhook endpoint error - Publish scheduled posts:', error);
      res.status(500).json({
        success: false,
        message: `Internal server error: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  });

  // Health check endpoint specifically for webhook callers to verify service is awake
  app.get("/api/webhooks/health", async (req, res) => {
    try {
      const dbHealth = await checkDatabaseHealth();
      res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString(),
        service: "evolvo-uz-webhooks",
        scheduler: process.env.NODE_ENV === "production" ? "webhook-mode" : "interval-mode",
        database: dbHealth.healthy ? "connected" : "disconnected"
      });
    } catch (error) {
      res.status(503).json({
        status: "SERVICE_UNAVAILABLE",
        timestamp: new Date().toISOString(),
        service: "evolvo-uz-webhooks",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Admin Authentication

  // Admin login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      (req.session as any).userId = user.id;
      res.json({ message: "Login successful", user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } });
    } catch (error) {
      console.error("Error during admin login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Admin logout
  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Check admin auth status
  app.get("/api/admin/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser((req.session as any).userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      res.json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName });
    } catch (error) {
      console.error("Error fetching admin user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Protected Admin Routes

  // Get all orders
  app.get("/api/admin/orders", requireAuth, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Update order status
  app.patch("/api/admin/orders/:id", requireAuth, async (req, res) => {
    try {
      const { status, adminNotes } = req.body;
      const order = await storage.updateOrder(req.params.id, { status, adminNotes });
      res.json(order);
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  // Manual blog generation (admin only)
  app.post("/api/admin/generate-blog", requireAuth, async (req, res) => {
    try {
      const { generateDailyBlogPosts } = await import("./scheduler");
      await generateDailyBlogPosts();
      res.json({ message: "Blog posts generated successfully" });
    } catch (error) {
      console.error("Error generating blog posts:", error);
      res.status(500).json({ message: "Failed to generate blog posts" });
    }
  });

  // Admin services management
  app.get("/api/admin/services", requireAuth, async (req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      console.error("Error fetching admin services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.post("/api/admin/services", requireAuth, async (req, res) => {
    try {
      const validatedData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(validatedData);
      res.status(201).json(service);
    } catch (error) {
      console.error("Error creating service:", error);
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  app.patch("/api/admin/services/:id", requireAuth, async (req, res) => {
    try {
      const service = await storage.updateService(req.params.id, req.body);
      res.json(service);
    } catch (error) {
      console.error("Error updating service:", error);
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete("/api/admin/services/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteService(req.params.id);
      res.json({ message: "Service deleted successfully" });
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // Get all clients
  app.get("/api/admin/clients", requireAuth, async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  // Update client notes
  app.patch("/api/admin/clients/:id", requireAuth, async (req, res) => {
    try {
      const { notes } = req.body;
      const client = await storage.updateClient(req.params.id, { notes });
      res.json(client);
    } catch (error) {
      console.error("Error updating client:", error);
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  // Admin portfolio management
  app.get("/api/admin/portfolio", requireAuth, async (req, res) => {
    try {
      const portfolioItems = await storage.getPortfolioItems();
      res.json(portfolioItems);
    } catch (error) {
      console.error("Error fetching admin portfolio items:", error);
      res.status(500).json({ message: "Failed to fetch portfolio items" });
    }
  });

  app.post("/api/admin/portfolio", requireAuth, async (req, res) => {
    try {
      const requestBody = {
        ...req.body,
        completedAt: req.body.completedAt ? new Date(req.body.completedAt) : new Date(),
      };
      const validatedData = insertPortfolioSchema.parse(requestBody);
      const item = await storage.createPortfolioItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating portfolio item:", error);
      res.status(500).json({ message: "Failed to create portfolio item" });
    }
  });

  app.patch("/api/admin/portfolio/:id", requireAuth, async (req, res) => {
    try {
      const requestBody = {
        ...req.body,
        completedAt: req.body.completedAt ? new Date(req.body.completedAt) : undefined,
      };
      const item = await storage.updatePortfolioItem(req.params.id, requestBody);
      res.json(item);
    } catch (error) {
      console.error("Error updating portfolio item:", error);
      res.status(500).json({ message: "Failed to update portfolio item" });
    }
  });

  app.delete("/api/admin/portfolio/:id", requireAuth, async (req, res) => {
    try {
      await storage.deletePortfolioItem(req.params.id);
      res.json({ message: "Portfolio item deleted successfully" });
    } catch (error) {
      console.error("Error deleting portfolio item:", error);
      res.status(500).json({ message: "Failed to delete portfolio item" });
    }
  });

  // Test endpoint for generating blog posts (development only)
  if (process.env.NODE_ENV === "development") {
    app.post("/api/admin/test-blog-generation", requireAuth, async (req, res) => {
      try {
        console.log("🧪 Starting test blog post generation...");
        await generateDailyBlogPosts();
        res.json({ message: "Blog posts generation completed successfully" });
      } catch (error) {
        console.error("❌ Error in test blog generation:", error);
        res.status(500).json({ message: "Failed to generate blog posts", error: error instanceof Error ? error.message : String(error) });
      }
    });

    // Test single blog post creation
    app.post("/api/admin/test-single-blog", requireAuth, async (req, res) => {
      try {
        const { topic = "AI ning kelajagi - Biznes dunyosida yangi imkoniyatlar" } = req.body;
        console.log(`🧪 Testing single blog creation for: ${topic}`);
        
        // Generate just one blog post for immediate testing
        const category = "AI va Avtomatlashtirish";
        const now = new Date();
        const publishTime = new Date(now.getTime() + 30 * 1000); // 30 seconds from now
        
        console.log(`🤖 Generating AI content for: ${topic}`);
        const { generateBlogPost } = await import("./gemini");
        const { getImageForBlogPost } = await import("./unsplash");
        
        const blogData = await generateBlogPost(topic, category);
        console.log(`✅ Generated blog content: ${blogData.title}`);

        console.log(`🖼️ Fetching image from Unsplash for: ${category}`);
        const image = await getImageForBlogPost(category, []);
        if (!image) {
          throw new Error("Failed to get image from Unsplash");
        }
        console.log(`✅ Got Unsplash image: ${image.id}`);

        // Record image usage
        await storage.recordImageUsage(image.id);

        // Create slug
        const slug = topic.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').trim();

        // Save blog post
        const post = await storage.createBlogPost({
          title: blogData.title,
          slug,
          content: blogData.content,
          excerpt: blogData.excerpt,
          metaDescription: blogData.metaDescription,
          keywords: blogData.keywords,
          imageUrl: image.urls.regular,
          imageUnsplashId: image.id,
          category,
          readTime: blogData.readTime,
          publishedAt: publishTime,
          status: 'scheduled',
        });

        console.log(`✅ Created test blog post: ${blogData.title}`);
        res.json({ 
          message: "Single blog post created successfully", 
          post: {
            id: post.id,
            title: post.title,
            publishedAt: post.publishedAt,
            status: post.status
          }
        });
      } catch (error) {
        console.error("❌ Error creating single blog post:", error);
        res.status(500).json({ message: "Failed to create blog post", error: error instanceof Error ? error.message : String(error) });
      }
    });

    // Publish scheduled posts immediately (for testing)
    app.post("/api/admin/publish-scheduled", requireAuth, async (req, res) => {
      try {
        console.log("🚀 Publishing scheduled posts...");
        await publishScheduledPosts();
        res.json({ message: "Scheduled posts published successfully" });
      } catch (error) {
        console.error("❌ Error publishing scheduled posts:", error);
        res.status(500).json({ message: "Failed to publish scheduled posts", error: error instanceof Error ? error.message : String(error) });
      }
    });
  }

  // Telegram configuration validation endpoints (available in all environments)
  app.get("/api/admin/telegram/status", requireAuth, async (req, res) => {
    try {
      console.log('🔧 Admin requested Telegram status check');
      const validation = await validateTelegramConfiguration();
      
      res.json({
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings,
        instructions: validation.valid ? [] : getTelegramSetupInstructions()
      });
    } catch (error) {
      console.error("❌ Error checking Telegram status:", error);
      res.status(500).json({ 
        message: "Failed to check Telegram status", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  app.post("/api/admin/telegram/test", requireAuth, async (req, res) => {
    try {
      const { chatType = 'channel' } = req.body; // 'channel' or 'admin'
      console.log(`🧪 Admin testing ${chatType} chat access`);
      
      const channelId = chatType === 'channel' 
        ? process.env.TELEGRAM_CHANNEL_ID 
        : process.env.TELEGRAM_ADMIN_CHANNEL_ID;
      
      if (!channelId) {
        return res.status(400).json({ 
          valid: false,
          error: `TELEGRAM_${chatType.toUpperCase()}_CHANNEL_ID environment variable is not set`,
          instructions: getTelegramSetupInstructions()
        });
      }
      
      const validation = await validateTelegramChat(channelId, chatType as 'channel' | 'admin');
      
      if (validation.valid) {
        res.json({
          valid: true,
          message: `Successfully validated ${chatType} chat access`,
          chatInfo: validation.chatInfo
        });
      } else {
        res.status(400).json({
          valid: false,
          error: validation.error,
          instructions: getTelegramSetupInstructions()
        });
      }
    } catch (error) {
      console.error("❌ Error testing Telegram chat:", error);
      res.status(500).json({ 
        message: "Failed to test Telegram chat", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Initialize default services
async function initializeDefaultServices() {
  try {
    const existingServices = await storage.getServices();
    if (existingServices.length === 0) {
      const defaultServices = [
        {
          title: "Veb-sayt yaratish",
          description: "Zamonaviy va responsive veb-saytlar yaratish xizmati biznesingizni onlayn dunyoda professional ko'rinishda namoyish etishga yordam beradi.",
          priceRange: "$500 - $5000",
          duration: "5-14 kun",
          imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
          aiPromptTemplate: "Siz {service} xizmatimiz bilan qiziqasiz. Sizning veb-saytingiz qanday funksiyalarga ega bo'lishi kerak? Qanday dizayn uslubini afzal ko'rasiz? Target auditoriyangiz kim?",
          features: ["Responsive dizayn", "SEO optimizatsiya", "Admin panel", "1 yil texnik yordam"],
        },
        {
          title: "Telegram botlar",
          description: "Biznes uchun maxsus Telegram botlar yaratish va avtomatlashtirish xizmatlari.",
          priceRange: "$200 - $2000",
          duration: "3-10 kun",
          imageUrl: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
          aiPromptTemplate: "Sizning {service} loyihangiz uchun qanday funksiyalar kerak? Bot qanday vazifalarni bajarishi kerak? Nechta foydalanuvchi bilan ishlaydi?",
          features: ["Custom komandalar", "Database integratsiya", "Payment tizimi", "Analytics"],
        },
        {
          title: "AI Chatbotlar",
          description: "Aqlli chatbot va virtual assistentlar yaratish xizmatlari.",
          priceRange: "$300 - $3000",
          duration: "5-12 kun",
          imageUrl: "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
          aiPromptTemplate: "{service} uchun qanday AI funksiyalar kerak? Chatbot qaysi tillarda ishlashi kerak? Qanday ma'lumotlar bilan o'qitish kerak?",
          features: ["Natural Language Processing", "Multi-language support", "Learning capabilities", "Integration options"],
        },
        {
          title: "Biznes avtomatlashtirish",
          description: "Biznes jarayonlarini avtomatlashtirish va optimizatsiya qilish xizmatlari.",
          priceRange: "$400 - $4000",
          duration: "7-21 kun",
          imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
          aiPromptTemplate: "Biznesingizning qaysi jarayonlarini avtomatlashtirmoqchisiz? Qanday tizimlar bilan integratsiya kerak? Qaysi metrikalarni kuzatish muhim?",
          features: ["Process automation", "API integrations", "Reporting dashboards", "Workflow optimization"],
        },
      ];

      for (const service of defaultServices) {
        await storage.createService(service);
      }

      console.log("Default services initialized");
    }

    // Create default admin user if none exists
    const adminEmail = process.env.ADMIN_EMAIL || "admin@evolvo.uz";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    
    const adminUser = await storage.getUserByEmail(adminEmail);
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await storage.createUser({
        email: adminEmail,
        password: hashedPassword,
        firstName: "Admin",
        lastName: "User",
      });
      console.log(`Default admin user created: ${adminEmail} / ${adminPassword}`);
    }
  } catch (error) {
    console.error("Failed to initialize default data:", error);
  }
}
