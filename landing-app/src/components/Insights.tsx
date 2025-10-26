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
  activeBrainWave?: 'alpha' | 'beta' | 'gamma'
}

export default function Insights({ segments = [], activeBrainWave }: Props): React.JSX.Element {
  const [adhdInsights, setAdhdInsights] = useState<ADHDInsights | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Band-specific insights based on brain wave frequency
  const bandInsights = {
    gamma: {
      behavioralObservations: [
        'Intense mental activity',
        'Occasional cognitive overload',
        'Periods of hyperfocus'
      ],
      attentionPatterns: [
        'Sharp bursts of focus',
        'Difficulty sustaining calm',
        'Rapid attentional shifts'
      ],
      recommendations: [
        'Use mindfulness breaks',
        'Provide structured tasks',
        'Limit overstimulating input'
      ]
    },
    beta: {
      behavioralObservations: [
        'Restlessness and fidgeting',
        'Talkative during tasks',
        'Signs of hyperarousal'
      ],
      attentionPatterns: [
        'Alert but scattered focus',
        'Impulsive task switching',
        'Difficulty winding down'
      ],
      recommendations: [
        'Add brief movement breaks',
        'Encourage relaxation routines',
        'Use calming background sounds'
      ]
    },
    alpha: {
      behavioralObservations: [
        'Trouble relaxing mind',
        'Inconsistent rest patterns',
        'Reduced calm states'
      ],
      attentionPatterns: [
        'Poor sustained attention',
        'Easily distracted at rest',
        'Struggles with quiet focus'
      ],
      recommendations: [
        'Schedule downtime periods',
        'Practice deep breathing',
        'Reinforce calm transitions'
      ]
    }
  }

  const generateInsights = async () => {
    if (!activeBrainWave) {
      setError('Please classify the conversation first to determine the brain wave pattern.')
      return
    }
    
    setIsGenerating(true)
    setError(null)
    
    try {
      // Add 4 second delay
      await new Promise(resolve => setTimeout(resolve, 4000))
      
      // Get the current band's insights
      const currentBand = bandInsights[activeBrainWave]
      
      // Randomly pick 2 from each category (already limited to 2 items per category)
      const shuffledBehavioral = [...currentBand.behavioralObservations].sort(() => 0.5 - Math.random())
      const shuffledAttention = [...currentBand.attentionPatterns].sort(() => 0.5 - Math.random())
      const shuffledRecommendations = [...currentBand.recommendations].sort(() => 0.5 - Math.random())

      const insights: ADHDInsights = {
        behavioralObservations: shuffledBehavioral.slice(0, 2),
        attentionPatterns: shuffledAttention.slice(0, 2),
        recommendations: shuffledRecommendations.slice(0, 2)
      }
      
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
          <span className="role-badge">{activeBrainWave ? `${activeBrainWave.toUpperCase()} Band` : 'No Band Selected'}</span>
          <button 
            className="generate-btn" 
            onClick={generateInsights}
            disabled={isGenerating || !activeBrainWave}
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
            <small>Click Generate to create specific insights</small>
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
