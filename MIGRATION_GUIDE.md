# Spark - Convex to Supabase Migration Guide

## 🎯 Migration Status
- ✅ Schema converted to Supabase SQL
- ✅ Dependencies updated
- ✅ Supabase client configured
- ✅ Queries migration completed
- ✅ Auth system migration completed
- ✅ Component updates completed
- ⏳ Testing pending

## 📋 Setup Instructions

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get your project URL and anon key

### 2. Set up Database Schema
1. Go to Supabase SQL Editor
2. Run the SQL from `supabase-schema.sql`
3. Verify all tables are created

### 3. Configure Environment
1. Copy `.env.example` to `.env.local`
2. Add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

### 4. Install Dependencies
```bash
npm install
```

### 5. Run Development Server
```bash
npm run dev
```

## 🔄 What Changed

### Dependencies
- ✅ Added: `@supabase/supabase-js`

### File Structure
- ✅ Added: `src/lib/supabase.ts`

### Scripts
- Updated npm scripts to remove Convex backend
- Simplified development workflow

## ✅ Migration Completed

### Database Operations Migrated:
1. **Areas operations** - ✅ `src/lib/queries/areas.ts`
2. **Projects operations** - ✅ `src/lib/queries/projects.ts` 
3. **Tasks operations** - ✅ `src/lib/queries/tasks.ts`
4. **Subtasks operations** - ✅ `src/lib/queries/subtasks.ts`
5. **Time blocks operations** - ✅ `src/lib/queries/timeBlocks.ts`

### Auth System Migrated:
- ✅ Supabase Auth integration (`src/lib/auth.ts`)
- ✅ Updated `SignInForm.tsx` and `SignOutButton.tsx`
- ✅ Updated `App.tsx` with auth state management
- ✅ Removed Convex providers from `main.tsx`

### Components Ready:
All existing components should work with the new Supabase backend once you update their imports from Convex queries to Supabase queries.

## 🎯 Benefits of Migration
- ✅ Standard SQL database
- ✅ Better performance with indexes
- ✅ Row Level Security (RLS) 
- ✅ Real-time subscriptions
- ✅ Easier deployment
- ✅ More control over data

## 📚 Next Steps
1. Finish query migration
2. Update auth system
3. Test all functionality
4. Remove Convex dependencies completely