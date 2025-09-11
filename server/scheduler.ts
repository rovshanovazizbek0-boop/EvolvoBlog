import { storage } from "./storage";
import { generateDailyBlogTopics, generateBlogPost } from "./gemini";
import { getImageForBlogPost } from "./unsplash";
import { postBlogToTelegram } from "./telegram";

const categories = [
  'AI va Avtomatlashtirish',
  'Telegram Botlar',
  'Veb Dasturlash',
  'Marketing Avtomatlashtirish',
  'Produktivlik',
  'AI Promptlar',
  "O'zbekiston Innovatsiyalar"
];

function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

function getRandomCategory(): string {
  return categories[Math.floor(Math.random() * categories.length)];
}

function getScheduledTimes(): Date[] {
  const times: Date[] = [];
  const now = new Date();
  
  // Check if we're in testing/development mode
  const isTestMode = process.env.NODE_ENV === "development" || process.env.BLOG_TEST_MODE === "true";
  
  if (isTestMode) {
    // For testing: schedule posts 1-7 minutes from now
    for (let i = 1; i <= 7; i++) {
      const scheduledTime = new Date(now.getTime() + (i * 60 * 1000)); // i minutes from now
      times.push(scheduledTime);
    }
  } else {
    // Production: Schedule posts throughout the day in Tashkent timezone (UTC+5)
    const tashkentOffset = 5 * 60 * 60 * 1000; // UTC+5 in milliseconds
    const today = new Date();
    const tashkentToday = new Date(today.getTime() + tashkentOffset);
    
    // Start from today at 8:00 AM Tashkent time
    const startHour = 8;
    const baseTime = new Date(tashkentToday.getFullYear(), tashkentToday.getMonth(), tashkentToday.getDate(), startHour);
    const baseTashkentTime = new Date(baseTime.getTime() - tashkentOffset); // Convert back to UTC
    
    // Schedule 7 posts throughout the day (8 AM, 10 AM, 12 PM, 2 PM, 4 PM, 6 PM, 8 PM Tashkent time)
    const hours = [0, 2, 4, 6, 8, 10, 12]; // Hours to add to base time (8 AM)
    
    for (let i = 0; i < 7; i++) {
      const scheduledTime = new Date(baseTashkentTime.getTime() + (hours[i] * 60 * 60 * 1000));
      times.push(scheduledTime);
    }
  }
  
  return times;
}

export async function generateDailyBlogPosts(): Promise<void> {
  try {
    console.log('📅 Starting daily blog post generation...');

    // Get used image IDs from last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    // Get actual used image IDs from database
    const usedImageIds = await storage.getUsedImageIds(ninetyDaysAgo);

    // Generate 7 topics
    const topics = await generateDailyBlogTopics();
    const scheduledTimes = getScheduledTimes();

    for (let i = 0; i < 7 && i < topics.length; i++) {
      const topic = topics[i];
      const category = getRandomCategory();
      const scheduledTime = scheduledTimes[i];

      try {
        console.log(`🤖 Generating AI content for: ${topic}`);

        // Generate blog content
        const blogData = await generateBlogPost(topic, category);
        console.log(`✅ Generated blog content: ${blogData.title}`);

        // Get unique image
        console.log(`🖼️ Fetching image from Unsplash for: ${category}`);
        const image = await getImageForBlogPost(category, usedImageIds);
        if (!image) {
          console.error(`❌ Failed to get image for post: ${topic}`);
          continue;
        }
        console.log(`✅ Got Unsplash image: ${image.id}`);

        // Record image usage
        await storage.recordImageUsage(image.id);
        usedImageIds.push(image.id);

        // Create slug
        const slug = createSlug(blogData.title);

        // Save blog post
        await storage.createBlogPost({
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
          publishedAt: scheduledTime,
          status: 'scheduled',
        });

        console.log(`✅ Created scheduled post: ${blogData.title}`);
      } catch (error) {
        console.error(`❌ Error creating post for "${topic}":`, error);
      }
    }

    console.log('✅ Daily blog post generation completed');
  } catch (error) {
    console.error('❌ Failed to generate daily blog posts:', error);
  }
}

export async function publishScheduledPosts(): Promise<void> {
  try {
    const now = new Date();
    const scheduledPosts = await storage.getScheduledPosts();

    for (const post of scheduledPosts) {
      if (post.publishedAt && post.publishedAt <= now) {
        // Update status to published
        await storage.updateBlogPost(post.id, {
          status: 'published',
        });

        // Post to Telegram if not already posted
        if (!post.telegramPosted) {
          console.log(`📤 Sending to Telegram: ${post.title}`);
          try {
            await postBlogToTelegram({
              title: post.title,
              excerpt: post.excerpt,
              slug: post.slug,
              category: post.category,
              imageUrl: post.imageUrl,
            });

            // Mark as posted to Telegram
            await storage.updateBlogPost(post.id, {
              telegramPosted: true,
            });
            console.log(`✅ Successfully sent to Telegram: ${post.title}`);
          } catch (telegramError) {
            console.error(`❌ Failed to send to Telegram: ${post.title}`, telegramError);
          }
        }

        console.log(`✅ Published post: ${post.title}`);
      }
    }
  } catch (error) {
    console.error('Failed to publish scheduled posts:', error);
  }
}

// Check if it's time to generate daily blog posts
export function shouldGenerateDailyPosts(): boolean {
  const now = new Date();
  const tashkentTime = new Date(now.getTime() + (5 * 60 * 60 * 1000)); // UTC+5
  
  // In production: only generate posts once per day at 23:00 (within a 5-minute window)
  const isProduction = process.env.NODE_ENV === "production";
  
  if (isProduction) {
    const hour = tashkentTime.getHours();
    const minute = tashkentTime.getMinutes();
    
    // Generate posts between 23:00 and 23:05 Tashkent time
    return hour === 23 && minute >= 0 && minute <= 5;
  } else {
    // In development/testing, allow generation anytime
    return true;
  }
}

// Lightweight scheduler for development only
export function startScheduler(): () => void {
  const isProduction = process.env.NODE_ENV === "production";
  
  if (isProduction) {
    console.log('📅 Production mode: Blog scheduler will be triggered by external webhooks');
    console.log('📌 Set up external cron services to call:');
    console.log('   - POST /api/webhooks/generate-daily-posts (daily at 23:00 Tashkent)');
    console.log('   - POST /api/webhooks/publish-scheduled (every 5 minutes)');
    
    // In production, we don't use intervals - external services will trigger webhooks
    return () => {
      console.log('Production scheduler cleanup (no-op)');
    };
  }
  
  // Development/testing mode: use intervals for convenience
  console.log('🔧 Development mode: Using internal intervals for blog scheduler');
  
  // Publish scheduled posts every 1 minute in development
  const publishInterval = setInterval(() => {
    publishScheduledPosts();
  }, 60 * 1000);

  console.log('Blog scheduler started (development mode)');

  // Cleanup function
  return () => {
    clearInterval(publishInterval);
    console.log('Development scheduler stopped');
  };
}

// Webhook handler for generating daily posts
export async function handleGenerateDailyPostsWebhook(): Promise<{ success: boolean; message: string; postsGenerated?: number }> {
  try {
    console.log('🎣 Webhook triggered: Generate daily blog posts');
    
    const isProduction = process.env.NODE_ENV === "production";
    const canGenerate = isProduction ? shouldGenerateDailyPosts() : true;
    
    if (!canGenerate && isProduction) {
      const msg = 'Blog generation skipped: Not within allowed time window (23:00-23:05 Tashkent)';
      console.log(`⏰ ${msg}`);
      return { success: false, message: msg };
    }
    
    // Check if we already generated posts today
    if (isProduction) {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const recentPosts = await storage.getBlogPostsCreatedAfter(startOfDay);
      
      if (recentPosts.length >= 7) {
        const msg = `Daily posts already generated today (${recentPosts.length} posts found)`;
        console.log(`✅ ${msg}`);
        return { success: true, message: msg, postsGenerated: 0 };
      }
    }
    
    await generateDailyBlogPosts();
    
    return { success: true, message: 'Daily blog posts generated successfully', postsGenerated: 7 };
  } catch (error) {
    console.error('❌ Webhook error - Generate daily posts:', error);
    return { success: false, message: `Failed to generate daily posts: ${error instanceof Error ? error.message : String(error)}` };
  }
}

// Webhook handler for publishing scheduled posts
export async function handlePublishScheduledWebhook(): Promise<{ success: boolean; message: string; postsPublished?: number }> {
  try {
    console.log('🎣 Webhook triggered: Publish scheduled posts');
    
    const scheduledPosts = await storage.getScheduledPosts();
    const now = new Date();
    let publishedCount = 0;
    
    for (const post of scheduledPosts) {
      if (post.publishedAt && post.publishedAt <= now) {
        publishedCount++;
      }
    }
    
    if (publishedCount === 0) {
      const msg = 'No posts ready to publish at this time';
      console.log(`⏰ ${msg}`);
      return { success: true, message: msg, postsPublished: 0 };
    }
    
    await publishScheduledPosts();
    
    return { success: true, message: `Published ${publishedCount} scheduled posts`, postsPublished: publishedCount };
  } catch (error) {
    console.error('❌ Webhook error - Publish scheduled posts:', error);
    return { success: false, message: `Failed to publish scheduled posts: ${error instanceof Error ? error.message : String(error)}` };
  }
}
