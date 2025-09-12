# 🗄️ Database Setup & Migrations

This document explains the database setup, schema management, and migration process for MangoOrg.

## 🏗️ Database Architecture

### Technology Stack
- **Database**: PostgreSQL hosted on Supabase
- **ORM**: Prisma for type-safe database access
- **Migrations**: Prisma Migrate for schema versioning

### Core Models

```mermaid
erDiagram
    Profile {
        string id PK
        string userId UK "Links to Supabase auth.users"
        UserRole role "USER|ADMIN"
        DateTime createdAt
        DateTime updatedAt
    }
    
    Disease {
        string id PK
        string name UK
        DiseaseType type "DISEASE|PEST"
        int severity "0-10 scale"
        int spreadability "0-10 scale"
        string shortDescription
        string longDescription
        string controlMethod
        string imageLink
    }
    
    Location {
        string id PK
        string locationName
        Hemisphere hemisphere "NORTH|SOUTH"
        int locationSusceptability "0-10 scale"
    }
    
    Variety {
        string id PK
        string varietyName
        int varietySusceptability "0-10 scale"
    }
    
    Orchard {
        string id PK
        string orchardName
        int noTreesRow
        int noTreesColumn
        float area
        string userId "Links to Supabase auth"
        string varietyId FK
        string locationId FK
    }
    
    Case {
        string id PK
        string diseaseId FK
        string orchardId FK
        CaseStatus status "ACTIVE|RESOLVED"
        PlantPart partOfPlant "LEAF|STEM|FRUIT"
        DateTime createdAt
        DateTime updatedAt
    }
    
    Record {
        string id PK
        string caseId FK
        string orchardId FK
        DateTime recordedAt
        int numberOfTreesChecked
        int numberOfTreesInfected
    }
    
    Disease ||--o{ Case : "affects"
    Orchard ||--o{ Case : "has"
    Case ||--o{ Record : "contains"
    Orchard ||--o{ Record : "inspected_at"
    Location ||--o{ Orchard : "located_in"
    Variety ||--o{ Orchard : "grown_at"
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account and project
- Git

### 1. Environment Setup

Create your environment files:

```bash
# Copy the example files
cp .env.example .env.local
cp .env.example .env
```

Add your Supabase credentials:

```env
# .env.local (for Next.js frontend)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# .env (for server-side operations)
DATABASE_URL="postgresql://username:password@host:port/database?pgbouncer=true&connection_limit=1"
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Database Migration

Run migrations to create the database schema:

```bash
# Generate Prisma client
npx prisma generate

# Apply migrations to database
npm run db:migrate

# Alternative: Use Prisma CLI directly
npx prisma migrate dev --name init
```

### 3. Seed Database

Populate the database with initial data:

```bash
# Run the seed script
npm run db:seed
```

The seed script will:
- ✅ Create admin user (`admin@mangoorg.com` / `admin123456`)
- 🌍 Add sample locations (North Queensland, Central California, etc.)
- 🥭 Add mango varieties (Kensington Pride, Tommy Atkins, etc.)
- 🦠 Add common diseases and pests with control methods
- 📸 Upload seed images to Supabase Storage (if configured)

## 🔧 Migration Commands

### Creating New Migrations

When you modify `schema.prisma`:

```bash
# Create a migration with descriptive name
npx prisma migrate dev --name add_new_feature

# Create migration without applying (for production)
npx prisma migrate dev --create-only --name add_new_feature
```

### Managing Migrations

```bash
# Reset database (DESTROYS ALL DATA)
npx prisma migrate reset

# Apply pending migrations
npx prisma migrate deploy

# View migration status
npx prisma migrate status

# Generate Prisma client after schema changes
npx prisma generate
```

### Database Studio

Explore and edit data with Prisma Studio:

```bash
# Open Prisma Studio
npm run db:studio
# or
npx prisma studio
```

## 🏪 Supabase Storage Setup

For image uploads to work, configure the storage bucket:

### 1. Create Bucket
- Go to Supabase Dashboard → Storage
- Create bucket: `disease-images`
- Set bucket to **public** for read access

### 2. Storage Policies

Add these RLS policies in Supabase Dashboard:

```sql
-- Allow public read access
CREATE POLICY "Allow public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'disease-images');

-- Allow authenticated uploads
CREATE POLICY "Allow authenticated uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'disease-images' AND auth.role() = 'authenticated');

-- Allow authenticated updates
CREATE POLICY "Allow authenticated updates" ON storage.objects
  FOR UPDATE USING (bucket_id = 'disease-images' AND auth.role() = 'authenticated');

-- Allow authenticated deletes
CREATE POLICY "Allow authenticated deletes" ON storage.objects
  FOR DELETE USING (bucket_id = 'disease-images' AND auth.role() = 'authenticated');
```

### 3. Image Directory Structure

Place seed images in `prisma/seed-images/`:
```
prisma/
├── seed-images/
│   ├── anthracnose.jpg
│   ├── mango-fruit-fly.jpg
│   └── powdery-mildew.webp
├── schema.prisma
└── seed.ts
```

## 🔒 Authentication Integration

The database integrates with Supabase Auth:

- **Profile Model**: Links to `auth.users` via `userId` field
- **Role-Based Access**: `USER` and `ADMIN` roles in Profile
- **Row-Level Security**: Use Supabase RLS for additional security

### User Creation Flow
1. User signs up via Supabase Auth
2. Trigger creates Profile record with `USER` role
3. Admin can upgrade users to `ADMIN` role via database

## 🐛 Troubleshooting

### Common Issues

**Migration fails with connection error:**
```bash
# Check your DATABASE_URL format
# Ensure Supabase project is active
# Verify connection limit settings
```

**Seed script fails:**
```bash
# Ensure environment variables are set
# Check Supabase service role key permissions
# Verify storage bucket exists and is public
```

**Prisma Client not found:**
```bash
# Regenerate the client
npx prisma generate
```

**Permission denied on storage:**
```bash
# Check storage policies in Supabase Dashboard
# Ensure bucket is public for read access
# Verify service role key has storage permissions
```

### Development Tips

- Use `npx prisma studio` to inspect data during development
- Always backup production data before running migrations
- Test migrations on staging environment first
- Use descriptive names for migration files
- Keep seed data updated as schema evolves

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Database Guide](https://supabase.com/docs/guides/database)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)