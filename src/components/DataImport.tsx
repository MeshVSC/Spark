import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

interface ImportData {
  areas: Array<{ name: string; description?: string; color?: string }>
  projects: Array<{ name: string; area: string; description?: string; priority?: string; color?: string }>
  tasks: Array<{ title: string; project?: string; area?: string; priority?: string; completed?: boolean }>
}

export function DataImport() {
  const [rawData, setRawData] = useState('')
  const [parsedData, setParsedData] = useState<ImportData | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [message, setMessage] = useState('')

  const parseTableData = (data: string) => {
    const lines = data.trim().split('\n')
    if (lines.length < 2) return null

    const headers = lines[0].split('\t').map(h => h.trim().toLowerCase())
    const rows = lines.slice(1).map(line => line.split('\t'))

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

  const handleParse = () => {
    const parsed = parseTableData(rawData)
    if (parsed) {
      setParsedData(parsed)
      setMessage('')
    } else {
      setMessage('Please paste valid table data with headers: Area | Project | Task | Priority | Description | Completed')
    }
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
      setRawData('')
      
      // Refresh page to show new data
      setTimeout(() => window.location.reload(), 2000)

    } catch (error) {
      setMessage('Error importing data. Please try again.')
      console.error(error)
    }

    setIsImporting(false)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Import Data</h2>
      
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">How to use:</h3>
        <p className="text-sm mb-2">1. Copy data from Excel/Google Sheets with these columns:</p>
        <p className="text-sm font-mono bg-white p-2 rounded">Area | Project | Task | Priority | Description | Completed</p>
        <p className="text-sm mt-2">2. Paste it below and click "Parse Data"</p>
        <p className="text-sm">3. Review the preview and click "Import" if it looks correct</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Paste your table data:</label>
          <textarea
            value={rawData}
            onChange={(e) => setRawData(e.target.value)}
            placeholder="Area	Project	Task	Priority	Description	Completed
Work	Marketing	Create campaign	high	Q1 campaign planning	false
Work	Marketing	Design assets	medium	Social media graphics	false
Personal	Home	Clean garage	low	Spring cleaning	true"
            className="w-full h-40 p-3 border rounded-lg font-mono text-sm"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleParse}
            disabled={!rawData.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Parse Data
          </button>
        </div>

        {message && (
          <div className={`p-3 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-800' : message.includes('Error') ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'}`}>
            {message}
          </div>
        )}

        {parsedData && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-3">Preview Import:</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-blue-600 mb-2">Areas ({parsedData.areas.length})</h4>
                <ul className="space-y-1">
                  {parsedData.areas.map((area, i) => (
                    <li key={i} className="truncate">• {area.name}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-green-600 mb-2">Projects ({parsedData.projects.length})</h4>
                <ul className="space-y-1">
                  {parsedData.projects.map((project, i) => (
                    <li key={i} className="truncate">• {project.name}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-purple-600 mb-2">Tasks ({parsedData.tasks.length})</h4>
                <ul className="space-y-1">
                  {parsedData.tasks.slice(0, 10).map((task, i) => (
                    <li key={i} className="truncate">• {task.title}</li>
                  ))}
                  {parsedData.tasks.length > 10 && (
                    <li className="text-gray-500">...and {parsedData.tasks.length - 10} more</li>
                  )}
                </ul>
              </div>
            </div>
            <button
              onClick={handleImport}
              disabled={isImporting}
              className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isImporting ? 'Importing...' : 'Import All Data'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}