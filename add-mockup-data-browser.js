// Copy/paste in your app console after signing in.
// Mirrors your existing browser script flow; no new columns added.

const areas = [
  { name: 'Creativity Lab', description: 'R&D experiments and concept spikes', color: '#0EA5E9' },
  { name: 'Family & Friends', description: 'Relationships, events, commitments', color: '#F43F5E' },
  { name: 'Home & Maintenance', description: 'Repairs, chores, and household ops', color: '#22C55E' },
  { name: 'Mindfulness', description: 'Well-being, meditation, journaling', color: '#A855F7' }
]

// Projects: keep same columns you already insert (name, description, color, priority, area_id, user_id)
const projects = [
  { name: 'Rapid Prototype: Note-Taking AI', description: 'Validate OCR + summarization pipeline; define MVP scope.', color: '#0284C7', priority: 'high', area: 'Creativity Lab' },
  { name: 'Autumn Family Gathering', description: 'Venue, catering, activities. Budget guardrails in place.', color: '#FB7185', priority: 'medium', area: 'Family & Friends' },
  { name: 'Kitchen Deep Refresh', description: 'Faucet replacement, pantry organization, LED strips.', color: '#16A34A', priority: 'medium', area: 'Home & Maintenance' },
  { name: '30-Day Mindfulness Reset', description: 'Daily practice with weekly reflection checkpoints.', color: '#8B5CF6', priority: 'low', area: 'Mindfulness' }
]

// Tasks: schema fields only. duration in minutes. tags as TEXT[].
const tasks = [
  // Project-linked
  { title: 'Define OCR vendor shortlist', notes: 'Accuracy, latency, pricing comparison', due_date: '2025-08-16T12:00:00Z', scheduled_date: '2025-08-12T09:30:00Z', priority: 'high', duration: 120, tags: ['ai','ocr','evaluation'], project: 'Rapid Prototype: Note-Taking AI', completed: false },
  { title: 'Create pantry labeling system', notes: 'Design taxonomy, layout, and placements', due_date: '2025-09-05T17:00:00Z', scheduled_date: '2025-08-28T11:00:00Z', priority: 'medium', duration: 180, tags: ['organization','labels'], project: 'Kitchen Deep Refresh', completed: false },

  // Area-linked
  { title: 'Call venue options', notes: 'Capacity, pricing, parking, availability', due_date: '2025-09-12T15:00:00Z', scheduled_date: '2025-09-01T17:00:00Z', priority: 'medium', duration: 90, tags: ['event','logistics'], area: 'Family & Friends', completed: false },
  { title: 'Guided meditation session', notes: 'Evaluate 3 tracks and set reminder', due_date: '2025-08-20T07:30:00Z', scheduled_date: '2025-08-10T07:30:00Z', priority: 'low', duration: 30, tags: ['habit','health'], area: 'Mindfulness', completed: false }
]

// Subtasks: schema allows title + linkage; compress details into titles
const subtasks = [
  { title: 'OCR benchmark on 3 PDFs; capture accuracy/latency', parentTask: 'Define OCR vendor shortlist' },
  { title: 'Draft pantry label taxonomy: staples/grains/snacks/baking/cans', parentTask: 'Create pantry labeling system' },
  { title: 'Prepare venue call script: capacity, pricing, parking', parentTask: 'Call venue options' },
  { title: 'Select 3 guided tracks; enable daily reminder', parentTask: 'Guided meditation session' }
]

// Sparks = unassigned tasks (both project_id and area_id NULL)
const sparks = [
  { title: 'Micro-journal in status bar', tags: ['ux','menubar'], priority: 'low', due_date: '2025-08-30T09:00:00Z' },
  { title: 'Auto-tag photos by location', tags: ['vision','ml'], priority: 'medium', due_date: '2025-09-15T12:00:00Z' },
  { title: 'Meeting TL;DR widget', tags: ['summary','productivity'], priority: 'high', due_date: '2025-08-25T08:00:00Z' },
  { title: 'Expense receipt scanner', tags: ['fintech','ocr'], priority: 'medium', due_date: '2025-09-10T17:00:00Z' },
  { title: 'Voice-to-tags for tasks', tags: ['voice','nlp'], priority: 'low', due_date: '2025-09-05T10:00:00Z' },
  { title: 'Habit streak heatmap', tags: ['visualization','habit'], priority: 'low', due_date: '2025-08-27T07:00:00Z' },
  { title: 'Smart pantry refill alert', tags: ['iot','home'], priority: 'medium', due_date: '2025-09-20T16:00:00Z' },
  { title: 'Family event checklist pack', tags: ['template','events'], priority: 'low', due_date: '2025-09-07T18:00:00Z' },
  { title: 'Mindful break nudge', tags: ['health','notification'], priority: 'low', due_date: '2025-08-22T14:00:00Z' },
  { title: 'Research digest bot', tags: ['ai','search'], priority: 'high', due_date: '2025-09-01T09:00:00Z' }
]

async function addNewMockDataBrowser() {
  try {
    console.log('Starting (browser) insert…')

    if (!window.supabase) {
      console.error('Supabase client not found. Open the Spark app first.')
      return
    }
    const supabase = window.supabase

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) { console.error('User not authenticated:', userError); return }
    console.log('User:', user.email)

    // Areas
    const areaMap = {}
    for (const a of areas) {
      const { data, error } = await supabase.from('areas').insert({ name: a.name, description: a.description, color: a.color, user_id: user.id }).select().single()
      if (error) console.error('Area error:', a.name, error); else { areaMap[a.name] = data.id; console.log('Area:', a.name) }
    }

    // Projects
    const projectMap = {}
    for (const p of projects) {
      const payload = { name: p.name, description: p.description, color: p.color, priority: p.priority, area_id: areaMap[p.area], user_id: user.id }
      const { data, error } = await supabase.from('projects').insert(payload).select().single()
      if (error) console.error('Project error:', p.name, error); else { projectMap[p.name] = data.id; console.log('Project:', p.name) }
    }

    // Tasks
    const taskMap = {}
    for (const t of tasks) {
      const row = {
        title: t.title,
        notes: t.notes,
        due_date: t.due_date,
        scheduled_date: t.scheduled_date,
        priority: t.priority,
        tags: t.tags,
        duration: t.duration,
        completed: t.completed,
        user_id: user.id
      }
      if (t.project) row.project_id = projectMap[t.project]
      if (t.area) row.area_id = areaMap[t.area]

      const { data, error } = await supabase.from('tasks').insert(row).select().single()
      if (error) console.error('Task error:', t.title, error); else { taskMap[t.title] = data.id; console.log('Task:', t.title) }
    }

    // Subtasks
    for (const st of subtasks) {
      const parentId = taskMap[st.parentTask]
      if (!parentId) { console.warn('Skipping subtask (parent not found):', st.title); continue }
      const { error } = await supabase.from('subtasks').insert({ title: st.title, task_id: parentId, user_id: user.id })
      if (error) console.error('Subtask error:', st.title, error); else console.log('Subtask:', st.title)
    }

    // Sparks (unassigned tasks)
    for (const s of sparks) {
      const { error } = await supabase.from('tasks').insert({
        title: s.title, priority: s.priority, due_date: s.due_date, tags: s.tags, user_id: user.id, completed: false
        // project_id and area_id omitted to keep them NULL
      })
      if (error) console.error('Spark error:', s.title, error); else console.log('Spark:', s.title)
    }

    console.log('Done. Inserted 4 areas, 4 projects, 4 tasks, 4 subtasks, 10 sparks.')
    if (window?.location?.reload) window.location.reload()
  } catch (e) {
    console.error('Browser insert failed:', e)
  }
}

// Run
addNewMockDataBrowser()