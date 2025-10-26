import React, { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Trash2, Save, FolderOpen, Search } from 'lucide-react'
import { saveTranscript, deleteTranscript, getTranscript, TranscriptMeta, generateTranscriptTitle } from '../firebase/transcripts'
import { classifyConversation, analyzeSentiment } from '../services/gemini'

// TypeScript declarations for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
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
  userId?: string | null
  transcripts?: TranscriptMeta[]
  segments?: TranscriptSegment[]
  onRecordingChange?: (isRecording: boolean) => void
  onSpeechDetected?: () => void
  onTranscriptsChange?: () => void
  onBrainWaveClassified?: (brainWave: 'alpha' | 'beta' | 'gamma', confidence: number) => void
  onClassificationStart?: () => void
  onCanClassifyChange?: (canClassify: boolean) => void
  onClassifyRequest?: () => void
  onSegmentsChange?: (segments: TranscriptSegment[]) => void
}

export default function RecordedTranscript({ 
  userId, 
  transcripts = [], 
  segments = [], 
  onRecordingChange, 
  onSpeechDetected, 
  onTranscriptsChange,
  onBrainWaveClassified,
  onClassificationStart,
  onCanClassifyChange,
  onClassifyRequest,
  onSegmentsChange
}: Props): React.JSX.Element {
  const [isRecording, setIsRecording] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>(segments)
  const [selectedTranscriptId, setSelectedTranscriptId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isClassifying, setIsClassifying] = useState(false)
  const recognitionRef = useRef<any | null>(null)

  // Clear transcript segments when user changes
  useEffect(() => {
    setTranscriptSegments([])
    setCurrentTranscript('')
    setSelectedTranscriptId(null)
  }, [userId])

  // Notify Dashboard when classification is possible
  useEffect(() => {
    onCanClassifyChange?.(transcriptSegments.length > 0)
  }, [transcriptSegments.length, onCanClassifyChange])

  // Notify Dashboard when segments change
  useEffect(() => {
    onSegmentsChange?.(transcriptSegments)
  }, [transcriptSegments, onSegmentsChange])

  // Expose classify function to parent
  useEffect(() => {
    if (onClassifyRequest) {
      // Store the classify function reference
      (window as any).classifyCurrentConversation = classifyCurrentConversation
    }
  }, [onClassifyRequest])

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event: any) => {
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
          const trimmedText = finalTranscript.trim()
          const newSegment: TranscriptSegment = {
            id: Date.now(),
            text: trimmedText,
            timestamp: new Date().toLocaleTimeString(),
            sentiment: 'neutral', // Will be updated after sentiment analysis
            insight: 'Voice input detected'
          }
          
          // Add segment immediately with neutral sentiment
          setTranscriptSegments(prev => [...prev, newSegment])
          setCurrentTranscript('')
          onSpeechDetected?.() // Trigger brain fluctuation
          
          // Analyze sentiment asynchronously and update the segment
          analyzeSentiment(trimmedText)
            .then(analysis => {
              setTranscriptSegments(prev => 
                prev.map(segment => 
                  segment.id === newSegment.id 
                    ? { ...segment, sentiment: analysis.sentiment, insight: analysis.reasoning }
                    : segment
                )
              )
            })
            .catch(error => {
              console.error('Failed to analyze sentiment:', error)
              // Keep the segment with neutral sentiment if analysis fails
            })
        }
      }

      recognitionRef.current.onerror = (event: any) => {
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
    setSelectedTranscriptId(null)
  }

  const saveCurrentTranscript = async () => {
    if (!userId || transcriptSegments.length === 0) {
      return
    }

    setIsLoading(true)
    try {
      // Delete all existing conversations first
      for (const transcript of transcripts) {
        await deleteTranscript(transcript.id)
      }
      
      // Save the current conversation with a proper title
      const conversationTitle = generateTranscriptTitle(transcriptSegments)
      
      await saveTranscript(userId, transcriptSegments, conversationTitle)
      onTranscriptsChange?.()
    } catch (error) {
      console.error('Failed to save transcript:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadTranscript = async (transcriptId: string) => {
    setIsLoading(true)
    try {
      const transcript = await getTranscript(transcriptId)
      if (transcript) {
        setTranscriptSegments(transcript.segments)
        setSelectedTranscriptId(transcriptId)
        setCurrentTranscript('')
      }
    } catch (error) {
      console.error('Failed to load transcript:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteTranscriptById = async (transcriptId: string) => {

    setIsLoading(true)
    try {
      await deleteTranscript(transcriptId)
      onTranscriptsChange?.()
      
      // If we're currently viewing the deleted transcript, clear it
      if (selectedTranscriptId === transcriptId) {
        setTranscriptSegments([])
        setSelectedTranscriptId(null)
        setCurrentTranscript('')
      }
    } catch (error) {
      console.error('Failed to delete transcript:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const classifyCurrentConversation = async () => {
    if (transcriptSegments.length === 0) {
      return
    }

    setIsClassifying(true)
    onClassificationStart?.()
    
    try {
      const fullTranscriptText = transcriptSegments.map(segment => segment.text).join(' ')
      const classification = await classifyConversation(fullTranscriptText)
      onBrainWaveClassified?.(classification.brainWave, classification.confidence)
      console.log(`Conversation classified as ${classification.brainWave} (confidence: ${classification.confidence})`)
    } catch (classificationError) {
      console.error('Failed to classify conversation:', classificationError)
      onBrainWaveClassified?.('alpha', 0.5) // Reset to default on error with low confidence
    } finally {
      setIsClassifying(false)
    }
  }



  return (
    <aside className="card rt-panel">
      <div className="card-head">
        <h3>Session Transcription</h3>
        <div className="transcript-actions">
          <button 
            className={`mic-btn ${isRecording ? 'recording' : ''}`}
            onClick={toggleRecording}
            title={isRecording ? 'Stop recording' : 'Start recording'}
            disabled={isLoading}
          >
            {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button 
            className="save-btn"
            onClick={saveCurrentTranscript}
            title="Save current conversation"
            disabled={transcriptSegments.length === 0 || !userId || isLoading}
          >
            <Save size={18} />
          </button>
          <button 
            className="clear-btn"
            onClick={clearTranscript}
            title="Clear conversation"
            disabled={transcriptSegments.length === 0 && !currentTranscript || isLoading}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      <div className="rt-body">
        {/* Saved Conversations List */}
        {transcripts.length > 0 && (
          <div className="saved-transcripts">
            <h4>Saved Conversations</h4>
            <div className="transcript-list">
              {transcripts.map((transcript) => (
                <div 
                  key={transcript.id} 
                  className={`transcript-item ${selectedTranscriptId === transcript.id ? 'active' : ''}`}
                >
                  <div className="transcript-info" onClick={() => loadTranscript(transcript.id)}>
                    <div className="transcript-title">{transcript.title}</div>
                    <div className="transcript-meta">
                      <span>{transcript.updatedAt?.toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button 
                    className="delete-transcript-btn"
                    onClick={() => deleteTranscriptById(transcript.id)}
                    title="Delete conversation"
                    disabled={isLoading}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Conversation */}
        {transcriptSegments.length > 0 ? (
          <div className="transcript-segments">
            <h4>Current Conversation</h4>
            {transcriptSegments.map((segment) => (
              <div key={segment.id} className={`transcript-segment ${segment.sentiment}`}>
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
            <p>No conversation recorded</p>
            <small>Click the microphone to start recording</small>
          </div>
        )}
      </div>
    </aside>
  )
}
