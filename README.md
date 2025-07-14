# Spark Task Management App

A modern task management application built with React, TypeScript, and Supabase.

## Deployment

### Current Status
- **GitHub Pages**: Active deployment for testing login issues
- **Vercel**: Temporarily disabled (workflow renamed to `deploy.yml.disabled`)

### GitHub Pages Deployment
The app is currently deployed via GitHub Pages to isolate and test login functionality issues that were occurring with Vercel deployment.

**Live URL**: https://meshvsc.github.io/Spark

### Vercel Deployment (Disabled)
The Vercel deployment workflow has been temporarily disabled to prevent conflicts while testing GitHub Pages deployment. To re-enable Vercel deployment:

1. Rename `.github/workflows/deploy.yml.disabled` back to `.github/workflows/deploy.yml`
2. Disable or remove the GitHub Pages workflow
3. Ensure Vercel environment variables are properly configured

## Environment Variables

Required environment variables:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key

These are configured in:
- **Local development**: `.env.local` file
- **GitHub Pages**: GitHub repository secrets
- **Vercel**: Vercel project environment variables

