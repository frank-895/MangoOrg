# 🥭 MangoOrg - Smart Mango Disease Management

An AI-powered disease management system for mango orchards, built as part of a research project for Charles Darwin University.

## ✨ Key Features

- 🌳 **Orchard Management** - Track multiple mango orchards with variety and location data
- 🦠 **Disease & Pest Tracking** - Comprehensive database of mango diseases and pests
- 📱 **Case Management** - Create and track disease cases with inspection records
- 🤖 **AI-Powered Scheduling** - Smart inspection recommendations based on risk analysis
- 👥 **Role-Based Access** - Admin and user roles with appropriate permissions
- 📊 **Dashboard Analytics** - Real-time overview of upcoming inspections and case status

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Git

### Installation

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd MangoOrg
   npm install
   ```

2. **Environment setup**
   ```bash
   cp .env.example .env.local
   # Add your Supabase credentials to .env.local and .env
   ```

3. **Database setup**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **Start development**
   ```bash
   npm run dev
   ```

5. **Login**
   - Visit [http://localhost:3000](http://localhost:3000)
   - Use admin@mangoorg.com / admin123456

## 📖 Documentation

- **[Database Setup](./prisma/README.md)** - Database configuration and migrations
- **[Inspection Algorithm](./docs/INSPECTION_ALGORITHM.md)** - How the AI scheduling works

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Prisma ORM
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed with sample data
- `npm run db:studio` - Open Prisma Studio
- `npm run lint` - Run ESLint

## 🏛️ Research Project

This application was developed as part of a research project at **Charles Darwin University**, focusing on pedagogical integration of AI-driven development. 

## 📄 License

[MIT License](./LICENSE) - Open source and free to use.