import React, { useCallback, useMemo, useState, useEffect } from 'react'

type Props = {
  src?: string
  alt?: string
  speechTrigger?: number
}

export default function BrainImage({ 
  src = "/2.png", 
  alt = "Center visual",
  speechTrigger = 0
}: Props): React.JSX.Element {
  type Band = 'alpha' | 'beta' | 'gamma'

  const [activeBand, setActiveBand] = useState<Band>('alpha')

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

  const blobGradients = useMemo(() => {
    // Two of each color to ensure alternation potential, then shuffle
    const palette: [number, number, number][] = [RED, RED, GREEN, GREEN, BLUE, BLUE]
    shuffleInPlace(palette)
    return palette.map(makeGradient)
    // Recompute whenever the band changes to randomize
  }, [activeBand, makeGradient])

  const bands: Band[] = ['alpha', 'beta', 'gamma']

  const metrics = useMemo(() => {
    // Generate four random decimals between 0.0 and 5.0
    const r = () => Math.random() * 5
    return {
      tl: r(),
      tr: r(),
      bl: r(),
      br: r(),
    }
  }, [activeBand, speechTrigger])

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
            <span className="bm-value" style={{ color: colorForValue(metrics.tl) }}>{metrics.tl.toFixed(1)}</span>
            <div className="bm-label">{brainRegions.tl.name}</div>
            <div className="bm-description">{brainRegions.tl.description}</div>
          </div>
          <div className="bm-container tr">
            <span className="bm-value" style={{ color: colorForValue(metrics.tr) }}>{metrics.tr.toFixed(1)}</span>
            <div className="bm-label">{brainRegions.tr.name}</div>
            <div className="bm-description">{brainRegions.tr.description}</div>
          </div>
          <div className="bm-container bl">
            <span className="bm-value" style={{ color: colorForValue(metrics.bl) }}>{metrics.bl.toFixed(1)}</span>
            <div className="bm-label">{brainRegions.bl.name}</div>
            <div className="bm-description">{brainRegions.bl.description}</div>
          </div>
          <div className="bm-container br">
            <span className="bm-value" style={{ color: colorForValue(metrics.br) }}>{metrics.br.toFixed(1)}</span>
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
              onClick={() => setActiveBand(b)}
            >
              {b}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
