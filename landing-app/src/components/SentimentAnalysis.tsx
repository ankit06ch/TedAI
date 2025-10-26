import React from 'react'

type SentimentSegment = {
  id: number
  timestamp: string
  sentiment: string
}

type Props = {
  segments?: SentimentSegment[]
}

export default function SentimentAnalysis({ segments = [] }: Props): React.JSX.Element {
  // Calculate overall sentiment score
  const calculateSentimentScore = () => {
    if (segments.length === 0) return null
    
    let positiveCount = 0
    let negativeCount = 0
    let neutralCount = 0
    
    segments.forEach(segment => {
      if (segment.sentiment === 'positive') positiveCount++
      else if (segment.sentiment === 'negative') negativeCount++
      else neutralCount++
    })
    
    // Score ranges from -100 (all negative) to +100 (all positive)
    const total = segments.length
    const score = ((positiveCount - negativeCount) / total) * 100
    
    return {
      score: Math.round(score),
      positive: positiveCount,
      negative: negativeCount,
      neutral: neutralCount,
      total
    }
  }

  const sentimentData = calculateSentimentScore()

  const getSentimentColor = (score: number) => {
    if (score >= 40) return '#22c55e' // green
    if (score >= 10) return '#84cc16' // lime green
    if (score >= -10) return '#eab308' // yellow
    if (score >= -40) return '#f97316' // orange
    return '#ef4444' // red
  }

  const getSentimentDescription = (score: number) => {
    if (score >= 60) return 'Very Positive — The conversation shows strong positive sentiment'
    if (score >= 40) return 'Positive — The conversation trends positively'
    if (score >= 10) return 'Mildly Positive — Slightly optimistic tone detected'
    if (score >= -10) return 'Neutral — Balanced emotional tone'
    if (score >= -40) return 'Mildly Negative — Some concerns or negativity present'
    if (score >= -60) return 'Negative — The conversation shows negative sentiment'
    return 'Very Negative — Strongly negative emotional tone detected'
  }

  return (
    <section className="card sentiment">
      <div className="card-head"><h3>Sentiment Analysis</h3></div>
      <div className="sentiment-body">
        {segments.length > 0 && sentimentData ? (
          <>
            {/* Overall Sentiment Score */}
            <div className="sentiment-summary">
              <div className="sentiment-score-display">
                <div 
                  className="sentiment-score-circle"
                  style={{ borderColor: getSentimentColor(sentimentData.score) }}
                >
                  <span className="sentiment-score-value">{sentimentData.score}</span>
                </div>
                <div className="sentiment-score-info">
                  <div className="sentiment-score-label">Overall Sentiment</div>
                  <div className="sentiment-score-description">
                    {getSentimentDescription(sentimentData.score)}
                  </div>
                </div>
              </div>
              
              {/* Breakdown */}
              <div className="sentiment-breakdown">
                <div className="breakdown-item positive">
                  <span className="breakdown-count">{sentimentData.positive}</span>
                  <span className="breakdown-label">Positive</span>
                </div>
                <div className="breakdown-item neutral">
                  <span className="breakdown-count">{sentimentData.neutral}</span>
                  <span className="breakdown-label">Neutral</span>
                </div>
                <div className="breakdown-item negative">
                  <span className="breakdown-count">{sentimentData.negative}</span>
                  <span className="breakdown-label">Negative</span>
                </div>
              </div>
            </div>


          </>
        ) : (
          <div className="sentiment-empty">
            <p>No sentiment data</p>
            <small>Sentiment analysis will appear here during recording</small>
          </div>
        )}
      </div>
    </section>
  )
}
