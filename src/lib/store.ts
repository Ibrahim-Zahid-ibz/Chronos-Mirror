// In-memory store for demo (replace with Supabase when credentials are set)
const logs: any[] = []
let userDna: any = {
  user_id: 'demo-user',
  ui_layout: { sections: ['summary', 'insights', 'habits', 'goals'], theme: 'system' },
  insight_weights: { empathy: 0.5, analytical: 0.5, urgent: 0.5 },
  fitness_scores: {},
  interaction_counts: {},
  last_evolved_at: new Date().toISOString(),
  created_at: new Date().toISOString()
}

export function getLogs() {
  return [...logs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 50)
}

export function addLog(log: any) {
  const entry = { ...log, id: crypto.randomUUID(), created_at: new Date().toISOString() }
  logs.push(entry)
  return entry
}

export function getDna() {
  return { ...userDna }
}

export function evolveDna(interaction: any) {
  const interactions = userDna.interaction_counts || {}
  const weights = userDna.insight_weights || {}

  if (interaction.section) {
    interactions[interaction.section] = (interactions[interaction.section] || 0) + 1
  }

  const sortedSections = Object.entries(interactions)
    .sort(([, a]: any, [, b]: any) => b - a)
    .map(([key]) => key)

  const allSections = ['summary', 'insights', 'habits', 'goals', 'recommendations']
  const remainingSections = allSections.filter(s => !sortedSections.includes(s))

  userDna.ui_layout = { ...userDna.ui_layout, sections: [...sortedSections, ...remainingSections] }
  userDna.interaction_counts = interactions

  if (interaction.actionType === 'acted_on' && interaction.insightType) {
    weights[interaction.insightType] = Math.min(1, (weights[interaction.insightType] || 0.5) + 0.1)
  } else if (interaction.actionType === 'dismissed' && interaction.insightType) {
    weights[interaction.insightType] = Math.max(0, (weights[interaction.insightType] || 0.5) - 0.05)
  }

  userDna.insight_weights = weights
  userDna.last_evolved_at = new Date().toISOString()
  return { ...userDna }
}
