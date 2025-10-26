/// <reference types="vite/client" />

export type BrainWaveType = 'alpha' | 'beta' | 'gamma'

export interface ConversationClassification {
  brainWave: BrainWaveType
  confidence: number
  reasoning: string
}

export type SentimentType = 'positive' | 'negative' | 'neutral'

export interface SentimentAnalysis {
  sentiment: SentimentType
  confidence: number
  reasoning: string
}

export async function classifyConversation(transcriptText: string): Promise<ConversationClassification> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  
  if (!apiKey) {
    throw new Error('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your .env file.')
  }

  const prompt = `
Analyze the following conversation transcript and classify it into one of three brain wave patterns:

ALPHA (8-12 Hz): Relaxed, calm, meditative states, creative thinking, daydreaming, light meditation
BETA (13-30 Hz): Active concentration, focused attention, problem-solving, alertness, active thinking
GAMMA (30-100 Hz): High-level cognitive processing, insight, peak performance, intense focus, complex problem solving

Transcript: "${transcriptText}"

Respond with ONLY a JSON object in this exact format:
{
  "brainWave": "alpha|beta|gamma",
  "confidence": 0.85,
  "reasoning": "Brief explanation of why this classification was chosen"
}

Consider the following factors:
- Energy level and intensity of the conversation
- Type of cognitive activity (creative, analytical, focused, relaxed)
- Emotional tone and engagement level
- Complexity of topics discussed
- Attention and focus patterns
`

  try {
    // Add a longer delay to make classification feel more realistic
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 200,
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API')
    }

    const responseText = data.candidates[0].content.parts[0].text.trim()
    
    // Extract JSON from response (in case there's extra text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No valid JSON found in Gemini response')
    }

    const classification = JSON.parse(jsonMatch[0])
    
    // Validate the response format
    if (!['alpha', 'beta', 'gamma'].includes(classification.brainWave)) {
      throw new Error(`Invalid brain wave type: ${classification.brainWave}`)
    }

    if (typeof classification.confidence !== 'number' || classification.confidence < 0 || classification.confidence > 1) {
      throw new Error(`Invalid confidence value: ${classification.confidence}`)
    }

    return {
      brainWave: classification.brainWave as BrainWaveType,
      confidence: classification.confidence,
      reasoning: classification.reasoning || 'No reasoning provided'
    }

  } catch (error) {
    console.error('Error classifying conversation with Gemini:', error)
    
    // Fallback to a simple heuristic if API fails
    const wordCount = transcriptText.split(' ').length
    const hasQuestionMarks = transcriptText.includes('?')
    const hasExclamationMarks = transcriptText.includes('!')
    
    // Simple heuristic: longer conversations with questions = beta, short calm = alpha, intense = gamma
    if (wordCount > 100 && hasQuestionMarks) {
      return {
        brainWave: 'beta',
        confidence: 0.6,
        reasoning: 'Fallback classification: Active conversation with questions detected'
      }
    } else if (wordCount < 50 && !hasExclamationMarks) {
      return {
        brainWave: 'alpha',
        confidence: 0.6,
        reasoning: 'Fallback classification: Short, calm conversation detected'
      }
    } else {
      return {
        brainWave: 'gamma',
        confidence: 0.6,
        reasoning: 'Fallback classification: Intense or complex conversation detected'
      }
    }
  }
}

export async function analyzeSentiment(text: string): Promise<SentimentAnalysis> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  
  if (!apiKey) {
    throw new Error('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your .env file.')
  }

  const prompt = `
Analyze the sentiment of the following text segment and classify it as positive, negative, or neutral:

Text: "${text}"

Consider the following factors:
- Emotional tone and language used
- Positive or negative words and phrases
- Overall emotional context
- Subtle emotional indicators

Respond with ONLY a JSON object in this exact format:
{
  "sentiment": "positive|negative|neutral",
  "confidence": 0.85,
  "reasoning": "Brief explanation of why this sentiment was chosen"
}

Guidelines:
- POSITIVE: Happy, excited, optimistic, satisfied, grateful, enthusiastic, confident
- NEGATIVE: Sad, angry, frustrated, disappointed, worried, anxious, critical
- NEUTRAL: Factual, informational, balanced, neither clearly positive nor negative
`

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 150,
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API')
    }

    const responseText = data.candidates[0].content.parts[0].text.trim()
    
    // Extract JSON from response (in case there's extra text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No valid JSON found in Gemini response')
    }

    const analysis = JSON.parse(jsonMatch[0])
    
    // Validate the response format
    if (!['positive', 'negative', 'neutral'].includes(analysis.sentiment)) {
      throw new Error(`Invalid sentiment type: ${analysis.sentiment}`)
    }

    if (typeof analysis.confidence !== 'number' || analysis.confidence < 0 || analysis.confidence > 1) {
      throw new Error(`Invalid confidence value: ${analysis.confidence}`)
    }

    return {
      sentiment: analysis.sentiment as SentimentType,
      confidence: analysis.confidence,
      reasoning: analysis.reasoning || 'No reasoning provided'
    }

  } catch (error) {
    console.error('Error analyzing sentiment with Gemini:', error)
    
    // Fallback to a simple heuristic if API fails
    const lowerText = text.toLowerCase()
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'happy', 'love', 'like', 'enjoy', 'pleased', 'satisfied', 'excited', 'optimistic', 'confident', 'successful']
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'angry', 'sad', 'frustrated', 'disappointed', 'worried', 'anxious', 'concerned', 'problem', 'issue', 'difficult']
    
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length
    
    if (positiveCount > negativeCount) {
      return {
        sentiment: 'positive',
        confidence: 0.6,
        reasoning: 'Fallback analysis: More positive words detected'
      }
    } else if (negativeCount > positiveCount) {
      return {
        sentiment: 'negative',
        confidence: 0.6,
        reasoning: 'Fallback analysis: More negative words detected'
      }
    } else {
      return {
        sentiment: 'neutral',
        confidence: 0.6,
        reasoning: 'Fallback analysis: Balanced or neutral language detected'
      }
    }
  }
}
