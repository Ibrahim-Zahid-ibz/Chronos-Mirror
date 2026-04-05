'use client'

import { useState, useEffect } from 'react'
import { Brain, Send, TrendingUp, Clock, Target, Zap, Sparkles, Activity, Heart, BookOpen, Briefcase, DollarSign, Users, LogOut } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import AvatarAvatar from '@/components/AvatarAvatar'
import { createClient } from '@/lib/supabase-client'

interface Log {
  id: string
  raw_input: string
  structured_data: any
  created_at: string
}

interface DNA {
  ui_layout: { sections: string[]; theme: string }
  insight_weights: { empathy: number; analytical: number; urgent: number }
  interaction_counts: Record<string, number>
}

interface Insight {
  text: string
  type: string
  actedOn: boolean
}

const CATEGORIES = [
  { id: 'health', label: 'Health', icon: Heart, color: 'text-red-500', bg: 'bg-red-500/10' },
  { id: 'career', label: 'Career', icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'finance', label: 'Finance', icon: DollarSign, color: 'text-green-500', bg: 'bg-green-500/10' },
  { id: 'learning', label: 'Learning', icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { id: 'relationships', label: 'Relationships', icon: Users, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  { id: 'time-waste', label: 'Time Waste', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
]

export default function Home() {
  const [input, setInput] = useState('')
  const [logs, setLogs] = useState<Log[]>([])
  const [dna, setDna] = useState<DNA | null>(null)
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    fetchLogs()
    fetchDna()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs')
      const data = await res.json()
      if (data.logs) setLogs(data.logs)
    } catch (e) { console.error(e) }
  }

  const fetchDna = async () => {
    try {
      const res = await fetch('/api/dna')
      const data = await res.json()
      if (data.dna) setDna(data.dna)
    } catch (e) { console.error(e) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawInput: input }),
      })
      const data = await res.json()
      if (data.success) {
        setLogs(prev => [data.data, ...prev])
        if (data.insights) {
          setInsights(prev => [...data.insights.map((t: string) => ({ text: t, type: 'analytical', actedOn: false })), ...prev])
        }
        setInput('')
        if (data.data?.structured_data?.categories?.[0]) {
          await fetch('/api/dna', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ interaction: { section: data.data.structured_data.categories[0], actionType: 'viewed', insightType: 'analytical' } }),
          })
          fetchDna()
        }
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const handleInsightAction = async (index: number, action: string) => {
    const insight = insights[index]
    setInsights(prev => prev.map((ins, i) => i === index ? { ...ins, actedOn: action === 'acted_on' } : ins))
    await fetch('/api/dna', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interaction: { section: 'insights', actionType: action, insightType: insight.type } }),
    })
    fetchDna()
  }

  const sections = dna?.ui_layout?.sections || ['summary', 'insights', 'habits', 'goals']
  const categoryStats = logs.reduce((acc: any, log) => {
    (log.structured_data?.categories || []).forEach((cat: string) => { acc[cat] = (acc[cat] || 0) + 1 })
    return acc
  }, {})
  const moodStats = logs.reduce((acc: any, log) => {
    const mood = log.structured_data?.mood || 'neutral'
    acc[mood] = (acc[mood] || 0) + 1
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      <header className="border-b border-slate-800/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Chronos Mirror</h1>
              <p className="text-xs text-slate-500">Self-Evolving Life Audit</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{user.email}</span>
                <button onClick={handleLogout} className="p-2 hover:bg-slate-800 rounded-lg transition-colors" title="Sign out">
                  <LogOut className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">Evolving</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Avatar Section */}
        {logs.length > 0 && (
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <AvatarAvatar
                  categoryStats={categoryStats}
                  totalLogs={logs.length}
                  moodRatio={{ positive: moodStats.positive || 0, negative: moodStats.negative || 0 }}
                />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2 md:justify-start justify-center">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Your Mirror Avatar
                </h2>
                <p className="text-sm text-slate-400">
                  This avatar evolves based on your life patterns. Your habits shape its appearance—health, career, finance, learning, and more all leave their mark.
                </p>
                <div className="flex flex-wrap gap-2 mt-3 md:justify-start justify-center">
                  {Object.entries(categoryStats).sort(([, a]: any, [, b]: any) => b - a).slice(0, 3).map(([cat, count]: [string, any]) => (
                    <span key={cat} className="text-xs px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded-full">
                      {cat}: {Math.round((count / logs.length) * 100)}%
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold">Chaos-to-Cloud Log</h2>
          </div>
          <p className="text-sm text-slate-400 mb-4">Type anything—thoughts, feelings, what you did. The AI will parse it.</p>
          <form onSubmit={handleSubmit}>
            <div className="flex gap-3">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="e.g., Ugh, spent 40 mins scrolling TikTok instead of hitting the gym. Feeling like trash." className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all" />
              <button type="submit" disabled={loading || !input.trim()} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-3 rounded-xl font-medium text-sm transition-all flex items-center gap-2">
                <Send className="w-4 h-4" />Log
              </button>
            </div>
          </form>
        </div>

        <div className="grid gap-6">
          {sections.includes('summary') && (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-400" /><h2 className="text-lg font-semibold">Life Mirror</h2></div>
                <span className="text-xs text-slate-500">{logs.length} logs</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-800/50 rounded-xl p-4"><div className="text-2xl font-bold text-white">{logs.length}</div><div className="text-xs text-slate-400 mt-1">Total Logs</div></div>
                <div className="bg-slate-800/50 rounded-xl p-4"><div className="text-2xl font-bold text-emerald-400">{moodStats.positive || 0}</div><div className="text-xs text-slate-400 mt-1">Positive Days</div></div>
                <div className="bg-slate-800/50 rounded-xl p-4"><div className="text-2xl font-bold text-amber-400">{moodStats.negative || 0}</div><div className="text-xs text-slate-400 mt-1">Challenging Days</div></div>
                <div className="bg-slate-800/50 rounded-xl p-4"><div className="text-2xl font-bold text-indigo-400">{Object.keys(categoryStats).length}</div><div className="text-xs text-slate-400 mt-1">Active Areas</div></div>
              </div>
              {Object.keys(categoryStats).length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-300 mb-3">Your Focus Areas</h3>
                  <div className="space-y-2">
                    {Object.entries(categoryStats).sort(([, a]: any, [, b]: any) => b - a).map(([cat, count]: [string, any]) => {
                      const catInfo = CATEGORIES.find(c => c.id === cat)
                      if (!catInfo) return null
                      const pct = Math.round((count / logs.length) * 100)
                      return (
                        <div key={cat} className="flex items-center gap-3">
                          <catInfo.icon className={`w-4 h-4 ${catInfo.color}`} />
                          <span className="text-sm text-slate-300 w-24">{catInfo.label}</span>
                          <div className="flex-1 bg-slate-800 rounded-full h-2"><div className="bg-indigo-500 rounded-full h-2 transition-all" style={{ width: `${pct}%` }} /></div>
                          <span className="text-xs text-slate-400 w-12 text-right">{pct}%</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {sections.includes('insights') && insights.length > 0 && (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4"><Zap className="w-5 h-5 text-amber-400" /><h2 className="text-lg font-semibold">Evolving Insights</h2></div>
              <div className="space-y-3">
                {insights.slice(0, 5).map((insight, i) => (
                  <div key={i} className={`p-4 rounded-xl border transition-all ${insight.actedOn ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-800/50 border-slate-700/50'}`}>
                    <p className="text-sm text-slate-200">{insight.text}</p>
                    {!insight.actedOn && (
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => handleInsightAction(i, 'acted_on')} className="text-xs px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full hover:bg-emerald-500/30 transition-colors">✓ Acted on this</button>
                        <button onClick={() => handleInsightAction(i, 'dismissed')} className="text-xs px-3 py-1 bg-slate-700/50 text-slate-400 rounded-full hover:bg-slate-700 transition-colors">Dismiss</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {logs.length > 0 && (
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4"><Clock className="w-5 h-5 text-slate-400" /><h2 className="text-lg font-semibold">Recent Entries</h2></div>
              <div className="space-y-3">
                {logs.slice(0, 10).map((log) => (
                  <div key={log.id} className="p-4 bg-slate-800/30 rounded-xl border border-slate-800/50">
                    <p className="text-sm text-slate-200 mb-2">{log.raw_input}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      {log.structured_data?.categories?.map((cat: string) => {
                        const catInfo = CATEGORIES.find(c => c.id === cat)
                        if (!catInfo) return null
                        return <span key={cat} className={`text-xs px-2 py-0.5 rounded-full ${catInfo.bg} ${catInfo.color}`}>{catInfo.label}</span>
                      })}
                      {log.structured_data?.mood && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${log.structured_data.mood === 'positive' ? 'bg-emerald-500/10 text-emerald-400' : log.structured_data.mood === 'negative' ? 'bg-red-500/10 text-red-400' : 'bg-slate-700/50 text-slate-400'}`}>{log.structured_data.mood}</span>
                      )}
                      {log.structured_data?.duration && <span className="text-xs text-slate-400">{log.structured_data.duration}min</span>}
                      <span className="text-xs text-slate-500 ml-auto">{format(parseISO(log.created_at), 'MMM d, h:mm a')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {logs.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6"><Brain className="w-10 h-10 text-indigo-400" /></div>
              <h2 className="text-xl font-bold text-white mb-3">Start Your Life Mirror</h2>
              <p className="text-slate-400 max-w-md mx-auto mb-6">Log your thoughts, habits, and feelings in plain language. The AI will parse them and start building your personal evolution profile.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
