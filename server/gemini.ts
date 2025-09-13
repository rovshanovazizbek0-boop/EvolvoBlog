import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY || "" });

export async function generateServiceExplanation(
  serviceTitle: string,
  aiPromptTemplate: string,
  userQuestion: string
): Promise<string> {
  const prompt = `
${aiPromptTemplate.replace("{service}", serviceTitle)}

Foydalanuvchi savoli: ${userQuestion}

Javobni o'zbek tilida bering va mijozga yordamchi bo'lish uchun savollar bering. Javob do'stona va professional bo'lsin.
`;

  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      return response.text || "Kechirasiz, hozir javob bera olmayapman. Iltimos, keyinroq urinib ko'ring.";
    } catch (error: any) {
      retryCount++;
      console.log(`🔄 Service explanation retry ${retryCount}/${maxRetries} for: ${serviceTitle}`);
      
      if (error.status === 503 && retryCount < maxRetries) {
        const waitTime = Math.pow(2, retryCount) * 1000;
        console.log(`⏳ Waiting ${waitTime/1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // For service explanation, return fallback message instead of throwing
      console.error('Failed to generate service explanation:', error);
      return "Kechirasiz, hozir AI xizmati vaqtincha mavjud emas. Iltimos, keyinroq urinib ko'ring yoki bizga to'g'ridan-to'g'ri murojaat qiling.";
    }
  }
  
  return "Kechirasiz, hozir AI xizmati vaqtincha mavjud emas. Iltimos, keyinroq urinib ko'ring yoki bizga to'g'ridan-to'g'ri murojaat qiling.";
}

export async function generateBlogPost(topic: string, category: string): Promise<{
  title: string;
  content: string;
  excerpt: string;
  metaDescription: string;
  keywords: string;
  readTime: number;
}> {
  const prompt = `
O'zbek tilida ${category} mavzusida "${topic}" haqida blog maqola yozing.

Quyidagi formatda javob bering:
- Sarlavha: qiziqarli va SEO-ga mos
- Mazmun: kamida 800 so'z, foydali ma'lumotlar bilan
- Qisqacha: 150-200 so'z
- Meta tavsif: 150-160 belgi
- Kalit so'zlar: 5-7 ta kalit so'z vergul bilan ajratilgan
- O'qish vaqti: daqiqa hisobida

Mazmun professional va qimmatli bo'lsin, real ma'lumotlar va maslahatlar bering.
`;

  // Retry logic for handling 503 errors
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              title: { type: "string" },
              content: { type: "string" },
              excerpt: { type: "string" },
              metaDescription: { type: "string" },
              keywords: { type: "string" },
              readTime: { type: "number" },
            },
            required: ["title", "content", "excerpt", "metaDescription", "keywords", "readTime"],
          },
        },
        contents: prompt,
      });

      const rawJson = response.text;
      if (rawJson) {
        return JSON.parse(rawJson);
      }
    } catch (error: any) {
      retryCount++;
      console.log(`🔄 Gemini API retry ${retryCount}/${maxRetries} for topic: ${topic}`);
      
      // Check if it's a 503 error (model overloaded)
      if (error.status === 503 && retryCount < maxRetries) {
        // Wait with exponential backoff: 2s, 4s, 8s
        const waitTime = Math.pow(2, retryCount) * 1000;
        console.log(`⏳ Waiting ${waitTime/1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // If it's not a 503 error or we've exhausted retries, throw the error
      throw error;
    }
  }

  throw new Error("Failed to generate blog post after all retries");
}

export async function generateDailyBlogTopics(): Promise<string[]> {
  const prompt = `
7 ta turli blog maqola mavzularini o'zbek tilida taklif qiling. Mavzular quyidagi kategoriyalardan bo'lsin:
- AI vositalari va avtomatlashtirish
- Telegram botlar va chatbotlar  
- Veb dasturlash va programmalashtirish
- Marketing avtomatlashtirish
- Produktivlik maslahatlar
- AI promptlar va ish oqimlari
- O'zbekiston bo'yicha innovatsiyalar

Har bir mavzu alohida qatorda bo'lsin, raqamsiz.
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const topics = response.text?.split('\n').filter(topic => topic.trim()).map(topic => topic.trim()) || [];
  return topics.slice(0, 7);
}

export async function generateChatResponse(
  userMessage: string,
  conversationId: string
): Promise<{
  content: string;
  messageType?: string;
  metadata?: any;
  leadScore?: number;
  interestedServices?: string[];
  recommendations?: any[];
  leadForm?: any;
}> {
  const prompt = `
Sen Evolvo.uz kompaniyasining AI yordamchisisan. Kompaniya quyidagi xizmatlarni taklif qiladi:

XIZMATLAR:
1. **Veb-sayt yaratish** - Zamonaviy, tez va SEO-ga optimallashtirilgan veb-saytlar
2. **Telegram botlar** - Biznes jarayonlarini avtomatlashtiruvchi botlar  
3. **AI chatbotlar** - Aqlli mijozlar bilan muloqot qiluvchi tizimlar
4. **Marketing avtomatlashtirish** - Reklama va sotishni avtomatlashtirish
5. **CRM tizimlar** - Mijozlar bilan ishlashni boshqarish tizimlari
6. **E-commerce yechimlar** - Onlayn do'kon va to'lov tizimlari

VAZIFANG:
- Mijozlar bilan do'stona va professional tarzda muloqot qil
- Xizmatlar haqida to'liq ma'lumot ber
- Mijozning ehtiyojini aniqlash uchun savollar ber
- Mos xizmatni tavsiya qil
- Lead sifatida aloqa ma'lumotlarini to'pla
- O'zbek tilida javob ber

Mijoz xabari: "${userMessage}"

Javobni natural va foydali qil. Agar mijoz ma'lum xizmatga qiziqsa, qo'shimcha savollar ber va lead score oshir.
`;

  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const content = response.text || "Kechirasiz, hozir javob bera olmayapman. Iltimos, keyinroq urinib ko'ring.";

      // Analyze message for lead scoring and service interest
      const analysis = await analyzeUserMessage(userMessage);

      return {
        content,
        messageType: "text",
        leadScore: analysis.leadScore,
        interestedServices: analysis.interestedServices,
        recommendations: analysis.recommendService ? await getServiceRecommendationsInternal(analysis.interestedServices) : [],
        leadForm: analysis.shouldCollectLead ? {
          show: true,
          title: "Biz bilan bog'laning",
          fields: ["name", "phone", "telegramUsername"]
        } : null,
      };
    } catch (error: any) {
      retryCount++;
      console.log(`🔄 Chat response retry ${retryCount}/${maxRetries}`);
      
      if (error.status === 503 && retryCount < maxRetries) {
        const waitTime = Math.pow(2, retryCount) * 1000;
        console.log(`⏳ Waiting ${waitTime/1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      console.error('Failed to generate chat response:', error);
      return {
        content: "Kechirasiz, hozir AI xizmati vaqtincha mavjud emas. Bizning telegram @evolvo_uz orqali murojaat qiling.",
        messageType: "text",
        leadScore: 0,
        interestedServices: [],
        recommendations: [],
        leadForm: null,
      };
    }
  }
  
  return {
    content: "Kechirasiz, hozir AI xizmati vaqtincha mavjud emas. Bizning telegram @evolvo_uz orqali murojaat qiling.",
    messageType: "text",
    leadScore: 0,
    interestedServices: [],
    recommendations: [],
    leadForm: null,
  };
}

async function analyzeUserMessage(message: string): Promise<{
  leadScore: number;
  interestedServices: string[];
  recommendService: boolean;
  shouldCollectLead: boolean;
}> {
  const lowerMessage = message.toLowerCase();
  
  let leadScore = 0;
  const interestedServices: string[] = [];
  
  // Service keywords analysis
  const serviceKeywords = {
    'website': ['sayt', 'website', 'veb', 'internet', 'landing'],
    'telegram-bot': ['bot', 'telegram', 'avtomatlashtirish', 'automation'],
    'ai-chatbot': ['chatbot', 'ai', 'sun\'iy', 'intellekt', 'chat'],
    'marketing': ['marketing', 'reklama', 'smm', 'targetolog'],
    'crm': ['crm', 'mijoz', 'boshqarish', 'customer'],
    'ecommerce': ['do\'kon', 'shop', 'ecommerce', 'sotish', 'commerce']
  };

  // Intent keywords analysis
  const intentKeywords = {
    high: ['buyurtma', 'order', 'kerak', 'need', 'xohlaman', 'want', 'qancha', 'price', 'narx'],
    medium: ['qiziqaman', 'interested', 'ma\'lumot', 'info', 'bilmoqchiman'],
    low: ['salom', 'hello', 'help', 'yordam']
  };

  // Analyze services interest
  for (const [service, keywords] of Object.entries(serviceKeywords)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      interestedServices.push(service);
      leadScore += 20;
    }
  }

  // Analyze intent level
  if (intentKeywords.high.some(keyword => lowerMessage.includes(keyword))) {
    leadScore += 50;
  } else if (intentKeywords.medium.some(keyword => lowerMessage.includes(keyword))) {
    leadScore += 30;
  } else if (intentKeywords.low.some(keyword => lowerMessage.includes(keyword))) {
    leadScore += 10;
  }

  return {
    leadScore: Math.min(leadScore, 100),
    interestedServices,
    recommendService: interestedServices.length > 0,
    shouldCollectLead: leadScore >= 60,
  };
}

async function getServiceRecommendationsInternal(interestedServices: string[]): Promise<any[]> {
  // Import storage to get real services from database
  const { storage } = await import('./storage');
  
  try {
    const allServices = await storage.getServices();
    
    if (!allServices || allServices.length === 0) {
      console.log('No services found in database, using fallback recommendations');
      return getFallbackRecommendations(interestedServices);
    }

    // Map interest categories to actual service keywords for matching
    const serviceMatching: Record<string, string[]> = {
      'website': ['veb', 'sayt', 'website', 'landing', 'web'],
      'telegram-bot': ['bot', 'telegram', 'avtomatlashtirish'],
      'ai-chatbot': ['ai', 'chatbot', 'sun\'iy', 'intellekt'],
      'marketing': ['marketing', 'reklama', 'smm'],
      'crm': ['crm', 'mijoz', 'boshqarish'],
      'ecommerce': ['do\'kon', 'shop', 'sotish', 'commerce']
    };

    const recommendations: any[] = [];
    
    // For each interested service category, find matching actual services
    for (const interest of interestedServices) {
      const keywords = serviceMatching[interest] || [interest];
      
      // Find services that match the keywords
      const matchingServices = allServices.filter(service => {
        const searchText = (service.title + ' ' + service.description).toLowerCase();
        return keywords.some(keyword => searchText.includes(keyword.toLowerCase()));
      });
      
      // Add top matching services with scoring
      matchingServices.slice(0, 2).forEach(service => {
        if (!recommendations.find(r => r.serviceId === service.id)) {
          recommendations.push({
            serviceId: service.id,
            title: service.title,
            description: service.description,
            priceRange: service.priceRange,
            duration: service.duration,
            reason: `${service.title} sizning "${interest}" talabingizga juda mos keladi`,
            matchScore: 85 + Math.floor(Math.random() * 15) // 85-100
          });
        }
      });
    }

    return recommendations.slice(0, 3); // Return top 3 recommendations
  } catch (error) {
    console.error('Error fetching services for recommendations:', error);
    return getFallbackRecommendations(interestedServices);
  }
}

function getFallbackRecommendations(interestedServices: string[]): any[] {
  const serviceMap: Record<string, any> = {
    'website': {
      serviceId: 'web-development',
      title: 'Professional Veb-sayt',
      description: 'Zamonaviy va tez yuklanadigan veb-sayt',
      priceRange: '$500-2000',
      duration: '2-4 hafta',
      reason: 'Veb-sayt talabingizga mos',
      matchScore: 85
    },
    'telegram-bot': {
      serviceId: 'telegram-bot',
      title: 'Telegram Bot',
      description: 'Biznesingiz uchun avtomatik bot',
      priceRange: '$200-800', 
      duration: '1-2 hafta',
      reason: 'Telegram bot talabingizga mos',
      matchScore: 88
    },
    'ai-chatbot': {
      serviceId: 'ai-chatbot',
      title: 'AI Chatbot',
      description: 'Aqlli mijozlar bilan suhbat tizimi',
      priceRange: '$300-1000',
      duration: '1-3 hafta',
      reason: 'AI chatbot talabingizga mos',
      matchScore: 90
    }
  };

  return interestedServices.map(service => serviceMap[service]).filter(Boolean);
}

export async function generateServiceRecommendations(
  services: any[],
  requirements: string,
  budget?: string,
  timeline?: string
): Promise<any[]> {
  const prompt = `
Mijozning talablari asosida eng mos xizmatlarni tavsiya qil:

MIJOZ TALABLARI:
- Talab: ${requirements}
- Byudjet: ${budget || 'Ko\'rsatilmagan'}
- Muddat: ${timeline || 'Ko\'rsatilmagan'}

MAVJUD XIZMATLAR:
${services.map(s => `- ${s.title}: ${s.description} (${s.priceRange}, ${s.duration})`).join('\n')}

3 ta eng mos xizmatni tanlang va har birini qisqacha tavsiya sababini yozing.
JSON formatda javob bering:
{
  "recommendations": [
    {
      "serviceId": "id",
      "title": "Service name", 
      "reason": "Tavsiya sababi",
      "matchScore": 85
    }
  ]
}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
      },
      contents: prompt,
    });

    const rawJson = response.text;
    if (rawJson) {
      const result = JSON.parse(rawJson);
      return result.recommendations || [];
    }
  } catch (error) {
    console.error('Failed to generate service recommendations:', error);
  }

  // Fallback: simple keyword matching
  const keywords = requirements.toLowerCase();
  return services
    .filter(service => 
      service.title.toLowerCase().includes(keywords) ||
      service.description.toLowerCase().includes(keywords)
    )
    .slice(0, 3)
    .map(service => ({
      serviceId: service.id,
      title: service.title,
      reason: "Sizning talabingizga mos keladi",
      matchScore: 75
    }));
}
