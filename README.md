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

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
src/
├── app/                 # App Router (Next.js 13+)
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Home page
│   └── globals.css     # Global styles
├── components/         # Reusable components
├── lib/               # Utility functions
│   └── prisma.ts      # Prisma client singleton
└── types/             # TypeScript type definitions
prisma/
├── schema.prisma      # Database schema
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
```

### Environment Variables

**Server-side variables** (`.env`):
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"
NEXTAUTH_SECRET="[YOUR-NEXTAUTH-SECRET]"
```

**Client-side variables** (`.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
```

### Authentication

- Uses Supabase's built-in `auth.users` table
- No custom user models needed
- User metadata stored in `user_metadata.display_name`

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [Prisma Documentation](https://www.prisma.io/docs) - learn about Prisma ORM.
- [Supabase Documentation](https://supabase.com/docs) - learn about Supabase.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.
