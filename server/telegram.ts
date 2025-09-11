const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || "";
const TELEGRAM_ADMIN_CHANNEL_ID = process.env.TELEGRAM_ADMIN_CHANNEL_ID || "";

// Validation function to check if bot can access a chat
export async function validateTelegramChat(chatId: string, chatType: 'channel' | 'admin'): Promise<{ valid: boolean; error?: string; chatInfo?: any }> {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      return { valid: false, error: 'TELEGRAM_BOT_TOKEN environment variable is not set' };
    }
    
    if (!chatId) {
      return { valid: false, error: `TELEGRAM_${chatType.toUpperCase()}_CHANNEL_ID environment variable is not set` };
    }
    
    console.log(`🔍 Validating Telegram ${chatType} chat access: ${chatId}`);
    
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
      }),
    });

    const data = await response.json();
    
    if (!response.ok || !data.ok) {
      const errorMsg = data.description || 'Unknown error';
      return { 
        valid: false, 
        error: `Bot cannot access ${chatType} chat (${chatId}): ${errorMsg}` 
      };
    }
    
    console.log(`✅ Successfully validated ${chatType} chat: ${data.result.title || chatId}`);
    return { 
      valid: true, 
      chatInfo: data.result 
    };
  } catch (error) {
    return { 
      valid: false, 
      error: `Network error validating ${chatType} chat: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

// Validate all configured Telegram channels
export async function validateTelegramConfiguration(): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  console.log('🔧 Validating Telegram bot configuration...');
  
  // Check bot token
  if (!TELEGRAM_BOT_TOKEN) {
    errors.push('TELEGRAM_BOT_TOKEN environment variable is required');
  }
  
  // Check channel configurations
  if (!TELEGRAM_CHANNEL_ID && !TELEGRAM_ADMIN_CHANNEL_ID) {
    warnings.push('No Telegram channels configured. Blog posts will not be automatically posted to Telegram.');
  }
  
  // If we have a bot token, test channel access
  if (TELEGRAM_BOT_TOKEN) {
    if (TELEGRAM_CHANNEL_ID) {
      const channelValidation = await validateTelegramChat(TELEGRAM_CHANNEL_ID, 'channel');
      if (!channelValidation.valid) {
        errors.push(`Blog channel validation failed: ${channelValidation.error}`);
      }
    }
    
    if (TELEGRAM_ADMIN_CHANNEL_ID) {
      const adminValidation = await validateTelegramChat(TELEGRAM_ADMIN_CHANNEL_ID, 'admin');
      if (!adminValidation.valid) {
        errors.push(`Admin channel validation failed: ${adminValidation.error}`);
      }
    }
  }
  
  const valid = errors.length === 0;
  
  if (valid) {
    console.log('✅ Telegram configuration is valid');
  } else {
    console.log('❌ Telegram configuration has errors:');
    errors.forEach(error => console.log(`   - ${error}`));
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  Telegram configuration warnings:');
    warnings.forEach(warning => console.log(`   - ${warning}`));
  }
  
  return { valid, errors, warnings };
}

// Get setup instructions for Telegram bot
export function getTelegramSetupInstructions(): string[] {
  return [
    '📋 Telegram Bot Setup Instructions:',
    '',
    '1. Create a Telegram Bot:',
    '   - Message @BotFather on Telegram',
    '   - Send /newbot and follow instructions',
    '   - Copy the bot token and set TELEGRAM_BOT_TOKEN environment variable',
    '',
    '2. Set up Blog Channel (optional):',
    '   - Create a Telegram channel for blog posts',
    '   - Add your bot as an admin to the channel',
    '   - Get the channel ID (starts with -100) and set TELEGRAM_CHANNEL_ID',
    '',
    '3. Set up Admin Channel (optional):',
    '   - Create a Telegram channel/group for order notifications',
    '   - Add your bot as an admin',
    '   - Get the channel ID and set TELEGRAM_ADMIN_CHANNEL_ID',
    '',
    '4. How to get Channel ID:',
    '   - Forward a message from the channel to @userinfobot',
    '   - Or use @RawDataBot to get chat information',
    '   - Channel IDs typically start with -100',
    '',
    '5. Environment Variables to set:',
    '   TELEGRAM_BOT_TOKEN=your_bot_token_here',
    '   TELEGRAM_CHANNEL_ID=your_channel_id_here',
    '   TELEGRAM_ADMIN_CHANNEL_ID=your_admin_channel_id_here',
    '',
    '📌 Current Configuration:',
    `   Bot Token: ${TELEGRAM_BOT_TOKEN ? '✅ Set' : '❌ Missing'}`,
    `   Blog Channel: ${TELEGRAM_CHANNEL_ID ? '✅ Set (' + TELEGRAM_CHANNEL_ID + ')' : '❌ Missing'}`,
    `   Admin Channel: ${TELEGRAM_ADMIN_CHANNEL_ID ? '✅ Set (' + TELEGRAM_ADMIN_CHANNEL_ID + ')' : '❌ Missing'}`
  ];
}

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
