# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MangoOrg is a Next.js disease management system for mango tree diseases and pests, built with:
- **Frontend**: Next.js 14 with App Router, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes with Prisma ORM
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth with role-based access control
- **Storage**: Supabase Storage for disease images

## Development Commands

```bash
# Development
npm run dev              # Start development server on http://localhost:3000
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npm run db:migrate       # Run Prisma migrations
npm run db:seed          # Seed database with sample data and admin user
npm run db:studio        # Open Prisma Studio

# Storage Setup
npm run setup:storage    # Get storage policy instructions for Supabase
```

## Architecture

### Directory Structure
- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - Reusable React components
- `src/contexts/` - React contexts (AuthContext)
- `src/lib/` - Utility libraries and configurations
- `src/types/` - TypeScript type definitions
- `prisma/` - Database schema and migrations

### Key Files
- `src/lib/supabase.ts` - Supabase client configuration
- `src/lib/prisma.ts` - Prisma client singleton
- `src/lib/auth.ts` - Authentication utilities
- `src/lib/images.ts` and `src/lib/images-server.ts` - Image upload/management
- `src/contexts/AuthContext.tsx` - Global authentication state

### API Routes
- `GET|POST /api/diseases` - Disease CRUD operations
- `GET|PUT|DELETE /api/diseases/[id]` - Individual disease operations
- `GET /api/auth/admin` - Admin role verification
- `POST /api/upload` - Image upload to Supabase Storage
- `DELETE /api/upload/delete` - Image deletion from storage

## Database Schema

### Models
- **Disease**: Core disease/pest information with optional fields
- **Profile**: User roles linked to Supabase auth.users

### Key Fields
- Disease: `name` (required), `type` (DISEASE|PEST), optional severity/spreadability scales (0-10), descriptions, control methods, image links
- Profile: `userId` (links to Supabase auth), `role` (USER|ADMIN)

## Authentication & Authorization

- Uses Supabase Auth for user management
- Role-based access via Profile model
- Admin users can create/edit/delete diseases and upload images
- All users can view diseases
- Default admin: `admin@mangoorg.com` / `admin123456` (created by seed script)

## Image Management

- Images stored in Supabase Storage bucket: `disease-images`
- Upload restricted to admin users
- Public read access for all users
- Storage policies must be manually configured in Supabase Dashboard

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Required in `.env`:
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`

## Development Notes

- Use existing components and patterns when adding new features
- Follow TypeScript strict mode - all components are typed
- Tailwind CSS for styling - check existing classes before adding custom CSS
- Image uploads require admin authentication
- Database operations use Prisma Client
- All forms use React controlled components pattern
- Error handling includes user-friendly messages