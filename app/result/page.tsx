'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface ActivityRecord {
  id: string
  ai_summary: string
  ai_issues: string
  ai_next_action: string
  activity_text: string
}

function ResultPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const recordId = searchParams.get('recordId')

  const [record, setRecord] = useState<ActivityRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(true)

  useEffect(() => {
    if (!recordId) {
      router.push('/deals')
      return
    }
    loadAndProcessRecord()
  }, [recordId, router])

  const loadAndProcessRecord = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_records')
        .select('*')
        .eq('id', recordId)
        .single()

      if (error) throw error
      setRecord(data)

      if (!data.ai_summary) {
        await callGeminiAPI(data)
      } else {
        setProcessing(false)
      }
    } catch (err) {
      alert('データ読み込みに失敗しました')
      router.push('/deals')
    } finally {
      setLoading(false)
    }
  }

  const callGeminiAPI = async (record: ActivityRecord) => {
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityText: record.activity_text }),
      })

      const result = await response.json()

      const { error: updateError } = await supabase
        .from('activity_records')
        .update({
          ai_summary: result.summary,
          ai_issues: result.issues,
          ai_next_action: result.nextAction,
        })
        .eq('id', recordId)

      if (updateError) throw updateError

      setRecord({
        ...record,
        ai_summary: result.summary,
        ai_issues: result.issues,
        ai_next_action: result.nextAction,
      })
    } catch (err) {
      alert('AI処理に失敗しました')
    } finally {
      setProcessing(false)
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
          <h1 className="text-2xl font-bold">AI分析結果</h1>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6">
          {processing ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin">⏳</div>
              <p className="mt-4 text-gray-600">Gemini AIが分析中...</p>
            </div>
          ) : record ? (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 border-l-4 border-green-600 rounded">
                <h2 className="font-semibold text-green-800">✅ 分析完了</h2>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">📝 要約</h3>
                <div className="p-4 bg-gray-50 rounded border border-gray-200">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {record.ai_summary}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">⚠️ 課題・懸念点</h3>
                <div className="p-4 bg-yellow-50 rounded border border-yellow-200">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {record.ai_issues}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">
                  🎯 推奨ネクストアクション
                </h3>
                <div className="p-4 bg-blue-50 rounded border border-blue-200">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {record.ai_next_action}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => router.push('/deals')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition"
                >
                  次の記録を入力
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 rounded-lg transition"
                >
                  印刷
                </button>
              </div>
            </div>
          ) : (
            <p>データが見つかりません</p>
          )}
        </div>
      </main>
    </div>
  )
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>読み込み中...</p></div>}>
      <ResultPageContent />
    </Suspense>
  )
}
