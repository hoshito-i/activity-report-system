'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Deal {
  id: string
  title: string
  stage: string
  amount: number
}

function ActivityPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dealId = searchParams.get('dealId')

  const [deal, setDeal] = useState<Deal | null>(null)
  const [activityText, setActivityText] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!dealId) {
      router.push('/deals')
      return
    }
    loadDeal()
  }, [dealId, router])

  const loadDeal = async () => {
    try {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('id', dealId)
        .single()

      if (error) throw error
      setDeal(data)
    } catch (err) {
      alert('商談データの読み込みに失敗しました')
      router.push('/deals')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!activityText.trim()) {
      alert('活動内容を入力してください')
      return
    }

    setSubmitting(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error: insertError } = await supabase
        .from('activity_records')
        .insert([
          {
            deal_id: dealId,
            user_id: user.id,
            activity_text: activityText.trim(),
          },
        ])
        .select()

      if (insertError) throw insertError

      const recordId = data[0].id

      router.push(`/result?recordId=${recordId}`)
    } catch (err) {
      alert('送信に失敗しました: ' + (err instanceof Error ? err.message : ''))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <button
            onClick={() => router.push('/deals')}
            className="text-blue-600 hover:text-blue-800 mb-2"
          >
            ← 商談選択に戻る
          </button>
          <h1 className="text-2xl font-bold">活動内容を入力</h1>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6">
          {deal && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h2 className="font-semibold">{deal.title}</h2>
              <p className="text-sm text-gray-600">
                ステージ: {deal.stage} | 金額: {deal.amount}万円
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                活動内容（テキスト）
              </label>
              <textarea
                value={activityText}
                onChange={(e) => setActivityText(e.target.value)}
                placeholder="本日の活動内容を入力してください..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={6}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition"
              >
                {submitting ? 'AI処理中...' : '送信してAI分析を実行'}
              </button>
              <button
                onClick={() => router.push('/deals')}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-medium py-3 rounded-lg transition"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function ActivityPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>読み込み中...</p></div>}>
      <ActivityPageContent />
    </Suspense>
  )
}
