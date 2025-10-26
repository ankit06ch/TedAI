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
  return (
    <section className="card sentiment">
      <div className="card-head"><h3>Sentiment Analysis</h3></div>
      <div className="sentiment-body">
        {segments.length > 0 ? (
          <div className="sentiment-segments">
            {segments.map((segment) => (
              <div key={segment.id} className="sentiment-segment">
                <div className="sentiment-header">
                  <span className="sentiment-timestamp">{segment.timestamp}</span>
                </div>
                <div className={`sentiment-content ${segment.sentiment}`}>
                  <div className="sentiment-label">{segment.sentiment}</div>
                  <div className="sentiment-bar">
                    <div className={`sentiment-fill ${segment.sentiment}`}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
