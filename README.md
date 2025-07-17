# Spark Task Management App

A modern, intuitive task management application built with React, TypeScript, and Supabase. Spark brings elegant design and powerful features to help you organize your life and get things done.

## ✨ Features

### 🎯 Core Task Management
- **Smart Lists**: Inbox, Today, Upcoming, Completed, and Someday views
- **Hierarchical Organization**: Areas → Projects → Tasks → Subtasks
- **Progress Tracking**: Visual progress circles showing completion status
- **Natural Language Dates**: Smart date parsing for scheduling
- **Quick Entry**: Fast task creation with keyboard shortcuts

### 🗂️ Organization
- **Areas & Projects**: Organize tasks into meaningful categories
- **Subtasks**: Break down complex tasks with expandable subtask lists  
- **Tags & Notes**: Rich metadata and documentation for tasks
- **Smart Views**: Filter and organize tasks by priority, dates, and more

### 🎨 User Experience
- **Clean Interface**: Inspired by Things 3's elegant design philosophy
- **Progress Visualization**: Blue progress circles with completion tracking
- **Responsive Design**: Works seamlessly across desktop and mobile
- **Keyboard Shortcuts**: Efficient navigation and task management
- **Dark/Light Theme**: Comfortable viewing in any environment

### 🔧 Advanced Features
- **Real-time Sync**: Instant updates across all devices via Supabase
- **Calendar Integration**: View tasks alongside your schedule
- **Task Filtering**: Advanced search and filtering capabilities
- **Drag & Drop**: Intuitive task and project organization
- **Settings & Customization**: Personalize your workflow

### 🚀 Recent Updates
- **Enhanced Progress Circles**: Blue circular progress indicators with outer rings
- **Improved Subtask Display**: Counters positioned after task names (e.g., "0 of 2")
- **Better Visual Hierarchy**: Progress tracking for projects and areas
- **Refined UI Elements**: Lighter task counts and improved spacing
- **Keyboard Navigation**: Comprehensive keyboard shortcuts for power users

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

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Supabase (PostgreSQL, Real-time subscriptions)
- **Styling**: Tailwind CSS, Custom CSS Variables
- **Icons**: Custom SVG icons, Heroicons
- **Deployment**: GitHub Pages, Vercel
- **Development**: ESLint, TypeScript strict mode

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation
```bash
# Clone the repository
git clone https://github.com/meshvsc/Spark.git
cd Spark

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
```

### Environment Variables

Required environment variables:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `SUPABASE_URL`: Used by `add-mockup-data.js` (usually same as `VITE_SUPABASE_URL`)
- `SUPABASE_ANON_KEY`: Used by `add-mockup-data.js` (usually same as `VITE_SUPABASE_ANON_KEY`)

These are configured in:
- **Local development**: `.env.local` file
- **GitHub Pages**: GitHub repository secrets
- **Vercel**: Vercel project environment variables

## 📦 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

## 🎮 Usage

### Quick Start
1. **Create an Area**: Start by creating life areas (Work, Personal, etc.)
2. **Add Projects**: Group related tasks under projects within areas
3. **Create Tasks**: Add individual tasks with due dates, notes, and tags
4. **Track Progress**: Watch progress circles fill as you complete tasks
5. **Stay Organized**: Use Today view for daily planning, Inbox for new items

### Keyboard Shortcuts
- `Ctrl/Cmd + N`: New task
- `Ctrl/Cmd + Shift + N`: Quick entry
- `Ctrl/Cmd + K`: Search
- `Ctrl/Cmd + R`: New recurring task
- `Escape`: Close modals

### Tips & Tricks
- Use natural language for dates: "tomorrow", "next week", "friday"
- Subtasks automatically show completion counts (e.g., "2 of 5")
- Progress circles show real-time completion status
- Drag and drop to reorganize tasks and projects
- Use tags to create cross-cutting views of your tasks

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**: Follow our coding standards
4. **Test thoroughly**: Ensure all features work as expected
5. **Commit changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript strict mode
- Use meaningful commit messages
- Test UI changes across different screen sizes
- Ensure accessibility standards are met
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Things 3**: Design inspiration for elegant task management
- **Supabase**: Powerful backend-as-a-service platform
- **React Team**: Amazing framework for building user interfaces
- **Tailwind CSS**: Utility-first CSS framework
- **Open Source Community**: For tools and inspiration

## 📞 Support

- **Live Demo**: [https://meshvsc.github.io/Spark](https://meshvsc.github.io/Spark)
- **Issues**: [GitHub Issues](https://github.com/meshvsc/Spark/issues)
- **Discussions**: [GitHub Discussions](https://github.com/meshvsc/Spark/discussions)

---

**Made with ❤️ by the Spark team**

