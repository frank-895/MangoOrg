# MangoOrg - Next.js Project

A comprehensive disease management system for mango tree diseases and pests.

## Features

- **Disease Management**: Create, read, update, and delete disease/pest information
- **Image Management**: Upload and manage disease images with Supabase storage
- **Role-Based Access**: Admin users can manage content, all users can view
- **Responsive Design**: Modern UI with Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Supabase Auth with role management

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd MangoOrg
   npm install
   ```

2. **Set up Supabase**
   - Create a project at [supabase.com](https://supabase.com)
   - Get your project URL and API keys

3. **Configure environment variables**
   ```bash
   # Copy .env.example to .env.local
   cp .env.example .env.local
   
   # Add your Supabase credentials to .env.local
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   
   # Add to .env (not .env.local)
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   DATABASE_URL=your_database_url
   ```

4. **Set up storage first**
   ```bash
   # Create the bucket in Supabase Dashboard:
   # 1. Go to Storage section
   # 2. Create bucket: "disease-images"
   # 3. Set to public (for read access)
   
   # Then run the setup script to get policy instructions
   npm run setup:storage
   
   # Finally, apply the policies in Supabase SQL Editor:
   # 1. Go to Supabase Dashboard → SQL Editor
   # 2. Copy the SQL from scripts/storage-policies.sql
   # 3. Paste and run the SQL
   # 4. Verify policies are created in Storage → Policies
   ```

5. **Set up database**
   ```bash
   # Run migrations
   npm run db:migrate
   
   # Seed database with sample data, admin user, and actual images
   npm run db:seed
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

7. **Visit the application**
   - Open [http://localhost:3000](http://localhost:3000)
   - Login with admin credentials (see below)

## Database Schema

### Core Models

- **Disease**: Stores disease/pest information with optional fields
- **Profile**: User roles linked to Supabase auth.users

### Disease Fields
- `name` (required): Disease/pest name
- `type`: DISEASE or PEST
- `severity`: 0-10 scale (optional)
- `spreadability`: 0-10 scale (optional)
- `shortDescription`: Brief description (optional)
- `longDescription`: Detailed description (optional)
- `controlMethod`: Treatment methods (optional)
- `imageLink`: Supabase storage URL (optional)

## API Endpoints

### Diseases
- `GET /api/diseases` - List all diseases
- `POST /api/diseases` - Create new disease (admin only)
- `GET /api/diseases/[id]` - Get specific disease
- `PUT /api/diseases/[id]` - Update disease (admin only)
- `DELETE /api/diseases/[id]` - Delete disease (admin only)

### Authentication
- `GET /api/auth/admin` - Check admin status

### File Upload
- `POST /api/upload` - Upload image (admin only)

## Pages

- `/` - Home page
- `/diseases` - Disease listing with filtering
- `/diseases/[id]` - Disease detail page
- `/diseases/create` - Create new disease (admin only)
- `/diseases/[id]/edit` - Edit disease (admin only)
- `/login` - Login page
- `/signup` - Signup page
- `/dashboard` - User dashboard

## Storage Setup

### Manual Bucket Creation
1. Go to Supabase Dashboard → Storage
2. Create bucket: `disease-images`
3. Set to public (for read access)
4. Run `npm run setup:storage` to get policy instructions
5. Apply policies in SQL Editor using `scripts/storage-policies.sql`

### Storage Policies
- **Public read access**: Anyone can view images
- **Admin-only write/delete**: Only authenticated admins can upload/delete

### Seed Images
The seed script will automatically upload images from `prisma/seed-images/` to the bucket:
- `anthracnose.jpg` - Anthracnose disease
- `mango-fruit-fly.jpg` - Mango fruit fly pest
- `powdery-mildew.webp` - Powdery mildew disease

## Default Admin User

After running `npm run db:seed`, you can login with:
- **Email**: `admin@mangoorg.com`
- **Password**: `admin123456`

⚠️ **Important**: Change the admin password after first login!

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio
- `npm run setup:storage` - Get storage policy instructions

### Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Required in `.env`:
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`

## License

MIT License - see LICENSE file for details.


