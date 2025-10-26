import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Mic } from 'lucide-react'
import { appendNode, createConversation, finalizeConversation, getConversationNodes } from './firebase/conversations'

type GraphNode = {
  id: string
  label: string
  branchLevel: number // 0 = main vertical, 1+ = branches to the right
}

type Direction = 'down' | 'branch'

function generateId(): string {
  return Math.random().toString(36).slice(2, 9)
}

function simpleSummarize(text: string): string {
  const words = text
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
  const summary = words.slice(0, 4).join(' ')
  return summary || 'No content'
}

function simpleClassifyDirection(text: string): Direction {
  const t = text.toLowerCase()
  const sidewaysHints = ['but', 'however', 'wait', 'side', 'off', 'tangent', 'anyway']
  return sidewaysHints.some((h) => t.includes(h)) ? 'branch' : 'down'
}

// Very small heuristic for emotional salience; higher absolute score => stronger emphasis
function scoreWord(raw: string): number {
  const w = raw.toLowerCase()
  const positive = new Set([
    'love', 'lovely', 'amazing', 'great', 'happy', 'excited', 'wonderful', 'awesome', 'fantastic', 'beautiful',
    'incredible', 'brilliant', 'yes', 'yay', 'win', 'success', 'excellent', 'perfect', 'joy', 'joyful', 'delight'
  ])
  const negative = new Set([
    'hate', 'terrible', 'bad', 'sad', 'angry', 'frustrated', 'awful', 'horrible', 'annoying', 'no', 'pain', 'ugh',
    'disaster', 'broken', 'worst', 'fail', 'failure', 'angst'
  ])
  const intensifiers = new Set(['very', 'really', 'super', 'extremely', 'so', 'too'])

  let score = 0
  if (positive.has(w)) score += 2
  if (negative.has(w)) score -= 2
  if (intensifiers.has(w)) score += 1
  if (raw === raw.toUpperCase() && raw.length >= 3) score += Math.sign(score || 1) // shouting
  return Math.max(-3, Math.min(3, score))
}

function isComplexWord(raw: string): boolean {
  const word = raw.replace(/[^a-zA-Z]/g, '')
  if (word.length >= 7) return true
  // crude syllable heuristic: count vowel groups
  const matches = word.toLowerCase().match(/[aeiouy]+/g)
  return (matches ? matches.length : 0) >= 3
}

type RecognitionType = any

type Props = {
  ownerId?: string
  conversationId?: string
  onConversationCreated?: (id: string) => void
}

export default function ConversationMap({ ownerId, conversationId, onConversationCreated }: Props): React.JSX.Element {
  const [isListening, setIsListening] = useState(false)
  const [liveText, setLiveText] = useState('')
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const transcriptBufferRef = useRef('')
  const recognitionRef = useRef<RecognitionType | null>(null)
  const intervalRef = useRef<number | null>(null)
  const lastLabelRef = useRef<string | null>(null)

  // Pan/zoom state
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragLastRef = useRef<{ x: number; y: number } | null>(null)

  const hasSpeechRecognition = useMemo(() => {
    const w = window as unknown as { webkitSpeechRecognition?: unknown; SpeechRecognition?: unknown }
    return Boolean(w.webkitSpeechRecognition || w.SpeechRecognition)
  }, [])

  useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current)
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch {}
      }
    }
  }, [])

  useEffect(() => {
    lastLabelRef.current = nodes.length ? nodes[nodes.length - 1].label : null
  }, [nodes])

  // Load nodes when a conversationId is provided from outside
  useEffect(() => {
    let isMounted = true
    if (!conversationId) { if (isMounted) { setActiveConversationId(null); setNodes([]) } return }
    ;(async () => {
      try {
        const saved = await getConversationNodes(conversationId)
        if (!isMounted) return
        setActiveConversationId(conversationId)
        setNodes(saved.map((n) => ({ id: n.id ?? `${n.index}`, label: n.label, branchLevel: n.branchLevel })))
      } catch {
        if (isMounted) { setActiveConversationId(conversationId); setNodes([]) }
      }
    })()
    return () => { isMounted = false }
  }, [conversationId])

  function startListening(): void {
    if (!hasSpeechRecognition) return
    const w = window as unknown as { webkitSpeechRecognition?: any; SpeechRecognition?: any }
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition
    const recognition: any = new SR()
    recognition.lang = 'en-US'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: any) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i]
        if (r.isFinal) {
          transcriptBufferRef.current += ' ' + r[0].transcript
        } else {
          interim += r[0].transcript
        }
      }
      setLiveText(interim.trim())
    }
    recognition.onerror = () => {
      // Basic auto-recovery for mic glitches
      try { recognition.stop() } catch {}
      setIsListening(false)
    }
    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    try { recognition.start() } catch {}
    setIsListening(true)

    // 15s cycle for summarization and plotting
    if (intervalRef.current) window.clearInterval(intervalRef.current)
    intervalRef.current = window.setInterval(async () => {
      const chunk = transcriptBufferRef.current.trim()
      transcriptBufferRef.current = ''
      if (!chunk) return

      try {
        const resp = await fetch('/api/analyze-chunk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: chunk, previousSummary: lastLabelRef.current }),
        })
        if (!resp.ok) throw new Error('Bad response')
        const data: { summary: string; isOnTrack: boolean } = await resp.json()
        const direction: Direction = data.isOnTrack ? 'down' : 'branch'
        const label = data.summary || simpleSummarize(chunk)

        setNodes((prev) => {
          const last = prev[prev.length - 1]
          let branchLevel = 0
          if (direction === 'branch') {
            branchLevel = last && last.branchLevel > 0 ? last.branchLevel : 1
          } else {
            branchLevel = 0
          }
          const next = [...prev, { id: generateId(), label, branchLevel }]
          // Persist node if we have an active conversation and ownerId
          const convId = activeConversationId
          if (convId) {
            const index = next.length - 1
            appendNode(convId, { label, branchLevel, index }).catch(() => {})
          }
          return next
        })
      } catch {
        // Fallback to local heuristic if API fails
        const direction = simpleClassifyDirection(chunk)
        const summary = simpleSummarize(chunk)
        setNodes((prev) => {
          const last = prev[prev.length - 1]
          let branchLevel = 0
          if (direction === 'branch') {
            branchLevel = last && last.branchLevel > 0 ? last.branchLevel : 1
          } else {
            branchLevel = 0
          }
          const next = [...prev, { id: generateId(), label: summary, branchLevel }]
          const convId = activeConversationId
          if (convId) {
            const index = next.length - 1
            appendNode(convId, { label: summary, branchLevel, index }).catch(() => {})
          }
          return next
        })
      }
    }, 15000)

    // Create a new conversation if none is selected and we have an owner
    if (!activeConversationId && ownerId) {
      const initial = lastLabelRef.current ?? ''
      createConversation(ownerId, initial || undefined)
        .then((id) => {
          setActiveConversationId(id)
          if (onConversationCreated) onConversationCreated(id)
        })
        .catch(() => {})
    }
  }

  function stopListening(): void {
    if (intervalRef.current) window.clearInterval(intervalRef.current)
    intervalRef.current = null
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
      recognitionRef.current = null
    }
    setIsListening(false)

    // Finalize conversation title with all labels
    if (activeConversationId && nodes.length) {
      const labels = nodes.map((n) => n.label)
      finalizeConversation(activeConversationId, labels).catch(() => {})
    }
  }

  // Layout calc
  const rectWidth = 240
  const rectHeight = 48
  const vGap = 90
  const hOffset = 180
  const baseX = 80
  const baseY = 60

  type PositionedNode = GraphNode & { x: number; y: number }
  const positionedNodes: PositionedNode[] = useMemo(() => {
    return nodes.map((n, idx) => ({
      ...n,
      x: baseX + n.branchLevel * hOffset,
      y: baseY + idx * vGap,
    }))
  }, [nodes])

  type Segment = { x1: number; y1: number; x2: number; y2: number }
  const segments: Segment[] = useMemo(() => {
    const segs: Segment[] = []
    for (let i = 1; i < positionedNodes.length; i++) {
      const prev = positionedNodes[i - 1]
      const curr = positionedNodes[i]
      const prevCx = prev.x + rectWidth / 2
      const prevCy = prev.y + rectHeight / 2
      const currCx = curr.x + rectWidth / 2
      const currCy = curr.y + rectHeight / 2
      if (curr.x === prev.x) {
        // straight down
        segs.push({ x1: prevCx, y1: prevCy, x2: currCx, y2: currCy })
      } else {
        // branch: vertical first, then horizontal right
        segs.push({ x1: prevCx, y1: prevCy, x2: prevCx, y2: currCy })
        segs.push({ x1: prevCx, y1: currCy, x2: currCx, y2: currCy })
      }
    }
    return segs
  }, [positionedNodes])

  const viewBoxWidth = 800
  const viewBoxHeight = Math.max(500, baseY + positionedNodes.length * vGap + 120)

  return (
    <div className={`cg-canvas${dragging ? ' dragging' : ''}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        width="100%"
        height="100%"
        aria-hidden="true"
        onMouseDown={(e) => {
          setDragging(true)
          dragLastRef.current = { x: e.clientX, y: e.clientY }
        }}
        onMouseMove={(e) => {
          if (!dragging || !dragLastRef.current) return
          const dx = e.clientX - dragLastRef.current.x
          const dy = e.clientY - dragLastRef.current.y
          setTranslate((t) => ({ x: t.x + dx, y: t.y + dy }))
          dragLastRef.current = { x: e.clientX, y: e.clientY }
        }}
        onMouseUp={() => { setDragging(false); dragLastRef.current = null }}
        onMouseLeave={() => { setDragging(false); dragLastRef.current = null }}
        onWheel={(e) => {
          e.preventDefault()
          const delta = -Math.sign(e.deltaY) * 0.1
          const newScale = Math.min(3, Math.max(0.5, scale + delta))
          if (newScale === scale || !svgRef.current) { setScale(newScale); return }
          const rect = svgRef.current.getBoundingClientRect()
          const px = e.clientX - rect.left
          const py = e.clientY - rect.top
          const worldX = (px - translate.x) / scale
          const worldY = (py - translate.y) / scale
          const newTranslateX = px - worldX * newScale
          const newTranslateY = py - worldY * newScale
          setScale(newScale)
          setTranslate({ x: newTranslateX, y: newTranslateY })
        }}
      >
        <g transform={`translate(${translate.x}, ${translate.y}) scale(${scale})`}>
          {/* connectors */}
          <g stroke="#9ca3af" strokeWidth="2" strokeDasharray="6 6">
            {segments.map((s, i) => (
              <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} />
            ))}
          </g>
          {/* nodes */}
          <g>
            {positionedNodes.map((n) => (
              <g key={n.id}>
                <rect
                  x={n.x}
                  y={n.y}
                  rx={12}
                  ry={12}
                  width={rectWidth}
                  height={rectHeight}
                  fill="rgba(236,72,153,0.15)"
                  stroke="#f472b6"
                />
                <text x={n.x + rectWidth / 2} y={n.y + rectHeight / 2 + 5} textAnchor="middle" fill="#e5e7eb" fontSize="14">
                  {n.label}
                </text>
              </g>
            ))}
          </g>
        </g>
      </svg>

      <div className="live-transcript">
        <div className="lt-head">
          <span>Live Transcription</span>
          <div className="lt-controls">
            {!isListening ? (
              <button className="icon-btn" onClick={startListening} disabled={!hasSpeechRecognition} aria-label="Start listening">
                <Mic size={18} />
              </button>
            ) : (
              <button className="secondary" onClick={stopListening}>Stop</button>
            )}
          </div>
        </div>
        <div className="lt-body">
          {(() => {
            const parts = liveText.match(/\w+|[^\w\s]+|\s+/g) || []
            let lastWordIndex = -1
            for (let i = parts.length - 1; i >= 0; i--) {
              if (/\w+/.test(parts[i])) { lastWordIndex = i; break }
            }
            return parts.map((part, idx) => {
              const isWord = /\w+/.test(part)
              if (!isWord) return <span key={idx}>{part}</span>
              const s = scoreWord(part)
              let cls = 'lt-token'
              if (idx === lastWordIndex) cls += ' pop'
              if (s >= 2) cls += ' pos s3'
              else if (s === 1) cls += ' pos s2'
              else if (s <= -2) cls += ' neg s3'
              else if (s === -1) cls += ' neg s2'
              if (isComplexWord(part)) cls += ' long'
              return <span key={idx} className={cls}>{part}</span>
            })
          })()}
        </div>
        {!hasSpeechRecognition && (
          <div className="form-error" style={{ marginTop: 10 }}>
            Speech recognition not supported in this browser. Replace with cloud STT.
          </div>
        )}
      </div>
    </div>
  )
}


