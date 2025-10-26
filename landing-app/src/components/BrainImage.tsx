import React, { useCallback, useMemo, useState, useEffect } from 'react'
import { Search } from 'lucide-react'

type Props = {
  src?: string
  alt?: string
  speechTrigger?: number
  activeBand?: 'alpha' | 'beta' | 'gamma' | undefined
  onBandChange?: (band: 'alpha' | 'beta' | 'gamma') => void
  isClassifying?: boolean
  onClassify?: () => void
  canClassify?: boolean
  classificationConfidence?: number
}

export default function BrainImage({ 
  src = "/2.png", 
  alt = "Center visual",
  speechTrigger = 0,
  activeBand: externalActiveBand,
  onBandChange,
  isClassifying = false,
  onClassify,
  canClassify = false,
  classificationConfidence = 0
}: Props): React.JSX.Element {
  type Band = 'alpha' | 'beta' | 'gamma'

  const [internalActiveBand, setInternalActiveBand] = useState<Band | undefined>(undefined)
  
  // If external band is undefined, force internal to also be undefined
  useEffect(() => {
    if (externalActiveBand === undefined) {
      setInternalActiveBand(undefined)
    }
  }, [externalActiveBand])
  
  // Use external band if provided, otherwise use internal state
  const activeBand = externalActiveBand !== undefined ? externalActiveBand : internalActiveBand

  const RED: [number, number, number] = [200, 83, 51]
  const GREEN: [number, number, number] = [143, 234, 97]
  const BLUE: [number, number, number] = [37, 26, 161]

  const makeGradient = useCallback((rgb: [number, number, number]) => {
    const [r, g, b] = rgb
    return `radial-gradient(circle at 50% 50%, rgba(${r},${g},${b},1) 0%, rgba(${r},${g},${b},0.92) 38%, rgba(${r},${g},${b},0) 64%)`
  }, [])

  function shuffleInPlace<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }

  const bands: Band[] = ['alpha', 'beta', 'gamma']

  const metrics = useMemo(() => {
    // If no classification has been done, show no values
    if (classificationConfidence === 0) {
      return {
        tl: null,
        tr: null,
        bl: null,
        br: null,
      }
    }

    // Generate values based on classification confidence and brain wave type
    const baseValue = classificationConfidence * 5 // Convert 0-1 confidence to 0-5 scale
    
    // Add some variation based on brain wave type
    const variation = () => (Math.random() - 0.5) * 0.8 // ±0.4 variation
    
    // Different regions get different base values based on brain wave type
    let regionValues = { tl: 0, tr: 0, bl: 0, br: 0 }
    
    if (activeBand === 'alpha') {
      // Alpha: More activity in temporal and occipital regions (relaxed, creative)
      regionValues = {
        tl: baseValue * 0.7 + variation(), // Prefrontal - lower
        tr: baseValue * 0.6 + variation(), // Motor - lower
        bl: baseValue * 1.2 + variation(), // Temporal - higher
        br: baseValue * 1.1 + variation(), // Occipital - higher
      }
    } else if (activeBand === 'beta') {
      // Beta: More activity in prefrontal and motor regions (focused, active)
      regionValues = {
        tl: baseValue * 1.3 + variation(), // Prefrontal - higher
        tr: baseValue * 1.2 + variation(), // Motor - higher
        bl: baseValue * 0.8 + variation(), // Temporal - moderate
        br: baseValue * 0.7 + variation(), // Occipital - lower
      }
    } else if (activeBand === 'gamma') {
      // Gamma: High activity across all regions (peak performance)
      regionValues = {
        tl: baseValue * 1.1 + variation(), // Prefrontal - high
        tr: baseValue * 1.0 + variation(), // Motor - high
        bl: baseValue * 1.1 + variation(), // Temporal - high
        br: baseValue * 1.0 + variation(), // Occipital - high
      }
    } else {
      // No band selected - show baseline activity
      regionValues = {
        tl: 0,
        tr: 0,
        bl: 0,
        br: 0,
      }
    }

    // Ensure values stay within 0-5 range
    return {
      tl: Math.max(0, Math.min(5, regionValues.tl)),
      tr: Math.max(0, Math.min(5, regionValues.tr)),
      bl: Math.max(0, Math.min(5, regionValues.bl)),
      br: Math.max(0, Math.min(5, regionValues.br)),
    }
  }, [activeBand, speechTrigger, classificationConfidence])

  const blobGradients = useMemo(() => {
    // If no classification has been done, show no color
    if (classificationConfidence === 0) {
      return Array(6).fill('transparent')
    }
    
    // Map each blob to a brain region and use the region's value for color
    const regionValues = [metrics.tl, metrics.tr, metrics.bl, metrics.br, metrics.tl, metrics.tr]
    return regionValues.map(value => {
      if (value === null) return 'transparent'
      
      // Use the same color calculation as the numbers
      const t = Math.max(0, Math.min(1, value / 5))
      const blue: [number, number, number] = BLUE
      const green: [number, number, number] = [143, 234, 97]
      const yellow: [number, number, number] = [255, 215, 0]
      const red: [number, number, number] = RED
      
      let c0: [number, number, number]
      let c1: [number, number, number]
      let localT: number
      
      if (t <= 1/3) {
        c0 = blue; c1 = green; localT = t / (1/3)
      } else if (t <= 2/3) {
        c0 = green; c1 = yellow; localT = (t - 1/3) / (1/3)
      } else {
        c0 = yellow; c1 = red;
        const raw = (t - 2/3) / (1/3)
        localT = Math.pow(Math.max(0, Math.min(1, raw)), 0.75)
      }
      
      const r = Math.round(c0[0] + (c1[0] - c0[0]) * localT)
      const g = Math.round(c0[1] + (c1[1] - c0[1]) * localT)
      const b = Math.round(c0[2] + (c1[2] - c0[2]) * localT)
      
      return makeGradient([r, g, b] as [number, number, number])
    })
  }, [activeBand, makeGradient, classificationConfidence, metrics])

  const brainRegions = {
    tl: { name: 'Prefrontal Cortex', description: 'Executive function, decision making' },
    tr: { name: 'Motor Cortex', description: 'Movement control, coordination' },
    bl: { name: 'Temporal Lobe', description: 'Memory, language processing' },
    br: { name: 'Occipital Lobe', description: 'Visual processing, perception' }
  }

  // Map 0..5 to blue->green->yellow->red gradient (blue at 0, red at 5)
  const colorForValue = useCallback((value: number) => {
    const t = Math.max(0, Math.min(1, value / 5))
    // Define key colors
    const blue: [number, number, number] = BLUE
    const green: [number, number, number] = [143, 234, 97]
    const yellow: [number, number, number] = [255, 215, 0]
    const red: [number, number, number] = RED
    // Piecewise interpolate across 3 segments: [0,1/3] blue->green, (1/3,2/3] green->yellow, (2/3,1] yellow->red
    let c0: [number, number, number]
    let c1: [number, number, number]
    let localT: number
    if (t <= 1/3) {
      c0 = blue; c1 = green; localT = t / (1/3)
    } else if (t <= 2/3) {
      c0 = green; c1 = yellow; localT = (t - 1/3) / (1/3)
    } else {
      c0 = yellow; c1 = red;
      // ease-in toward red to bias more red near the end
      const raw = (t - 2/3) / (1/3)
      localT = Math.pow(Math.max(0, Math.min(1, raw)), 0.75)
    }
    const r = Math.round(c0[0] + (c1[0] - c0[0]) * localT)
    const g = Math.round(c0[1] + (c1[1] - c0[1]) * localT)
    const b = Math.round(c0[2] + (c1[2] - c0[2]) * localT)
    return `rgb(${r}, ${g}, ${b})`
  }, [])

  return (
    <div className="card center-image">
      <div className="brain-wrap">
        <div className="bam-title">Brain Activation Map</div>
        <img src={src} alt={alt} />
        <div className="heatmap" aria-hidden="true">
          <span className="heat-blob b1" style={{ background: blobGradients[0] }}></span>
          <span className="heat-blob b2" style={{ background: blobGradients[1] }}></span>
          <span className="heat-blob b3" style={{ background: blobGradients[2] }}></span>
          <span className="heat-blob b4" style={{ background: blobGradients[3] }}></span>
          <span className="heat-blob b5" style={{ background: blobGradients[4] }}></span>
          <span className="heat-blob b6" style={{ background: blobGradients[5] }}></span>
        </div>
        <div className="band-metrics" aria-hidden="true">
          <div className="bm-container tl">
            <span className="bm-value" style={{ color: metrics.tl !== null ? colorForValue(metrics.tl) : '#6b7280' }}>
              {metrics.tl !== null ? metrics.tl.toFixed(1) : '--'}
            </span>
            <div className="bm-label">{brainRegions.tl.name}</div>
            <div className="bm-description">{brainRegions.tl.description}</div>
          </div>
          <div className="bm-container tr">
            <span className="bm-value" style={{ color: metrics.tr !== null ? colorForValue(metrics.tr) : '#6b7280' }}>
              {metrics.tr !== null ? metrics.tr.toFixed(1) : '--'}
            </span>
            <div className="bm-label">{brainRegions.tr.name}</div>
            <div className="bm-description">{brainRegions.tr.description}</div>
          </div>
          <div className="bm-container bl">
            <span className="bm-value" style={{ color: metrics.bl !== null ? colorForValue(metrics.bl) : '#6b7280' }}>
              {metrics.bl !== null ? metrics.bl.toFixed(1) : '--'}
            </span>
            <div className="bm-label">{brainRegions.bl.name}</div>
            <div className="bm-description">{brainRegions.bl.description}</div>
          </div>
          <div className="bm-container br">
            <span className="bm-value" style={{ color: metrics.br !== null ? colorForValue(metrics.br) : '#6b7280' }}>
              {metrics.br !== null ? metrics.br.toFixed(1) : '--'}
            </span>
            <div className="bm-label">{brainRegions.br.name}</div>
            <div className="bm-description">{brainRegions.br.description}</div>
          </div>
        </div>
        <div className="bam-legend" aria-hidden="true">
          <span className="l-min">0.0</span>
          <i className="l-bar" />
          <span className="l-max">5.0</span>
        </div>
        <div className="band-controls" role="group" aria-label="Brainwave bands">
          {bands.map((b) => (
            <button
              key={b}
              type="button"
              className={`band-btn${activeBand === b ? ' active' : ''}`}
              onClick={() => {
                onBandChange?.(b)
              }}
            >
              {b}
            </button>
          ))}
          {onClassify && (
            <button 
              className={`band-btn classify-band-btn${isClassifying ? ' active' : ''}`}
              onClick={onClassify}
              title="Classify conversation brain wave"
              disabled={!canClassify || isClassifying}
            >
              <Search size={16} />
            </button>
          )}
        </div>
        {isClassifying && (
          <div className="classifying-message">
            <div className="classifying-text">Classifying...</div>
          </div>
        )}
      </div>
    </div>
  )
}
