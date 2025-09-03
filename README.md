# MangoOrg - Next.js Project

This is a Next.js project with TypeScript, Tailwind CSS, and Prisma + Supabase for database management.

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

### Database Setup

1. **Set up Supabase**: Create a project at [supabase.com](https://supabase.com)
2. **Configure environment**: Copy `env.example` to `.env` and add your Supabase credentials
3. **Run migrations**: `npm run db:migrate` (when ready to create models)
4. **Seed database**: `npm run db:seed` (creates sample diseases and admin user)

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Disease Management System

### Features
- **Public Access**: View all diseases and pests (including anonymous users)
- **Admin Access**: Create, edit, delete diseases (admin users only)
- **Image Upload**: Upload disease images to Supabase storage
- **Role-based Access**: Profile-based user roles (USER/ADMIN)

### Default Admin User
After running `npm run db:seed`, you can login with:
- **Email**: `admin@mangoorg.com`
- **Password**: `admin123456`

⚠️ **Important**: Change the admin password after first login!

### API Endpoints

**Public**:
- `GET /api/diseases` - Fetch all diseases
- `GET /api/diseases/[id]` - Fetch specific disease

**Admin Only**:
- `POST /api/diseases` - Create disease
- `PUT /api/diseases/[id]` - Update disease
- `DELETE /api/diseases/[id]` - Delete disease
- `POST /api/upload` - Upload image

### Pages
- `/diseases` - Main diseases listing
- `/diseases/[id]` - Disease details
- `/diseases/create` - Create disease (admin)
- `/diseases/[id]/edit` - Edit disease (admin)

## Project Structure

```
src/
├── app/                 # App Router (Next.js 13+)
│   ├── api/            # API routes
│   │   ├── diseases/   # Disease CRUD endpoints
│   │   └── upload/     # Image upload endpoint
│   ├── diseases/       # Disease pages
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Home page
│   └── globals.css     # Global styles
├── components/         # Reusable components
│   └── DiseaseForm.tsx # Disease creation/edit form
├── contexts/          # React contexts
│   └── AuthContext.tsx # Authentication context
├── lib/               # Utility functions
│   ├── auth.ts        # Auth utilities
│   ├── prisma.ts      # Prisma client singleton
│   └── supabase.ts    # Supabase client
└── types/             # TypeScript type definitions
    └── disease.ts     # Disease type definitions
prisma/
├── schema.prisma      # Database schema
├── seed.ts           # Database seed script
└── migrations/        # Database migrations
```

## Database Management

### Prisma Commands

```bash
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema changes
npm run db:migrate     # Create and apply migrations
npm run db:studio      # Open database GUI
npm run db:reset       # Reset database (dev only)
npm run db:seed        # Seed database with sample data
```

### Environment Variables

**Server-side variables** (`.env`):
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"
```

**Client-side variables** (`.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
```

### Supabase Setup

1. **Storage Bucket**: Create `disease-images` bucket with public access
2. **Row Level Security**: Configure RLS policies as needed
3. **Service Role Key**: Required for admin operations

### Authentication

- Uses Supabase's built-in `auth.users` table
- Automatic Profile creation on signup/signin
- Role-based access control via Profile table
- JWT token validation for admin operations

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [Prisma Documentation](https://www.prisma.io/docs) - learn about Prisma ORM.
- [Supabase Documentation](https://supabase.com/docs) - learn about Supabase.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.
