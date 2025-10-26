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

app.post('/api/generate-adhd-insights', async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(400).json({ error: 'Gemini API key not configured' })
    }

    const { context } = req.body || {}
    
    // Generate varied contexts with specific details for different insights
    const ages = [6, 7, 8, 9, 10, 11, 12]
    const settings = ['therapy session', 'assessment session', 'counseling session', 'behavioral observation', 'therapeutic session', 'evaluation session', 'intervention session']
    const behaviors = [
      'restlessness and constant movement', 'difficulty following multi-step instructions', 'frequent topic changes and tangential speech',
      'hyperactive behavior and interrupting others', 'struggling to maintain attention on structured activities', 'fidgeting and difficulty waiting turns',
      'rapid mood changes and emotional sensitivity', 'impulsivity and difficulty organizing thoughts', 'challenges with emotional regulation',
      'excessive talking and difficulty sitting still', 'problems with task completion and focus', 'distractibility and difficulty with transitions',
      'challenges in social interactions', 'hyperactivity and difficulty following instructions', 'emotional sensitivity and frustration',
      'impulsivity and difficulty with time management', 'challenges in peer relationships', 'difficulty with self-control and boundaries'
    ]
    const environments = ['classroom setting', 'play therapy room', 'assessment office', 'group therapy session', 'one-on-one counseling', 'family therapy session', 'behavioral observation room', 'therapeutic play area']
    
    const randomAge = ages[Math.floor(Math.random() * ages.length)]
    const randomSetting = settings[Math.floor(Math.random() * settings.length)]
    const randomBehavior1 = behaviors[Math.floor(Math.random() * behaviors.length)]
    const randomBehavior2 = behaviors[Math.floor(Math.random() * behaviors.length)]
    const randomBehavior3 = behaviors[Math.floor(Math.random() * behaviors.length)]
    const randomEnvironment = environments[Math.floor(Math.random() * environments.length)]
    
    const dynamicContext = `${randomSetting} with ${randomAge}-year-old child in ${randomEnvironment}. Child exhibits ${randomBehavior1}, ${randomBehavior2}, and ${randomBehavior3} during the interaction.`
    const adhdContext = context || dynamicContext

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            { 
              text: `You are a neurologist analyzing a session with an ADHD child. Generate COMPLETELY UNIQUE and HIGHLY SPECIFIC insights based on the exact context provided. Each insight must be different from typical ADHD observations and tailored specifically to this child's unique presentation.

Context: ${adhdContext}

CRITICAL REQUIREMENTS:
- Generate insights that are SPECIFIC to this exact child, age, setting, and behaviors described
- Avoid generic ADHD observations - make each point unique to this scenario
- Use specific details from the context (age, setting, behaviors) in your insights
- Each insight should reflect the particular combination of factors in this session

Please provide detailed insights in the following format:
1. Key Behavioral Observations (2-3 specific behaviors noted for THIS particular child in THIS specific context)
2. Attention Patterns (focus, distractibility, engagement levels specific to THIS session and environment)
3. Recommendations (immediate strategies and long-term approaches tailored to THIS child's specific needs and situation)

Format as a JSON object with these exact keys: behavioralObservations, attentionPatterns, recommendations. Each should be an array of 2-3 specific points that are unique to this exact scenario.` 
            }
          ]
        }
      ]
    }

    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!resp.ok) throw new Error('Gemini error: ' + resp.status)
    const data = await resp.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    let insights
    try {
      insights = JSON.parse(text)
    } catch {
      // Fallback if JSON parsing fails - generate dynamic fallback data based on context
      const age = adhdContext.match(/(\d+)-year-old/)?.[1] || '8'
      const setting = adhdContext.match(/(\w+ session)/)?.[1] || 'therapy session'
      
      insights = {
        behavioralObservations: [
          `Child shows age-appropriate ${age}-year-old behaviors with ADHD characteristics`,
          `Specific behavioral patterns observed in ${setting}`,
          `Unique presentation combining multiple ADHD symptoms`
        ],
        attentionPatterns: [
          `Attention span varies based on ${setting} environment`,
          `Distractibility patterns specific to ${age}-year-old development`,
          `Engagement levels fluctuate throughout the session`
        ],
        recommendations: [
          `Age-specific strategies for ${age}-year-old child`,
          `Environment-appropriate interventions for ${setting}`,
          `Individualized approach based on observed behaviors`
        ]
      }
    }

    res.json(insights)
  } catch (err) {
    console.error('ADHD insights generation failed:', err)
    res.status(500).json({ error: 'Failed to generate insights' })
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
  const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
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


