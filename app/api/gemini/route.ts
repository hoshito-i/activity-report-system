import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { activityText } = await req.json()

    if (!activityText) {
      return NextResponse.json(
        { error: '活動内容が必要です' },
        { status: 400 }
      )
    }

    // ダミーレスポンス（デモ用）
    const dummyResponse = {
      summary: '本日の活動内容から、重要な課題や見込みが確認できました。顧客の状況を把握し、次のステップに向けた準備が必要です。',
      issues: '• 顧客の予算承認プロセスが不明確\n• システム導入のタイムラインが未定\n• キーパーソンの合意が必須',
      nextAction: '• 詳細な提案資料を作成\n• 次回ミーティングの日程を調整\n• 予算・導入スケジュールの確認',
    }

    return NextResponse.json(dummyResponse)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'AI処理に失敗しました' },
      { status: 500 }
    )
  }
}
