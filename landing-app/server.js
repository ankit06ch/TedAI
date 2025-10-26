/* eslint-disable */
import 'dotenv/config'
import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

// In production, set FETCHAI_API_KEY in environment
const FETCHAI_API_KEY = process.env.FETCHAI_API_KEY || ''
const FETCHAI_AGENT_URL = process.env.FETCHAI_AGENT_URL || ''
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''

// Placeholder analyzer calling Fetch.ai Agent (stubbed; replace with real endpoint)
async function analyzeWithFetchAI(transcript) {
  if (!FETCHAI_API_KEY) throw new Error('Missing FETCHAI_API_KEY')

  if (FETCHAI_AGENT_URL) {
    // Attempt real call to Fetch.ai/Agentverse-compatible endpoint
    const resp = await fetch(FETCHAI_AGENT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FETCHAI_API_KEY}`,
      },
      body: JSON.stringify({ transcript }),
    })
    if (!resp.ok) {
      throw new Error(`Fetch.ai request failed: ${resp.status}`)
    }
    const data = await resp.json()
    // Try to map common shapes -> { summary, isOnTrack, topic }
    const summary = data.summary || data.title || 'No content'
    const isOnTrack = typeof data.isOnTrack === 'boolean' ? data.isOnTrack : true
    const topic = data.topic || data.label || (isOnTrack ? 'Main topic' : 'Side topic')
    return { summary, isOnTrack, topic }
  }

  // Fallback heuristic if no agent URL configured
  const lower = transcript.toLowerCase()
  const isOnTrack = !/(but|however|anyway|side|off|tangent)/.test(lower)
  const summary = transcript
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .join(' ') || 'No content'
  return { summary, isOnTrack, topic: isOnTrack ? 'Main topic' : 'Side topic' }
}

app.post('/api/analyze-chunk', async (req, res) => {
  try {
    const { transcript, previousSummary } = req.body || {}
    if (typeof transcript !== 'string' || !transcript.trim()) {
      return res.status(400).json({ error: 'Invalid transcript' })
    }
    let result
    try {
      if (GEMINI_API_KEY) {
        result = await analyzeWithGemini(transcript, previousSummary)
      } else {
        result = await analyzeWithFetchAI(transcript)
      }
    } catch (e) {
      // fallback to Fetch if Gemini fails
      result = await analyzeWithFetchAI(transcript)
    }
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'Analysis failed' })
  }
})

const port = process.env.PORT || 5174
app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`)
})

async function analyzeWithGemini(transcript, previousSummary) {
  if (!GEMINI_API_KEY) throw new Error('Missing GEMINI_API_KEY')
  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          { text: `You are classifying and summarizing a conversation. Previous summary: ${previousSummary || '(none)'}\nTranscript chunk (15s): ${transcript}\nReturn JSON with keys: summary (3-4 words), isOnTrack (boolean), topic (short).` }
        ]
      }
    ]
  }
  const resp = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + GEMINI_API_KEY, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!resp.ok) throw new Error('Gemini error: ' + resp.status)
  const data = await resp.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
  let summary = 'No content'
  let isOnTrack = true
  let topic = 'Main topic'
  try {
    const parsed = JSON.parse(text)
    summary = parsed.summary || summary
    isOnTrack = typeof parsed.isOnTrack === 'boolean' ? parsed.isOnTrack : isOnTrack
    topic = parsed.topic || topic
  } catch {
    // If model responded in prose, derive a fallback
    summary = transcript.split(/\s+/).slice(0, 4).join(' ') || summary
  }
  return { summary, isOnTrack, topic }
}


