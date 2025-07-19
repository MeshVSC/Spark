import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

interface ImportData {
  areas: Array<{ name: string; description?: string; color?: string }>
  projects: Array<{ name: string; area: string; description?: string; priority?: string; color?: string }>
  tasks: Array<{ title: string; project?: string; area?: string; priority?: string; completed?: boolean }>
}

export function FileImport() {
  const [parsedData, setParsedData] = useState<ImportData | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [message, setMessage] = useState('')
  const [showInstructions, setShowInstructions] = useState(false)

  const parseCSV = (csvText: string) => {
    const lines = csvText.trim().split('\n')
    if (lines.length < 2) return null

    // Handle both comma and tab separated values
    const firstLine = lines[0]
    const separator = firstLine.includes('\t') ? '\t' : ','
    
    const headers = lines[0].split(separator).map(h => h.trim().toLowerCase())
    const rows = lines.slice(1).map(line => line.split(separator))

    // Expected format: Area | Project | Task | Priority | Description | Completed
    const areas = new Set<string>()
    const projects: any[] = []
    const tasks: any[] = []
    const projectsSet = new Set<string>()

    rows.forEach(row => {
      const area = row[0]?.trim()
      const project = row[1]?.trim()
      const task = row[2]?.trim()
      const priority = row[3]?.trim() || 'medium'
      const description = row[4]?.trim() || ''
      const completed = row[5]?.trim().toLowerCase() === 'true' || row[5]?.trim().toLowerCase() === 'yes'

      if (area) areas.add(area)
      
      if (project && area && !projectsSet.has(project)) {
        projects.push({
          name: project,
          area: area,
          description: description,
          priority: priority,
          color: getRandomColor()
        })
        projectsSet.add(project)
      }

      if (task) {
        tasks.push({
          title: task,
          project: project || undefined,
          area: project ? undefined : area,
          priority: priority,
          completed: completed
        })
      }
    })

    return {
      areas: Array.from(areas).map(name => ({
        name,
        description: `${name} related tasks and projects`,
        color: getRandomColor()
      })),
      projects,
      tasks
    }
  }

  const getRandomColor = () => {
    const colors = ['#4F46E5', '#059669', '#DC2626', '#7C3AED', '#EA580C', '#3B82F6', '#10B981', '#8B5CF6']
    return colors[Math.floor(Math.random() * colors.length)]
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const csvText = e.target?.result as string
      const parsed = parseCSV(csvText)
      if (parsed) {
        setParsedData(parsed)
        setMessage('')
      } else {
        setMessage('Please upload a valid CSV file with headers: Area, Project, Task, Priority, Description, Completed')
      }
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!parsedData) return

    setIsImporting(true)
    setMessage('Importing data...')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setMessage('Please sign in first')
        setIsImporting(false)
        return
      }

      // Import areas
      const areaMap: { [key: string]: string } = {}
      for (const area of parsedData.areas) {
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

        if (!error && data) {
          areaMap[area.name] = data.id
        }
      }

      // Import projects
      const projectMap: { [key: string]: string } = {}
      for (const project of parsedData.projects) {
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

        if (!error && data) {
          projectMap[project.name] = data.id
        }
      }

      // Import tasks
      for (const task of parsedData.tasks) {
        const taskData: any = {
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

        await supabase.from('tasks').insert(taskData)
      }

      setMessage(`✅ Successfully imported ${parsedData.areas.length} areas, ${parsedData.projects.length} projects, and ${parsedData.tasks.length} tasks!`)
      setParsedData(null)
      
      // Clear file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement
      if (fileInput) fileInput.value = ''
      
      // Refresh page to show new data
      setTimeout(() => window.location.reload(), 2000)

    } catch (error) {
      setMessage('Error importing data. Please try again.')
      console.error(error)
    }

    setIsImporting(false)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium" style={{ color: 'var(--things-gray-700)' }}>
          Data Import
        </h3>
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="text-xs px-2 py-1 rounded hover:bg-gray-100"
          style={{ color: 'var(--things-gray-600)' }}
        >
          {showInstructions ? 'Hide' : 'Show'} Instructions
        </button>
      </div>

      {/* Collapsible Instructions */}
      {showInstructions && (
        <div className="p-3 bg-blue-50 rounded-lg text-xs">
          <p className="mb-2">Upload a CSV file with these columns:</p>
          <p className="font-mono bg-white p-2 rounded mb-2">Area, Project, Task, Priority, Description, Completed</p>
          <p>• <strong>Area</strong>: Work area (e.g., "Work", "Personal")</p>
          <p>• <strong>Project</strong>: Project name (optional for standalone tasks)</p>
          <p>• <strong>Task</strong>: Task title</p>
          <p>• <strong>Priority</strong>: "high", "medium", or "low"</p>
          <p>• <strong>Description</strong>: Additional details (optional)</p>
          <p>• <strong>Completed</strong>: "true" or "false"</p>
        </div>
      )}

      {/* File Upload */}
      <div>
        <input
          id="file-input"
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-lg file:border-0
                     file:text-sm file:font-medium
                     file:bg-blue-50 file:text-blue-700
                     hover:file:bg-blue-100"
        />
      </div>

      {/* Status Message */}
      {message && (
        <div className={`p-2 rounded text-xs ${
          message.includes('✅') 
            ? 'bg-green-50 text-green-800' 
            : message.includes('Error') 
            ? 'bg-red-50 text-red-800' 
            : 'bg-blue-50 text-blue-800'
        }`}>
          {message}
        </div>
      )}

      {/* Preview */}
      {parsedData && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <h4 className="text-xs font-medium mb-2">Preview Import:</h4>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <span className="font-medium text-blue-600">Areas ({parsedData.areas.length})</span>
              <div className="mt-1 space-y-1">
                {parsedData.areas.slice(0, 3).map((area, i) => (
                  <div key={i}>• {area.name}</div>
                ))}
                {parsedData.areas.length > 3 && (
                  <div className="text-gray-500">...+{parsedData.areas.length - 3} more</div>
                )}
              </div>
            </div>
            <div>
              <span className="font-medium text-green-600">Projects ({parsedData.projects.length})</span>
              <div className="mt-1 space-y-1">
                {parsedData.projects.slice(0, 3).map((project, i) => (
                  <div key={i}>• {project.name}</div>
                ))}
                {parsedData.projects.length > 3 && (
                  <div className="text-gray-500">...+{parsedData.projects.length - 3} more</div>
                )}
              </div>
            </div>
            <div>
              <span className="font-medium text-purple-600">Tasks ({parsedData.tasks.length})</span>
              <div className="mt-1 space-y-1">
                {parsedData.tasks.slice(0, 3).map((task, i) => (
                  <div key={i}>• {task.title}</div>
                ))}
                {parsedData.tasks.length > 3 && (
                  <div className="text-gray-500">...+{parsedData.tasks.length - 3} more</div>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleImport}
            disabled={isImporting}
            className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-xs"
          >
            {isImporting ? 'Importing...' : 'Import All Data'}
          </button>
        </div>
      )}
    </div>
  )
}