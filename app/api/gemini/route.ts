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

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' })

    const prompt = `営業活動内容から、以下の3つを日本語で分析してください。各項目は箇条書きで、簡潔に記載してください。

【営業活動内容】
${activityText}

【出力形式】
以下のJSON形式で返してください：
{
  "summary": "活動内容の要約（2-3文）",
  "issues": "課題や懸念点（箇条書き）",
  "nextAction": "推奨されるネクストアクション（箇条書き）"
}

注意：JSONのみを返してください。説明は不要です。`

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    // JSONパースを試みる
    let parsedResponse
    try {
      // マークダウンのコードブロック削除
      const jsonStr = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      parsedResponse = JSON.parse(jsonStr)
    } catch {
      // パース失敗時は構造化
      parsedResponse = {
        summary: responseText.split('\n')[0] || responseText,
        issues: '分析中にエラーが発生しました',
        nextAction: 'もう一度試してください',
      }
    }

    return NextResponse.json({
      summary: parsedResponse.summary || '',
      issues: parsedResponse.issues || '',
      nextAction: parsedResponse.nextAction || '',
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'AI処理に失敗しました' },
      { status: 500 }
    )
  }
}
