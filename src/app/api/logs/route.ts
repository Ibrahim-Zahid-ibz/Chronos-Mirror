import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''

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
    const { data: logs, error } = await supabase
      .from('logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) return NextResponse.json({ logs: [] })
    return NextResponse.json({ logs })
  } catch {
    return NextResponse.json({ logs: [] })
  }
}

export async function POST(request: Request) {
  try {
    const { rawInput } = await request.json()
    if (!rawInput) return NextResponse.json({ error: 'Missing rawInput' }, { status: 400 })

    const { supabase, userId } = await getSupabase()
    const structuredData = await parseWithGemini(rawInput)

    const { data, error } = await supabase
      .from('logs')
      .insert({ raw_input: rawInput, structured_data: structuredData, user_id: userId })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ 
        success: true, 
        data: { raw_input: rawInput, structured_data: structuredData, user_id: userId, created_at: new Date().toISOString() },
        insights: generateInsights(structuredData)
      })
    }

    return NextResponse.json({ success: true, data, insights: generateInsights(structuredData) })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to create log' }, { status: 500 })
  }
}

async function parseWithGemini(input: string) {
  if (!GEMINI_API_KEY) return parseChaoticInput(input)

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Parse this user input into structured data. Return ONLY valid JSON.

Input: "${input}"

Return JSON: {"mood":"positive|negative|neutral","sentiment":-1 to 1,"categories":["health","career","finance","learning","relationships","time-waste"],"duration":minutes or null,"summary":"brief summary","keyEntities":["things mentioned"]}` }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 500 }
      })
    })

    const result = await response.json()
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
  } catch (e) { console.error('Gemini error:', e) }

  return parseChaoticInput(input)
}

function parseChaoticInput(input: string) {
  const lower = input.toLowerCase()
  const result: any = { raw: input, timestamp: new Date().toISOString(), mood: 'neutral', categories: [], duration: null, sentiment: 0, summary: input, keyEntities: [] }

  if (lower.includes('ugh') || lower.includes('trash') || lower.includes('bad') || lower.includes('tired') || lower.includes('stress')) { result.mood = 'negative'; result.sentiment = -0.7 }
  else if (lower.includes('great') || lower.includes('awesome') || lower.includes('happy') || lower.includes('good') || lower.includes('excited')) { result.mood = 'positive'; result.sentiment = 0.7 }

  if (lower.includes('gym') || lower.includes('workout') || lower.includes('run') || lower.includes('exercise')) result.categories.push('health')
  if (lower.includes('work') || lower.includes('job') || lower.includes('career') || lower.includes('meeting') || lower.includes('project')) result.categories.push('career')
  if (lower.includes('money') || lower.includes('spent') || lower.includes('bought') || lower.includes('$') || lower.includes('saved')) result.categories.push('finance')
  if (lower.includes('sleep') || lower.includes('tired') || lower.includes('bed') || lower.includes('woke up') || lower.includes('rest')) result.categories.push('health')
  if (lower.includes('tiktok') || lower.includes('scroll') || lower.includes('instagram') || lower.includes('youtube') || lower.includes('netflix')) result.categories.push('time-waste')
  if (lower.includes('read') || lower.includes('book') || lower.includes('study') || lower.includes('learn') || lower.includes('course')) result.categories.push('learning')
  if (lower.includes('friend') || lower.includes('family') || lower.includes('partner') || lower.includes('call') || lower.includes('date')) result.categories.push('relationships')

  const durationMatch = input.match(/(\d+)\s*(min|mins|minutes|hour|hours|hr|hrs)/i)
  if (durationMatch) { const num = parseInt(durationMatch[1]); const unit = durationMatch[2].toLowerCase(); result.duration = unit.startsWith('hour') || unit.startsWith('hr') ? num * 60 : num }

  return result
}

function generateInsights(sd: any) {
  const insights: string[] = []
  if (sd.categories.includes('time-waste') && sd.duration && sd.duration > 30) insights.push(`You logged ${sd.duration}min of screen time. Consider setting a 30min timer next time.`)
  if (sd.mood === 'negative' && sd.categories.includes('health')) insights.push('Your mood and health seem connected today. A 10min walk could help reset both.')
  if (sd.categories.includes('learning')) insights.push('Great job investing in learning! Consistency here compounds over time.')
  if (sd.categories.includes('career') && sd.mood === 'negative') insights.push('Work stress detected. Consider taking a 5min breathing break.')
  if (sd.categories.includes('finance')) insights.push('Financial activity logged. Review your spending patterns weekly.')
  if (sd.categories.length === 0) insights.push('Interesting entry! Try adding more details for better insights.')
  return insights
}
