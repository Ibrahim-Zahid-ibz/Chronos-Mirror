import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getSupabase() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, userId: user?.id || '00000000-0000-0000-0000-000000000000' }
}

export async function GET() {
  try {
    const { supabase, userId } = await getSupabase()
    const { data, error } = await supabase.from('user_dna').select('*').eq('user_id', userId).single()

    if (error && error.code !== 'PGRST116') return NextResponse.json({ dna: defaultDna() })
    if (!data) {
      const { data: newData } = await supabase.from('user_dna').insert({ user_id: userId, ui_layout: { sections: ['summary', 'insights', 'habits', 'goals'], theme: 'system' }, insight_weights: { empathy: 0.5, analytical: 0.5, urgent: 0.5 }, fitness_scores: {}, interaction_counts: {} }).select().single()
      return NextResponse.json({ dna: newData || defaultDna() })
    }
    return NextResponse.json({ dna: data })
  } catch {
    return NextResponse.json({ dna: defaultDna() })
  }
}

export async function POST(request: Request) {
  try {
    const { interaction } = await request.json()
    const { supabase, userId } = await getSupabase()
    const { data: currentDna } = await supabase.from('user_dna').select('*').eq('user_id', userId).single()
    if (!currentDna) return NextResponse.json({ error: 'No DNA found' }, { status: 404 })

    const evolvedDna = evolveDna(currentDna, interaction)
    const { data, error } = await supabase.from('user_dna').update(evolvedDna).eq('user_id', userId).select().single()
    if (error) throw error
    return NextResponse.json({ dna: data })
  } catch {
    return NextResponse.json({ error: 'Failed to evolve DNA' }, { status: 500 })
  }
}

function defaultDna() {
  return { ui_layout: { sections: ['summary', 'insights'], theme: 'system' }, insight_weights: { empathy: 0.5, analytical: 0.5, urgent: 0.5 }, interaction_counts: {} }
}

function evolveDna(dna: any, interaction: any) {
  const newDna = { ...dna }
  const interactions = dna.interaction_counts || {}
  const weights = dna.insight_weights || {}
  if (interaction.section) interactions[interaction.section] = (interactions[interaction.section] || 0) + 1
  const sortedSections = Object.entries(interactions).sort(([, a]: any, [, b]: any) => b - a).map(([key]) => key)
  const allSections = ['summary', 'insights', 'habits', 'goals', 'recommendations']
  newDna.ui_layout = { ...dna.ui_layout, sections: [...sortedSections, ...allSections.filter(s => !sortedSections.includes(s))] }
  newDna.interaction_counts = interactions
  if (interaction.actionType === 'acted_on' && interaction.insightType) weights[interaction.insightType] = Math.min(1, (weights[interaction.insightType] || 0.5) + 0.1)
  else if (interaction.actionType === 'dismissed' && interaction.insightType) weights[interaction.insightType] = Math.max(0, (weights[interaction.insightType] || 0.5) - 0.05)
  newDna.insight_weights = weights
  newDna.last_evolved_at = new Date().toISOString()
  return newDna
}
