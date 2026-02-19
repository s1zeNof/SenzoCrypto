/**
 * Supabase Edge Function: analyze-token
 * Replaces Firebase Cloud Function analyzeToken
 *
 * Deploy with:
 *   supabase functions deploy analyze-token
 */

import { GoogleGenerativeAI } from 'npm:@google/generative-ai'

const corsHeaders = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
    }

    try {
        const { tokenName, tokenTicker, candleData, userQuestion } = await req.json()

        if (!tokenName || !tokenTicker || !candleData || !userQuestion) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const geminiKey = Deno.env.get('GEMINI_API_KEY')
        if (!geminiKey) {
            return new Response(
                JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const genAI = new GoogleGenerativeAI(geminiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

        const prompt = `
You are a professional crypto trader and analyst. Your task is to analyze market data and provide clear, well-founded answers.
Analyze the token ${tokenName} (${tokenTicker}).
Here is the recent candle data (Open, High, Low, Close): ${JSON.stringify(candleData)}.
The user has asked: '${userQuestion}'.
Provide your analysis, pointing out possible support/resistance levels, FVG, and other key elements on the chart.
`

        const result   = await model.generateContent(prompt)
        const response = await result.response
        const text     = response.text()

        return new Response(
            JSON.stringify({ analysis: text }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        console.error('analyze-token error:', error)
        return new Response(
            JSON.stringify({ error: 'Internal Server Error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
