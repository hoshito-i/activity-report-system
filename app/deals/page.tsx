'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Deal {
  id: string
  title: string
  stage: string
  amount: number
}

export default function DealsPage() {
  const router = useRouter()
  const [deals, setDeals] = useState<Deal[]>([])
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showNewDealForm, setShowNewDealForm] = useState(false)
  const [newDeal, setNewDeal] = useState({
    title: '',
    stage: '初回提案',
    amount: '',
  })

  useEffect(() => {
    loadDeals()
  }, [])

  const loadDeals = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDeals(data || [])
      setFilteredDeals(data || [])
    } catch (err) {
      alert('データ読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const filtered = deals.filter((deal) =>
      deal.title.toLowerCase().includes(search.toLowerCase())
    )
    setFilteredDeals(filtered)
  }, [search, deals])

  const handleSelectDeal = (deal: Deal) => {
    router.push(`/activity-records?dealId=${deal.id}`)
  }

  const handleAddNewDeal = async () => {
    if (!newDeal.title.trim()) {
      alert('商談名を入力してください')
      return
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('deals')
        .insert([
          {
            user_id: user.id,
            title: newDeal.title,
            stage: newDeal.stage,
            amount: parseInt(newDeal.amount) || 0,
          },
        ])
        .select()

      if (error) throw error

      const createdDeal = data[0]
      setNewDeal({ title: '', stage: '初回提案', amount: '' })
      setShowNewDealForm(false)
      await loadDeals()
      handleSelectDeal(createdDeal)
    } catch (err) {
      alert('商談追加に失敗しました')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
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
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">営業日報システム</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
          >
            ログアウト
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">商談を選択</h2>

          <div className="mb-6">
            <input
              type="text"
              placeholder="商談名で検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {filteredDeals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">商談がありません</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition"
                  onClick={() => handleSelectDeal(deal)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{deal.title}</h3>
                      <p className="text-sm text-gray-600">
                        ステージ: {deal.stage} | 金額: {deal.amount}万円
                      </p>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm">
                      選択
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showNewDealForm ? (
            <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h3 className="font-semibold mb-4">新規商談を追加</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    商談名
                  </label>
                  <input
                    type="text"
                    value={newDeal.title}
                    onChange={(e) =>
                      setNewDeal({ ...newDeal, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    ステージ
                  </label>
                  <select
                    value={newDeal.stage}
                    onChange={(e) =>
                      setNewDeal({ ...newDeal, stage: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    <option>初回提案</option>
                    <option>2回目以降提案</option>
                    <option>クロージング</option>
                    <option>契約書確認</option>
                    <option>受注</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    予想金額（万円）
                  </label>
                  <input
                    type="number"
                    value={newDeal.amount}
                    onChange={(e) =>
                      setNewDeal({ ...newDeal, amount: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddNewDeal}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded"
                  >
                    追加
                  </button>
                  <button
                    onClick={() => setShowNewDealForm(false)}
                    className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-2 rounded"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewDealForm(true)}
              className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium"
            >
              + 新規商談を追加
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
