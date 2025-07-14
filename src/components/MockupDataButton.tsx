import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { getCurrentUser } from '../lib/auth'

const mockAreas = [
  { name: 'Work', description: 'Professional projects and tasks', color: '#4F46E5' },
  { name: 'Personal', description: 'Personal life and hobbies', color: '#059669' },
  { name: 'Health & Fitness', description: 'Exercise and wellness goals', color: '#DC2626' },
  { name: 'Learning', description: 'Educational and skill development', color: '#7C3AED' },
  { name: 'Finance', description: 'Budget and financial planning', color: '#EA580C' }
]

const mockProjects = [
  // Work projects
  { name: 'Q1 Marketing Campaign', description: 'Launch new product marketing initiative', area: 'Work', color: '#3B82F6', priority: 'high' },
  { name: 'Website Redesign', description: 'Update company website with modern design', area: 'Work', color: '#10B981', priority: 'medium' },
  { name: 'Team Onboarding', description: 'Improve new hire experience', area: 'Work', color: '#8B5CF6', priority: 'low' },
  
  // Personal projects
  { name: 'Home Renovation', description: 'Kitchen and living room updates', area: 'Personal', color: '#F59E0B', priority: 'medium' },
  { name: 'Photography Portfolio', description: 'Create online portfolio website', area: 'Personal', color: '#EF4444', priority: 'low' },
  { name: 'Garden Project', description: 'Plant vegetable garden this spring', area: 'Personal', color: '#84CC16', priority: 'medium' },
  
  // Health projects
  { name: 'Marathon Training', description: 'Prepare for NYC Marathon', area: 'Health & Fitness', color: '#06B6D4', priority: 'high' },
  { name: 'Meal Prep System', description: 'Establish weekly meal planning routine', area: 'Health & Fitness', color: '#F97316', priority: 'medium' },
  
  // Learning projects
  { name: 'Spanish Language', description: 'Achieve conversational fluency', area: 'Learning', color: '#EC4899', priority: 'medium' },
  { name: 'Data Science Course', description: 'Complete online certification', area: 'Learning', color: '#6366F1', priority: 'low' },
  
  // Finance projects
  { name: 'Investment Portfolio', description: 'Diversify and rebalance investments', area: 'Finance', color: '#14B8A6', priority: 'high' },
  { name: 'Emergency Fund', description: 'Build 6-month expense reserve', area: 'Finance', color: '#F59E0B', priority: 'medium' }
]

const mockTasks = [
  // Q1 Marketing Campaign tasks
  { title: 'Define target audience personas', project: 'Q1 Marketing Campaign', priority: 'high', completed: true },
  { title: 'Create campaign messaging framework', project: 'Q1 Marketing Campaign', priority: 'high', completed: false },
  { title: 'Design social media assets', project: 'Q1 Marketing Campaign', priority: 'medium', completed: false },
  { title: 'Schedule influencer outreach calls', project: 'Q1 Marketing Campaign', priority: 'medium', completed: false },
  { title: 'Set up analytics tracking', project: 'Q1 Marketing Campaign', priority: 'low', completed: true },
  
  // Website Redesign tasks
  { title: 'Audit current website content', project: 'Website Redesign', priority: 'high', completed: true },
  { title: 'Create wireframes for key pages', project: 'Website Redesign', priority: 'high', completed: false },
  { title: 'Choose color palette and typography', project: 'Website Redesign', priority: 'medium', completed: false },
  { title: 'Optimize images for web', project: 'Website Redesign', priority: 'low', completed: false },
  
  // Marathon Training tasks
  { title: 'Create 16-week training schedule', project: 'Marathon Training', priority: 'high', completed: true },
  { title: 'Buy proper running shoes', project: 'Marathon Training', priority: 'high', completed: true },
  { title: 'Complete 8-mile long run', project: 'Marathon Training', priority: 'medium', completed: false },
  { title: 'Track weekly mileage goals', project: 'Marathon Training', priority: 'medium', completed: false },
  { title: 'Research race day nutrition', project: 'Marathon Training', priority: 'low', completed: false },
  
  // Home Renovation tasks
  { title: 'Get contractor quotes', project: 'Home Renovation', priority: 'high', completed: false },
  { title: 'Choose cabinet hardware', project: 'Home Renovation', priority: 'medium', completed: false },
  { title: 'Select paint colors', project: 'Home Renovation', priority: 'low', completed: true },
  { title: 'Order kitchen appliances', project: 'Home Renovation', priority: 'high', completed: false },
  
  // Spanish Language tasks
  { title: 'Complete Duolingo lesson', project: 'Spanish Language', priority: 'medium', completed: true },
  { title: 'Practice conversation with tutor', project: 'Spanish Language', priority: 'high', completed: false },
  { title: 'Watch Spanish Netflix show', project: 'Spanish Language', priority: 'low', completed: false },
  { title: 'Review vocabulary flashcards', project: 'Spanish Language', priority: 'medium', completed: false },
  
  // Investment Portfolio tasks
  { title: 'Review current asset allocation', project: 'Investment Portfolio', priority: 'high', completed: true },
  { title: 'Research international fund options', project: 'Investment Portfolio', priority: 'medium', completed: false },
  { title: 'Rebalance portfolio quarterly', project: 'Investment Portfolio', priority: 'medium', completed: false },
  { title: 'Set up automatic contributions', project: 'Investment Portfolio', priority: 'low', completed: true },
  
  // General tasks (not assigned to projects)
  { title: 'Schedule dentist appointment', area: 'Health & Fitness', priority: 'medium', completed: false },
  { title: 'File tax documents', area: 'Finance', priority: 'high', completed: false },
  { title: 'Call mom for birthday', area: 'Personal', priority: 'high', completed: true },
  { title: 'Update LinkedIn profile', area: 'Work', priority: 'low', completed: false },
  { title: 'Organize photo albums', area: 'Personal', priority: 'low', completed: false },
  { title: 'Research vacation destinations', area: 'Personal', priority: 'medium', completed: false },
  { title: 'Update resume', area: 'Work', priority: 'medium', completed: false },
  { title: 'Clean out garage', area: 'Personal', priority: 'low', completed: false }
]

export function MockupDataButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const addMockupData = async () => {
    setIsLoading(true)
    try {
      console.log('Starting to add mockup data...')
      
      // Get the current user
      const user = await getCurrentUser()
      if (!user) {
        console.error('User not authenticated')
        return
      }
      
      console.log('User authenticated:', user.email)
      
      // Add areas (folders)
      console.log('Adding areas...')
      const areaMap = {}
      for (const area of mockAreas) {
        const { data, error } = await supabase
          .from('areas')
          .insert({
            name: area.name,
            description: area.description,
            color: area.color,
            user_id: user.id
          })
          .select()
          .single()
        
        if (error) {
          console.error('Error adding area:', area.name, error)
        } else {
          areaMap[area.name] = data.id
          console.log('Added area:', area.name)
        }
      }
      
      // Add projects
      console.log('Adding projects...')
      const projectMap = {}
      for (const project of mockProjects) {
        const { data, error } = await supabase
          .from('projects')
          .insert({
            name: project.name,
            description: project.description,
            color: project.color,
            priority: project.priority,
            area_id: areaMap[project.area],
            user_id: user.id
          })
          .select()
          .single()
        
        if (error) {
          console.error('Error adding project:', project.name, error)
        } else {
          projectMap[project.name] = data.id
          console.log('Added project:', project.name)
        }
      }
      
      // Add tasks
      console.log('Adding tasks...')
      for (const task of mockTasks) {
        const taskData = {
          title: task.title,
          priority: task.priority,
          completed: task.completed,
          user_id: user.id
        }
        
        if (task.project) {
          taskData.project_id = projectMap[task.project]
        } else if (task.area) {
          taskData.area_id = areaMap[task.area]
        }
        
        const { error } = await supabase
          .from('tasks')
          .insert(taskData)
        
        if (error) {
          console.error('Error adding task:', task.title, error)
        } else {
          console.log('Added task:', task.title)
        }
      }
      
      console.log('✅ Mockup data added successfully!')
      console.log(`Added ${mockAreas.length} areas, ${mockProjects.length} projects, and ${mockTasks.length} tasks`)
      setIsComplete(true)
      
      // Refresh the page to see the new data
      setTimeout(() => {
        window.location.reload()
      }, 1000)
      
    } catch (error) {
      console.error('Error adding mockup data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isComplete) {
    return (
      <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
        ✅ Mockup data added! Refreshing...
      </div>
    )
  }

  return (
    <button
      onClick={addMockupData}
      disabled={isLoading}
      className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg disabled:opacity-50 flex items-center gap-2"
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          Adding mockup data...
        </>
      ) : (
        <>
          🎨 Add Mockup Data
        </>
      )}
    </button>
  )
}