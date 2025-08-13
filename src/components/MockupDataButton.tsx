import { useState } from 'react'
import { getCurrentUser } from '../lib/auth'
import { supabase } from '../lib/supabase'

// --- Mock dataset generators (realistic content) ---
const areaSeeds = [
  { name: 'Creativity Lab', description: 'R&D experiments and concept spikes', color: '#0EA5E9' },
  { name: 'Family & Friends', description: 'Relationships, events, commitments', color: '#F43F5E' },
  { name: 'Home & Maintenance', description: 'Repairs, chores, and household ops', color: '#22C55E' },
  { name: 'Mindfulness', description: 'Well-being, meditation, journaling', color: '#A855F7' }
]

const priorities = ['low','medium','high'] as const
const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const isoInHours = (h: number) => {
  const d = new Date(Date.now() + h * 60 * 60 * 1000)
  return d.toISOString()
}

// Project catalog: 4 realistic projects per area
const projectCatalog: Record<string, { name: string; description: string }[]> = {
  'Creativity Lab': [
    { name: 'Prototype: Note-Taking AI', description: 'Validate OCR + summarization MVP on real PDFs' },
    { name: 'Micro-Tool: Screenshot Annotator', description: 'Build a minimal annotation overlay with export' },
    { name: 'Research: Vector DB Benchmarks', description: 'Assess recall/latency across small/medium datasets' },
    { name: 'Internal Docs Revamp', description: 'Reorganize docs with search and taxonomy' }
  ],
  'Family & Friends': [
    { name: 'Autumn Gathering 2025', description: 'Venue, catering, and activities for 30 people' },
    { name: 'Birthday Weekend Plan', description: 'Shortlist restaurants, cake, and photo session' },
    { name: 'Holiday Travel Itinerary', description: 'Flights, stay, day plans with budget guardrails' },
    { name: 'Monthly Check-in Calls', description: 'Schedule and track monthly calls with relatives' }
  ],
  'Home & Maintenance': [
    { name: 'Kitchen Deep Refresh', description: 'Faucet swap, pantry organization, LED under-cabinet' },
    { name: 'Hallway Lighting Upgrade', description: 'Replace bulbs and add motion sensors' },
    { name: 'Closet Reorganization', description: 'Seasonal rotation and storage bins labeling' },
    { name: 'Garden Autumn Prep', description: 'Soil check, pruning, and tool maintenance' }
  ],
  'Mindfulness': [
    { name: '30-Day Meditation Reset', description: 'Daily 10-min sessions with weekly review' },
    { name: 'Morning Journaling Habit', description: 'Prompted journal with weekly themes' },
    { name: 'Sleep Hygiene Tune-up', description: 'Wind-down routine and screen-time limits' },
    { name: 'Mindful Walk Series', description: 'Weekly park walks with audio guidance' }
  ]
}

// 4 Areas
const areas = areaSeeds

// Build 4 projects per area (16 total), using realistic names/descriptions
const projects = areas.flatMap((a) =>
  projectCatalog[a.name].map((p, i) => ({
    name: p.name,
    description: p.description,
    color: a.color,
    priority: priorities[(i % priorities.length)],
    area: a.name
  }))
)

// Task templates (realistic lifecycle)
const taskTemplates = [
  (p: string) => ({ title: `Kickoff & scope for ${p}`, notes: `Confirm goals, risks, and success metrics for ${p}.` }),
  (p: string) => ({ title: `Design draft for ${p}`, notes: `Create first-pass design and share for feedback.` }),
  (p: string) => ({ title: `Implement core for ${p}`, notes: `Build core functionality and wire integrations.` }),
  (p: string) => ({ title: `Review & launch ${p}`, notes: `QA, finalize docs, and ship v1.` })
]

// 4 Tasks per Project (64 total) with realistic titles, tags, and time
const tasks = projects.flatMap((p, pi) =>
  taskTemplates.map((tpl, ti) => {
    const base = tpl(p.name)
    return {
      title: base.title,
      notes: base.notes,
      due_date: isoInHours(24 + (pi * 4 + ti) * 8 + rnd(0, 2)),
      scheduled_date: isoInHours(6 + (pi * 4 + ti) * 6 + rnd(0, 2)),
      priority: priorities[(pi + ti) % priorities.length],
      duration: 45 + ti * 30 + rnd(0, 15),
      tags: [
        p.area.toLowerCase().split(' ')[0],
        'milestone',
        ti === 0 ? 'planning' : ti === 1 ? 'design' : ti === 2 ? 'build' : 'release'
      ],
      project: p.name,
      completed: false
    }
  })
)

// Subtask templates (PDCA-style) for realism
const subtaskTemplates = [
  (t: string) => `Draft details for "${t}"`,
  (t: string) => `Do the work: "${t}" core`,
  (t: string) => `QA & review: "${t}"`,
  (t: string) => `Close out & notes for "${t}"`
]

// 4 Subtasks per Task (256 total)
const mockSubtasks = tasks.flatMap((t) =>
  subtaskTemplates.map((tpl) => ({
    title: tpl(t.title),
    parentTask: t.title
  }))
)

// 10 Sparks (unassigned tasks) with realistic ideas
const mockSparks = [
  { title: 'Meeting autosummary snippet', tags: ['spark','ai','notes'], priority: 'high',   due_date: isoInHours(12) },
  { title: 'Pantry restock reminder',     tags: ['spark','home','iot'], priority: 'medium', due_date: isoInHours(18) },
  { title: 'Photo auto-tag by people',    tags: ['spark','vision'],      priority: 'low',    due_date: isoInHours(30) },
  { title: 'Mindful micro-break ping',    tags: ['spark','health'],      priority: 'low',    due_date: isoInHours(26) },
  { title: 'Family event checklist pack', tags: ['spark','template'],    priority: 'low',    due_date: isoInHours(40) },
  { title: 'Receipt OCR pipeline',        tags: ['spark','ocr','fin'],   priority: 'medium', due_date: isoInHours(36) },
  { title: 'Journaling prompts rotator',  tags: ['spark','writing'],     priority: 'low',    due_date: isoInHours(22) },
  { title: 'Habit streak heatmap',        tags: ['spark','visual'],      priority: 'low',    due_date: isoInHours(28) },
  { title: 'Search digest bot',           tags: ['spark','ai','search'], priority: 'high',   due_date: isoInHours(20) },
  { title: 'Quick photo annotator',       tags: ['spark','ux'],          priority: 'medium', due_date: isoInHours(16) }
]

export async function addMockupData() {
  const user = await getCurrentUser()
  if (!user) throw new Error('User not authenticated')

  // Optional cleanup (FK-safe)
  await supabase.from('subtasks').delete().eq('user_id', user.id)
  await supabase.from('tasks').delete().eq('user_id', user.id)
  await supabase.from('recurring_tasks').delete().eq('user_id', user.id)
  await supabase.from('time_blocks').delete().eq('user_id', user.id)
  await supabase.from('projects').delete().eq('user_id', user.id)
  await supabase.from('areas').delete().eq('user_id', user.id)

  // Areas
  const areaMap: Record<string, string> = {}
  for (const a of areas) {
    const { data, error } = await supabase.from('areas').insert({ name: a.name, description: a.description, color: a.color, user_id: user.id }).select().single()
    if (error) throw error
    areaMap[a.name] = data!.id
  }
  console.groupCollapsed('✔ Areas inserted');
  console.table(areaMap);
  console.groupEnd();

  // Projects
  const projectMap: Record<string, string> = {}
  for (const p of projects) {
    const payload = { name: p.name, description: p.description, color: p.color, priority: p.priority, area_id: areaMap[p.area], user_id: user.id }
    const { data, error } = await supabase.from('projects').insert(payload).select().single()
    if (error) throw error
    projectMap[p.name] = data!.id
  }
  console.groupCollapsed('✔ Projects inserted');
  console.table(projectMap);
  console.groupEnd();

  // Tasks
  const taskMap: Record<string, string> = {}
  for (const t of tasks) {
    const row: any = {
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
    // Resolve relations with guards
    let linkedBy: 'project' | 'area' | 'none' = 'none';
    if (t.project && t.area) {
      console.warn(`[Task] "${t.title}" has both project and area in mock data. Linking to project only.`);
    }
    if (t.project) {
      const pid = projectMap[t.project];
      if (pid) {
        row.project_id = pid;
        linkedBy = 'project';
      } else {
        console.warn(`[Task] "${t.title}" project "${t.project}" not found in projectMap. Inserting unassigned.`);
      }
    } else if (t.area) {
      const aid = areaMap[t.area];
      if (aid) {
        row.area_id = aid;
        linkedBy = 'area';
      } else {
        console.warn(`[Task] "${t.title}" area "${t.area}" not found in areaMap. Inserting unassigned.`);
      }
    }
    console.debug(`[Task] Inserting "${t.title}" linked by: ${linkedBy}`);
    const { data, error } = await supabase.from('tasks').insert(row).select().single()
    if (error) throw error
    taskMap[t.title] = data!.id
    console.log(`✔ Task inserted: ${t.title} (id=${data!.id})`);
  }

  // Subtasks
  for (const st of mockSubtasks) {
    const parentId = taskMap[st.parentTask]
    if (!parentId) continue
    const { error } = await supabase.from('subtasks').insert({ title: st.title, task_id: parentId, user_id: user.id })
    if (error) throw error
    console.log(`✔ Subtask inserted under "${st.parentTask}": ${st.title}`);
  }

  // Sparks (unassigned)
  for (const s of mockSparks) {
    const { error } = await supabase.from('tasks').insert({
      title: s.title,
      priority: s.priority,
      due_date: s.due_date,
      tags: s.tags,
      user_id: user.id,
      completed: false
    })
    if (error) throw error
    console.log(`✔ Spark inserted: ${s.title}`);
  }

  console.group('✅ Summary');
  console.log('Inserted: 4 areas, 16 projects, 64 tasks, 256 subtasks, 10 sparks');
  console.groupEnd();
}

export function MockupDataButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await addMockupData()
      setIsComplete(true)
      setTimeout(() => window.location.reload(), 800)
    } catch (e: any) {
      console.error(e)
      setError(e?.message ?? 'Insert failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 flex flex-col items-end gap-2">
      {error && (
        <div className="bg-red-600 text-white px-3 py-2 rounded shadow">{error}</div>
      )}
      {isComplete && (
        <div className="bg-green-600 text-white px-3 py-2 rounded shadow">✅ Mock data added</div>
      )}
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow disabled:opacity-50"
      >
        {isLoading ? 'Adding mock data…' : '🎨 Add Mockup Data'}
      </button>
    </div>
  )
}