import React from 'react'

type TranscriptSegment = {
  id: number
  text: string
  timestamp: string
  sentiment: string
  insight: string
}

type Props = {
  segments?: TranscriptSegment[]
}

export default function RecordedTranscript({ segments = [] }: Props): React.JSX.Element {
  return (
    <aside className="card rt-panel">
      <div className="card-head"><h3>Recorded Transcript</h3></div>
      <div className="rt-body">
        {segments.length > 0 ? (
          <div className="transcript-segments">
            {segments.map((segment) => (
              <div key={segment.id} className="transcript-segment">
                <div className="segment-header">
                  <span className="timestamp">{segment.timestamp}</span>
                  <span className={`sentiment-indicator ${segment.sentiment}`}>
                    {segment.sentiment}
                  </span>
                </div>
                <div className="segment-text">{segment.text}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="transcript-empty">
            <p>No transcript available</p>
            <small>Start recording to see transcript segments</small>
          </div>
        )}
      </div>
    </aside>
  )
}
