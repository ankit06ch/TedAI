import React, { useState } from 'react'

type InsightSegment = {
  id: number
  timestamp: string
  insight: string
}

type ADHDInsights = {
  behavioralObservations: string[]
  attentionPatterns: string[]
  recommendations: string[]
}

type Props = {
  segments?: InsightSegment[]
}

export default function Insights({ segments = [] }: Props): React.JSX.Element {
  const [adhdInsights, setAdhdInsights] = useState<ADHDInsights | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateInsights = async () => {
    setIsGenerating(true)
    setError(null)
    
    try {
      const response = await fetch('/api/generate-adhd-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: 'Pediatric session with 8-year-old child showing signs of ADHD including difficulty focusing, hyperactivity, and impulsivity during conversation. Child exhibits restlessness, interrupts frequently, and has difficulty maintaining attention on tasks.'
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate insights')
      }
      
      const insights = await response.json()
      setAdhdInsights(insights)
    } catch (err) {
      setError('Failed to generate insights. Please try again.')
      console.error('Error generating insights:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <section className="card insights">
      <div className="card-head duo">
        <h3>Insights</h3>
        <div className="insights-header">
          <span className="role-badge">Powered by AI</span>
          <button 
            className="generate-btn" 
            onClick={generateInsights}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>
      <div className="insights-body">
        {adhdInsights ? (
          <div className="adhd-insights">
            <div className="insight-section">
              <h4>Behavioral Observations</h4>
              <ul>
                {adhdInsights.behavioralObservations.map((obs, idx) => (
                  <li key={idx}>{obs}</li>
                ))}
              </ul>
            </div>
            <div className="insight-section">
              <h4>Attention Patterns</h4>
              <ul>
                {adhdInsights.attentionPatterns.map((pattern, idx) => (
                  <li key={idx}>{pattern}</li>
                ))}
              </ul>
            </div>
            <div className="insight-section">
              <h4>Recommendations</h4>
              <ul>
                {adhdInsights.recommendations.map((rec, idx) => (
                  <li key={idx}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : segments.length > 0 ? (
          <div className="insights-segments">
            {segments.map((segment) => (
              <div key={segment.id} className="insight-segment">
                <div className="insight-header">
                  <span className="insight-timestamp">{segment.timestamp}</span>
                </div>
                <div className="insight-content">{segment.insight}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="insights-empty">
            <p>No insights available</p>
            <small>Click Generate to create ADHD-specific insights</small>
          </div>
        )}
        {error && (
          <div className="insights-error">
            <p>{error}</p>
          </div>
        )}
      </div>
    </section>
  )
}
