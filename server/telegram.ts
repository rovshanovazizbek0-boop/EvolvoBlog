const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || "";
const TELEGRAM_ADMIN_CHANNEL_ID = process.env.TELEGRAM_ADMIN_CHANNEL_ID || "";

export async function sendTelegramMessage(chatId: string, message: string): Promise<void> {
  try {
    console.log(`🤖 Sending Telegram message to: ${chatId}`);
    console.log(`📱 Bot Token available: ${TELEGRAM_BOT_TOKEN ? 'Yes' : 'No'}`);
    
    if (!TELEGRAM_BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN is not set');
    }
    
    if (!chatId) {
      throw new Error('Chat ID is empty');
    }
    
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const data = await response.json();
    
    console.log(`📡 Telegram API Response Status: ${response.status}`);
    console.log(`📡 Telegram API Response:`, data);
    
    if (!response.ok) {
      console.error(`❌ Telegram API error: ${response.statusText}`, data);
      throw new Error(`Telegram API error: ${response.statusText} - ${data.description || 'Unknown error'}`);
    }
    
    console.log(`✅ Telegram message sent successfully to ${chatId}`);
  } catch (error) {
    console.error('❌ Failed to send Telegram message:', error);
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
  imageUrl?: string;
}): Promise<void> {
  console.log(`📝 Preparing to post blog to Telegram: ${post.title}`);
  console.log(`📢 Channel ID: ${TELEGRAM_CHANNEL_ID}`);
  
  if (!TELEGRAM_CHANNEL_ID) {
    console.error('❌ TELEGRAM_CHANNEL_ID is not set');
    throw new Error('TELEGRAM_CHANNEL_ID is not configured');
  }
  
  // Limit excerpt to 150 characters to avoid Telegram caption length limit
  const shortExcerpt = post.excerpt.length > 150 
    ? post.excerpt.substring(0, 150) + "..." 
    : post.excerpt;
  
  // Create a nicely formatted caption like in the image
  let caption = `📖 <b>${post.title}</b>

${shortExcerpt}

<i>"Biznes dunyosidagi eng so'nggi tendensiyalar va texnologiyalar haqida bilib oling."</i>

🔗 <a href="https://evolvo.uz/blog/${post.slug}">To'liq o'qish</a>

#${post.category.replace(/\s+/g, '')} #EvolvoBlog`;

  // Ensure caption is under Telegram's 1024 character limit
  if (caption.length > 1000) {
    const veryShortExcerpt = post.excerpt.length > 100 
      ? post.excerpt.substring(0, 100) + "..." 
      : post.excerpt;
    
    caption = `📖 <b>${post.title}</b>

${veryShortExcerpt}

🔗 <a href="https://evolvo.uz/blog/${post.slug}">To'liq o'qish</a>

#${post.category.replace(/\s+/g, '')} #EvolvoBlog`;
  }

  try {
    console.log(`📤 Sending to Telegram: ${post.title}`);
    
    if (post.imageUrl) {
      console.log(`🖼️ Sending with photo: ${post.imageUrl}`);
      await sendTelegramPhoto(TELEGRAM_CHANNEL_ID, post.imageUrl, caption);
    } else {
      console.log(`📝 Sending text only`);
      await sendTelegramMessage(TELEGRAM_CHANNEL_ID, caption);
    }
    
    console.log(`✅ Successfully posted blog to Telegram: ${post.title}`);
  } catch (error) {
    console.error(`❌ Failed to post blog "${post.title}" to Telegram:`, error);
    throw error;
  }
}

async function sendTelegramPhoto(chatId: string, photoUrl: string, caption: string): Promise<void> {
  const telegramApiUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
  
  console.log(`🤖 Sending Telegram photo to: ${chatId}`);
  console.log(`📱 Bot Token available: ${TELEGRAM_BOT_TOKEN ? 'Yes' : 'No'}`);
  
  const payload = {
    chat_id: chatId,
    photo: photoUrl,
    caption: caption,
    parse_mode: 'HTML',
    disable_web_page_preview: true
  };

  const response = await fetch(telegramApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  console.log(`📡 Telegram API Response Status: ${response.status}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Telegram API Error (${response.status}): ${errorText}`);
    throw new Error(`Telegram API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log(`📡 Telegram API Response:`, data);

  if (!data.ok) {
    console.error(`❌ Telegram API returned error:`, data);
    throw new Error(`Telegram API error: ${data.description || 'Unknown error'}`);
  }

  console.log(`✅ Telegram photo sent successfully to ${chatId}`);
}
