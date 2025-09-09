# Evolvo.uz - AI Powered Business Solutions

🚀 Full-stack AI-powered platform providing web development, Telegram bot creation, chatbot development, and business automation services.

## 🛠️ Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Express.js + TypeScript + Drizzle ORM
- **Database**: PostgreSQL
- **AI Integration**: Google Gemini 2.5 Flash
- **Image Service**: Unsplash API
- **Communication**: Telegram Bot API
- **PDF Generation**: jsPDF + html2canvas

## ✨ Features

- 🤖 AI-powered service customization and chat
- 📝 Automated blog content generation with scheduling
- 📱 Telegram bot integration for notifications
- 🖼️ Automated image management with Unsplash
- 📄 PDF download functionality for blog posts
- 🔐 Admin panel with authentication
- 📊 CRM functionality for client management
- 🎨 Modern responsive UI with dark/light themes

## 🚀 Deploy to Render.com

### Prerequisites

1. **Render.com Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Push your code to GitHub
3. **API Keys**: Obtain the required API keys (see below)

### Required Environment Variables

Set these environment variables in your Render.com dashboard:

```env
# AI Service
GEMINI_API_KEY=your_google_gemini_api_key

# Image Service
UNSPLASH_ACCESS_KEY=your_unsplash_access_key

# Telegram Integration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHANNEL_ID=your_telegram_channel_id
TELEGRAM_ADMIN_CHANNEL_ID=your_admin_channel_id

# Database (automatically set by Render)
DATABASE_URL=postgresql://...

# Environment
NODE_ENV=production
```

### Deployment Steps

1. **Fork/Clone Repository**
   ```bash
   git clone https://github.com/yourusername/evolvo-uz.git
   cd evolvo-uz
   ```

2. **Connect to Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Select the repository containing your `render.yaml`

3. **Configure Environment Variables**
   - In Render dashboard, go to your service settings
   - Add all required environment variables listed above
   - The `DATABASE_URL` will be automatically set when PostgreSQL is created

4. **Deploy**
   - Render will automatically deploy based on your `render.yaml`
   - Wait for the build and deployment to complete
   - Your app will be available at `https://your-service-name.onrender.com`

### Manual Deployment (Alternative)

If you prefer manual setup instead of using `render.yaml`:

1. **Create PostgreSQL Database**
   - New → PostgreSQL
   - Name: `evolvo-postgres`
   - Plan: Starter (free)

2. **Create Full-Stack Web Service**
   - New → Web Service
   - Build Command: `npm ci && npm run build`
   - Start Command: `npm start`
   - Add environment variables
   - Set Health Check Path: `/api/health`

3. **Note**: With the updated configuration, frontend and backend are served from the same service, eliminating the need for separate frontend deployment.

## 🔑 Getting API Keys

### Google Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key to `GEMINI_API_KEY`

### Unsplash Access Key
1. Go to [Unsplash Developers](https://unsplash.com/developers)
2. Create a new application
3. Copy the Access Key to `UNSPLASH_ACCESS_KEY`

### Telegram Bot Setup
1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Use `/newbot` command to create a bot
3. Copy the bot token to `TELEGRAM_BOT_TOKEN`
4. Add bot to your channels and get channel IDs
5. Set `TELEGRAM_CHANNEL_ID` and `TELEGRAM_ADMIN_CHANNEL_ID`

## 🏗️ Local Development

### Prerequisites
- Node.js 20+ 
- PostgreSQL database
- All required API keys

### Setup
1. **Clone repository**
   ```bash
   git clone https://github.com/yourusername/evolvo-uz.git
   cd evolvo-uz
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your values
   DATABASE_URL=postgresql://username:password@localhost:5432/evolvo
   GEMINI_API_KEY=your_gemini_key
   # ... add other keys
   ```

4. **Set up database**
   ```bash
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open application**
   - Frontend: http://localhost:5000
   - API: http://localhost:5000/api

### Admin Access
- URL: `/admin/login`
- Email: `admin@evolvo.uz`
- Password: `admin123`

## 📁 Project Structure

```
├── client/                 # React frontend
│   ├── public/            # Static assets
│   │   ├── favicon.png    # Generated favicon
│   │   └── apple-touch-icon.png
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   │   ├── ui/        # shadcn/ui components
│   │   │   └── DownloadPDFButton.tsx
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilities
│   └── index.html
├── server/                # Express backend
│   ├── db.ts             # Database connection
│   ├── routes.ts         # API routes
│   ├── gemini.ts         # AI integration
│   ├── telegram.ts       # Telegram bot
│   ├── unsplash.ts       # Image service
│   └── scheduler.ts      # Blog automation
├── shared/               # Shared types/schemas
│   └── schema.ts
├── render.yaml          # Render deployment config
└── package.json
```

## 🔧 Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:push      # Apply database schema changes
npm run check        # Type check TypeScript
```

## 🚨 Important Notes

- **API Keys**: Never commit API keys to version control
- **Database**: Use Render PostgreSQL for production
- **Images**: Unsplash API has rate limits - monitor usage
- **Telegram**: Ensure bot has proper channel permissions
- **SSL**: Render provides automatic HTTPS
- **Scaling**: Consider upgrading from Starter plan for production load

## 🆘 Troubleshooting

### Common Deployment Issues

1. **Build Fails**
   - Check Node.js version (use 20+)
   - Verify all dependencies in package.json
   - Check for TypeScript errors

2. **Database Connection**
   - Verify `DATABASE_URL` is set correctly
   - Ensure database exists and is accessible
   - Check firewall settings

3. **API Keys Not Working**
   - Verify all environment variables are set
   - Check API key validity and permissions
   - Monitor API rate limits

4. **Frontend Not Loading**
   - Verify static site build settings
   - Check rewrite rules for SPA routing
   - Ensure build directory is correct

### Support
- 📧 Email: info@evolvo.uz
- 📱 Telegram: [@evolvobot](https://t.me/evolvobot)
- 🌐 Website: [https://evolvo.uz](https://evolvo.uz)

---

Made with ❤️ by the Evolvo.uz team