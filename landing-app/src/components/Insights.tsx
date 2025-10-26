import React from 'react'

type InsightSegment = {
  id: number
  timestamp: string
  insight: string
}

type Props = {
  segments?: InsightSegment[]
}

export default function Insights({ segments = [] }: Props): React.JSX.Element {
  return (
    <section className="card insights">
      <div className="card-head duo">
        <h3>Insights</h3>
        <span className="role-badge">Powered by AI</span>
      </div>
      <div className="insights-body">
        {segments.length > 0 ? (
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
            <small>AI analysis will appear here during recording</small>
          </div>
        )}
      </div>
    </section>
  )
}
