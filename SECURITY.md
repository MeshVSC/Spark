# 🔒 Security Guidelines

## Environment Variables

### ✅ Safe to Commit:
- `.env.example` - Template with placeholder values
- `VITE_SUPABASE_URL` - Public project URL (by design)
- `VITE_SUPABASE_ANON_KEY` - Public anon key (protected by RLS)

### ❌ NEVER Commit:
- `.env` or `.env.local` - Your actual credentials
- Service role keys or private keys
- Production database credentials

## Supabase Security Features

### Row Level Security (RLS)
All tables have RLS policies ensuring users can only access their own data:
```sql
-- Example policy
CREATE POLICY "Users can view their own tasks" 
ON tasks FOR SELECT USING (auth.uid() = user_id);
```

### Anon Key Protection
The `VITE_SUPABASE_ANON_KEY` is safe to expose because:
- It's designed to be public
- All data access is protected by RLS policies
- Users can only access their own authenticated data

## Git Security

### .gitignore Protection
The `.gitignore` file excludes:
- All `.env*` files
- Build artifacts
- Temporary files
- IDE configurations

### Before Committing:
```bash
# Check what will be committed
git status

# Ensure no .env files are staged
git ls-files --ignored --exclude-standard

# Safe commit
git add .
git commit -m "Your message"
```

## Deployment Security

### Environment Variables in Production:
- Use your hosting platform's environment variable system
- Never hardcode credentials in source code
- Use different Supabase projects for dev/staging/production

### Recommended Setup:
- **Development**: Local Supabase project
- **Staging**: Separate Supabase project  
- **Production**: Separate Supabase project with additional security

## Database Security

### RLS Policies Applied:
- ✅ `areas` - User isolation
- ✅ `projects` - User isolation  
- ✅ `tasks` - User isolation
- ✅ `subtasks` - User isolation
- ✅ `time_blocks` - User isolation
- ✅ `recurring_tasks` - User isolation

### Additional Security:
- Foreign key constraints prevent data orphaning
- Automatic user ID validation in all operations
- Soft deletes instead of hard deletes

## Best Practices

1. **Regular Security Audits**
   - Review RLS policies
   - Check for exposed credentials
   - Monitor unusual access patterns

2. **Principle of Least Privilege**
   - Use anon key for client access
   - Reserve service role for server operations only
   - Implement proper user authentication

3. **Secure Development**
   - Never log sensitive data
   - Validate all user inputs
   - Use HTTPS in production

## Emergency Response

If credentials are accidentally committed:
1. **Immediately** regenerate keys in Supabase dashboard
2. Update all environments with new keys
3. Review git history and consider rebasing if recent
4. Monitor for unauthorized access

## Questions?

Check [Supabase Security Documentation](https://supabase.com/docs/guides/auth/row-level-security) for more details.