'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Brain, Loader2 } from 'lucide-react'

export default function AuthCallback() {
  const router = useRouter()
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { error } = await supabase.auth.getSession()
        if (error) throw error

        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          router.push('/')
        } else {
          setError('Authentication failed. Please try again.')
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred during authentication.')
      }
    }

    handleCallback()
  }, [router, supabase.auth])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20">
          <Brain className="w-8 h-8 text-white" />
        </div>
        {error ? (
          <>
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={() => router.push('/login')} className="text-indigo-400 hover:text-indigo-300">
              Back to Login
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Verifying your account...</span>
          </div>
        )}
      </div>
    </div>
  )
}
