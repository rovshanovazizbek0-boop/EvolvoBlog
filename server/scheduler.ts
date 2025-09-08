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
  const times = ['07:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00'];
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return times.map(time => {
    const [hours, minutes] = time.split(':').map(Number);
    const scheduledDate = new Date(tomorrow);
    scheduledDate.setHours(hours, minutes, 0, 0);
    return scheduledDate;
  });
}

export async function generateDailyBlogPosts(): Promise<void> {
  try {
    console.log('Starting daily blog post generation...');

    // Get used image IDs from last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    // This is a simplified version - in production you'd query for used image IDs
    const usedImageIds: string[] = [];

    // Generate 7 topics
    const topics = await generateDailyBlogTopics();
    const scheduledTimes = getScheduledTimes();

    for (let i = 0; i < 7 && i < topics.length; i++) {
      const topic = topics[i];
      const category = getRandomCategory();
      const scheduledTime = scheduledTimes[i];

      try {
        console.log(`Generating post ${i + 1}: ${topic}`);

        // Generate blog content
        const blogData = await generateBlogPost(topic, category);

        // Get unique image
        const image = await getImageForBlogPost(category, usedImageIds);
        if (!image) {
          console.error(`Failed to get image for post: ${topic}`);
          continue;
        }

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

        console.log(`Created scheduled post: ${blogData.title}`);
      } catch (error) {
        console.error(`Failed to create post for topic "${topic}":`, error);
      }
    }

    console.log('Daily blog post generation completed');
  } catch (error) {
    console.error('Failed to generate daily blog posts:', error);
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
        }

        console.log(`Published post: ${post.title}`);
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

  // Publish scheduled posts every 5 minutes
  const publishInterval = setInterval(() => {
    publishScheduledPosts();
  }, 5 * 60 * 1000); // Every 5 minutes

  console.log('Blog scheduler started');

  // Cleanup function
  return () => {
    clearInterval(generateInterval);
    clearInterval(publishInterval);
  };
}
