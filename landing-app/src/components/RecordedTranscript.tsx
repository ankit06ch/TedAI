import React, { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Trash2 } from 'lucide-react'

// TypeScript declarations for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

type TranscriptSegment = {
  id: number
  text: string
  timestamp: string
  sentiment: string
  insight: string
}

type Props = {
  segments?: TranscriptSegment[]
  onRecordingChange?: (isRecording: boolean) => void
  onSpeechDetected?: () => void
}

export default function RecordedTranscript({ segments = [], onRecordingChange, onSpeechDetected }: Props): React.JSX.Element {
  const [isRecording, setIsRecording] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>(segments)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        setCurrentTranscript(interimTranscript)

        if (finalTranscript) {
          const newSegment: TranscriptSegment = {
            id: Date.now(),
            text: finalTranscript.trim(),
            timestamp: new Date().toLocaleTimeString(),
            sentiment: 'neutral', // You could integrate sentiment analysis here
            insight: 'Voice input detected'
          }
          setTranscriptSegments(prev => [...prev, newSegment])
          setCurrentTranscript('')
          onSpeechDetected?.() // Trigger brain fluctuation
        }
      }

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsRecording(false)
        onRecordingChange?.(false)
      }

      recognitionRef.current.onend = () => {
        setIsRecording(false)
        onRecordingChange?.(false)
      }
    }
  }, [])

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported in this browser')
      return
    }

    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
      onRecordingChange?.(false)
    } else {
      recognitionRef.current.start()
      setIsRecording(true)
      onRecordingChange?.(true)
    }
  }

  const clearTranscript = () => {
    setTranscriptSegments([])
    setCurrentTranscript('')
  }

  return (
    <aside className="card rt-panel">
      <div className="card-head">
        <h3>Recorded Transcript</h3>
        <div className="transcript-actions">
          <button 
            className={`mic-btn ${isRecording ? 'recording' : ''}`}
            onClick={toggleRecording}
            title={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button 
            className="clear-btn"
            onClick={clearTranscript}
            title="Clear transcript"
            disabled={transcriptSegments.length === 0 && !currentTranscript}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      <div className="rt-body">
        {transcriptSegments.length > 0 ? (
          <div className="transcript-segments">
            {transcriptSegments.map((segment) => (
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
            {currentTranscript && (
              <div className="transcript-segment interim">
                <div className="segment-header">
                  <span className="timestamp">Speaking...</span>
                  <span className="sentiment-indicator interim">Live</span>
                </div>
                <div className="segment-text interim">{currentTranscript}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="transcript-empty">
            <p>No transcript available</p>
            <small>Click the microphone to start recording</small>
          </div>
        )}
      </div>
    </aside>
  )
}
