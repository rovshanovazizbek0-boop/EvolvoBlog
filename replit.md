# Overview

Evolvo.uz is a full-service AI-powered business platform that provides web development, Telegram bot creation, chatbot development, and business automation services. The platform features a modern React frontend with an Express.js backend, PostgreSQL database, and extensive AI integration using Google Gemini for content generation and service customization. The system includes a public-facing website, an admin panel for order management, automated blog content generation, and Telegram integration for notifications and customer engagement.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React + Vite**: Modern single-page application with TypeScript support
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state and API caching
- **Form Handling**: React Hook Form with Zod validation
- **Authentication**: Session-based authentication for admin access

## Backend Architecture
- **Express.js**: RESTful API server with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Session Management**: Express sessions with secure cookie configuration
- **Authentication**: bcrypt for password hashing, custom middleware for route protection
- **API Design**: RESTful endpoints with consistent error handling and logging middleware

## Database Design
- **PostgreSQL**: Primary database with connection pooling via Neon serverless
- **Schema Management**: Drizzle migrations with schema definitions in shared directory
- **Core Tables**: 
  - Users (admin authentication)
  - Services (business offerings with AI prompt templates)
  - Orders (customer requests with status tracking)
  - Blog posts (AI-generated content with SEO metadata)
  - Clients (CRM functionality)
  - Image usage (90-day uniqueness tracking)

## AI Integration Strategy
- **Google Gemini 2.5 Flash**: Primary AI service for content generation
- **Service Customization**: Dynamic AI assistants using stored prompt templates
- **Content Generation**: Automated blog post creation with structured output
- **Language Processing**: Uzbek language content generation and customer interaction

## Content Management
- **Automated Scheduling**: Daily blog post generation at 23:00 Tashkent time
- **SEO Optimization**: Meta tags, Open Graph tags, and structured content
- **Image Management**: Unsplash API integration with 90-day uniqueness enforcement
- **Multi-language Support**: Uzbek language focus with proper SEO implementation

## Security Architecture
- **Admin Panel Protection**: Hidden routes accessible only via authentication
- **Session Security**: HTTP-only cookies with environment-based security settings
- **Input Validation**: Zod schemas for type-safe API validation
- **CORS Configuration**: Configured for production deployment requirements

# External Dependencies

## AI Services
- **Google Gemini API**: Content generation and service explanations
- **Gemini 2.5 Flash Model**: High-performance AI for blog content and customer interaction

## Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL with connection pooling
- **WebSocket Support**: For database connections in serverless environment

## Image Services
- **Unsplash API**: High-quality images for blog posts and services
- **Image Tracking**: Automated uniqueness validation and metadata storage

## Communication Services
- **Telegram Bot API**: Customer notifications and admin alerts
- **Telegram Channels**: Automated blog post publishing and customer engagement

## Development & Deployment
- **Replit Integration**: Development environment with cartographer plugin
- **Vite Plugins**: Runtime error overlay and development tooling
- **Build Tools**: esbuild for server bundling, Vite for client build

## Authentication & Sessions
- **Connect PG Simple**: PostgreSQL session store for persistent sessions
- **bcrypt**: Password hashing and verification for admin users

## UI & Styling
- **Radix UI**: Accessible component primitives for form controls and interactions
- **Tailwind CSS**: Utility-first styling with custom design system
- **Lucide Icons**: Consistent iconography throughout the application
- **Font Awesome**: Additional icons for social media and branding

## Monitoring & Development
- **TypeScript**: Full type safety across frontend and backend
- **ESLint/Prettier**: Code quality and formatting standards
- **Drizzle Kit**: Database migration and schema management tools