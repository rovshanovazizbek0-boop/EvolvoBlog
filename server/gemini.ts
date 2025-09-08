import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return response.text || "Kechirasiz, hozir javob bera olmayapman. Iltimos, keyinroq urinib ko'ring.";
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

  throw new Error("Failed to generate blog post");
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
