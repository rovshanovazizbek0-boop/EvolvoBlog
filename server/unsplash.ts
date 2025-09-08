const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || "";

export interface UnsplashImage {
  id: string;
  urls: {
    regular: string;
    small: string;
  };
  alt_description: string;
  user: {
    name: string;
  };
}

export async function searchUnsplashImage(
  query: string,
  excludeIds: string[] = []
): Promise<UnsplashImage | null> {
  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=30&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.statusText}`);
    }

    const data = await response.json();
    const images = data.results as UnsplashImage[];

    // Filter out excluded IDs
    const availableImages = images.filter(img => !excludeIds.includes(img.id));

    if (availableImages.length === 0) {
      return null;
    }

    // Return random image from available ones
    const randomIndex = Math.floor(Math.random() * availableImages.length);
    return availableImages[randomIndex];
  } catch (error) {
    console.error('Failed to fetch Unsplash image:', error);
    return null;
  }
}

export async function getImageForBlogPost(category: string, usedIds: string[]): Promise<UnsplashImage | null> {
  const queries = {
    'AI va Avtomatlashtirish': ['artificial intelligence', 'automation', 'robot technology', 'AI workspace'],
    'Telegram Botlar': ['telegram app', 'mobile messaging', 'chat interface', 'communication'],
    'Veb Dasturlash': ['web development', 'coding workspace', 'programming', 'computer screen'],
    'Marketing Avtomatlashtirish': ['digital marketing', 'analytics dashboard', 'business growth'],
    'Produktivlik': ['productivity workspace', 'organized desk', 'planning', 'efficiency'],
    'AI Promptlar': ['artificial intelligence', 'neural network', 'machine learning'],
    "O'zbekiston Innovatsiyalar": ['modern office', 'innovation', 'technology startup', 'business meeting'],
  };

  const categoryQueries = queries[category as keyof typeof queries] || ['technology', 'business'];
  
  // Try each query until we find an unused image
  for (const query of categoryQueries) {
    const image = await searchUnsplashImage(query, usedIds);
    if (image) {
      return image;
    }
  }

  // Fallback to generic tech image
  return await searchUnsplashImage('technology business', usedIds);
}
