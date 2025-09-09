const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || "";
const TELEGRAM_ADMIN_CHANNEL_ID = process.env.TELEGRAM_ADMIN_CHANNEL_ID || "";

export async function sendTelegramMessage(chatId: string, message: string): Promise<void> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error(`Telegram API error: ${response.statusText}`, data);
      throw new Error(`Telegram API error: ${response.statusText} - ${data.description || 'Unknown error'}`);
    }
    
    console.log(`Telegram message sent successfully to ${chatId}`);
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    throw error;
  }
}

export async function notifyNewOrder(order: {
  id: string;
  clientName: string;
  telegramUsername: string;
  serviceTitle: string;
  details: string;
}): Promise<void> {
  // Message to admin only (client will be contacted manually)
  const adminMessage = `
🔔 <b>Yangi buyurtma!</b>

👤 Mijoz: ${order.clientName}
📱 Telegram: @${order.telegramUsername}
🛍 Xizmat: ${order.serviceTitle}
📝 Tafsil: ${order.details}
📧 Buyurtma ID: <code>${order.id}</code>

<i>Mijoz bilan @${order.telegramUsername} orqali bog'laning</i>
  `;

  try {
    // Only send to admin channel
    await sendTelegramMessage(TELEGRAM_ADMIN_CHANNEL_ID, adminMessage);
    console.log(`Order notification sent to admin for order ${order.id}`);
  } catch (error) {
    console.error('Failed to send order notification to admin:', error);
    throw error;
  }
}

export async function postBlogToTelegram(post: {
  title: string;
  excerpt: string;
  slug: string;
  category: string;
}): Promise<void> {
  const message = `
📖 <b>${post.title}</b>

${post.excerpt}

<a href="https://evolvo.uz/blog/${post.slug}">To'liq o'qish →</a>

#${post.category.replace(/\s+/g, '')} #EvolvoBlog #AI #Technology
  `;

  try {
    await sendTelegramMessage(TELEGRAM_CHANNEL_ID, message);
  } catch (error) {
    console.error('Failed to post blog to Telegram:', error);
  }
}
