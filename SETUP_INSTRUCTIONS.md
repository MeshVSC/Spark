# 🚀 Spark Setup Instructions

## Quick Start

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create an account
2. Click "New Project"
3. Choose your organization and enter project details
4. Wait for the project to be created

### 2. Set up Database
1. In your Supabase dashboard, go to "SQL Editor"
2. Copy the contents of `supabase-schema.sql` from this project
3. Paste it into the SQL Editor and run it
4. Verify all tables are created in the "Table Editor"

### 3. Configure Environment
1. In Supabase dashboard, go to "Settings" → "API"
2. Copy your Project URL and anon public key
3. Create `.env.local` in the project root:
   ```
   VITE_SUPABASE_URL=your-project-url-here
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 4. Install and Run
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### 5. Test the App
1. Visit `http://localhost:5173`
2. Create an account or sign in anonymously
3. Start creating tasks, projects, and areas!

## 📁 Project Structure

```
src/
├── lib/
│   ├── auth.ts           # Supabase auth functions
│   ├── supabase.ts       # Supabase client & types
│   └── queries/          # Database operations
│       ├── tasks.ts      # Task CRUD operations
│       ├── projects.ts   # Project CRUD operations
│       ├── areas.ts      # Area CRUD operations
│       ├── subtasks.ts   # Subtask CRUD operations
│       └── timeBlocks.ts # Time blocking operations
├── components/           # React components
├── App.tsx              # Main app with auth
├── SignInForm.tsx       # Authentication form
└── main.tsx             # App entry point
```

## 🔧 Database Features

- **Row Level Security (RLS)**: Users can only access their own data
- **Real-time subscriptions**: Live updates when data changes
- **Automatic timestamps**: `created_at` and `updated_at` fields
- **Soft deletes**: Tasks are marked as deleted, not permanently removed
- **Indexes**: Optimized for fast queries

## 🎯 Ready for Phase 2

With the migration complete, you're ready to implement:
- Gamification features
- Advanced analytics
- Habit tracking
- And more!

## 🆘 Troubleshooting

### Common Issues:

1. **Environment variables not working**
   - Make sure `.env.local` is in the project root
   - Restart the dev server after adding environment variables

2. **Database connection errors**
   - Check your Supabase URL and anon key are correct
   - Verify your Supabase project is active

3. **Auth not working**
   - Check Supabase Auth settings
   - Make sure RLS policies are enabled

4. **Real-time not working**
   - Verify Supabase Realtime is enabled in project settings

Need help? Check the Supabase documentation or create an issue!