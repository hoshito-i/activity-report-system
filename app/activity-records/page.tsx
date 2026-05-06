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

interface ActivityRecord {
  id: string
  activity_text: string
  ai_summary: string
  ai_issues: string
  ai_next_action: string
  created_at: string
}

function ActivityRecordsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dealId = searchParams.get('dealId')

  const [deal, setDeal] = useState<Deal | null>(null)
  const [records, setRecords] = useState<ActivityRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingStage, setUpdatingStage] = useState(false)

  useEffect(() => {
    if (!dealId) {
      router.push('/deals')
      return
    }
    loadData()
  }, [dealId, router])

  const loadData = async () => {
    try {
      const { data: dealData, error: dealError } = await supabase
        .from('deals')
        .select('*')
        .eq('id', dealId)
        .single()

      if (dealError) throw dealError
      setDeal(dealData)

      const { data: recordsData, error: recordsError } = await supabase
        .from('activity_records')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false })

      if (recordsError) throw recordsError
      setRecords(recordsData || [])
    } catch (err) {
      alert('データ読み込みに失敗しました')
      router.push('/deals')
    } finally {
      setLoading(false)
    }
  }

  const handleStageUpdate = async (newStage: string) => {
    if (!deal) return
    setUpdatingStage(true)
    try {
      const { error } = await supabase
        .from('deals')
        .update({ stage: newStage })
        .eq('id', dealId)

      if (error) throw error
      setDeal({ ...deal, stage: newStage })
    } catch (err) {
      alert('ステージ更新に失敗しました')
    } finally {
      setUpdatingStage(false)
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
          <h1 className="text-2xl font-bold">活動記録一覧</h1>
          {deal && (
            <p className="text-sm text-gray-600 mt-2">
              {deal.title} | ステージ: {deal.stage} | 金額: {deal.amount}万円
            </p>
          )}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6">
          {deal && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-semibold text-lg">{deal.title}</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    金額: {deal.amount}万円
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <label className="text-sm font-medium">ステージ更新</label>
                  <select
                    value={deal.stage}
                    onChange={(e) => handleStageUpdate(e.target.value)}
                    disabled={updatingStage}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <option>初回提案</option>
                    <option>2回目以降提案</option>
                    <option>クロージング</option>
                    <option>契約書確認</option>
                    <option>受注</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <button
              onClick={() => router.push(`/activity?dealId=${dealId}`)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
            >
              + 新しい活動を追加
            </button>
          </div>

          {records.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">活動記録がありません</p>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition"
                  onClick={() => router.push(`/result?recordId=${record.id}`)}
                >
                  <p className="text-sm text-gray-500 mb-4">
                    {new Date(record.created_at).toLocaleString('ja-JP', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>

                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="bg-green-50 p-3 rounded border border-green-200">
                      <h4 className="font-semibold text-green-800 mb-1">要約</h4>
                      <p className="text-green-700 line-clamp-2">
                        {record.ai_summary}
                      </p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                      <h4 className="font-semibold text-yellow-800 mb-1">課題</h4>
                      <p className="text-yellow-700 line-clamp-2">
                        {record.ai_issues}
                      </p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-1">
                        ネクストアクション
                      </h4>
                      <p className="text-blue-700 line-clamp-2">
                        {record.ai_next_action}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 text-right">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      詳細を見る →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default function ActivityRecordsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>読み込み中...</p></div>}>
      <ActivityRecordsContent />
    </Suspense>
  )
}
