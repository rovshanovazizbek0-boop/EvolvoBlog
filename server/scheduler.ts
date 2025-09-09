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
  // For testing: schedule posts 1-7 minutes from now
  const now = new Date();
  const times: Date[] = [];
  
  for (let i = 1; i <= 7; i++) {
    const scheduledTime = new Date(now.getTime() + (i * 60 * 1000)); // i minutes from now
    times.push(scheduledTime);
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

export function startScheduler(): () => void {
  // Generate daily posts at 23:00 Tashkent time (UTC+5)
  const generateInterval = setInterval(() => {
    const now = new Date();
    const tashkentTime = new Date(now.getTime() + (5 * 60 * 60 * 1000)); // UTC+5
    
    if (tashkentTime.getHours() === 23 && tashkentTime.getMinutes() === 0) {
      generateDailyBlogPosts();
    }
  }, 60000); // Check every minute

  // Publish scheduled posts every 1 minute (testing mode)
  const publishInterval = setInterval(() => {
    publishScheduledPosts();
  }, 60 * 1000); // Every 1 minute for testing

  console.log('Blog scheduler started');

  // Cleanup function
  return () => {
    clearInterval(generateInterval);
    clearInterval(publishInterval);
  };
}
