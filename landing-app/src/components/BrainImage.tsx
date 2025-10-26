import React, { useCallback, useMemo, useState } from 'react'

type Props = {
  src?: string
  alt?: string
}

export default function BrainImage({ 
  src = "/2.png", 
  alt = "Center visual" 
}: Props): React.JSX.Element {
  type Band = 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma'

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

  const bands: Band[] = ['delta', 'theta', 'alpha', 'beta', 'gamma']

  const metrics = useMemo(() => {
    // Generate four random decimals between 0.0 and 5.0
    const r = () => Math.random() * 5
    return {
      tl: r(),
      tr: r(),
      bl: r(),
      br: r(),
    }
  }, [activeBand])

  // Map 0..5 to blue->red gradient (blue at 0, red at 5)
  const colorForValue = useCallback((value: number) => {
    const t = Math.max(0, Math.min(1, value / 5))
    const [br, bg, bb] = BLUE
    const [rr, rg, rb] = RED
    const r = Math.round(br + (rr - br) * t)
    const g = Math.round(bg + (rg - bg) * t)
    const b = Math.round(bb + (rb - bb) * t)
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
          <span className="bm tl" style={{ color: colorForValue(metrics.tl) }}>{metrics.tl.toFixed(1)}</span>
          <span className="bm tr" style={{ color: colorForValue(metrics.tr) }}>{metrics.tr.toFixed(1)}</span>
          <span className="bm bl" style={{ color: colorForValue(metrics.bl) }}>{metrics.bl.toFixed(1)}</span>
          <span className="bm br" style={{ color: colorForValue(metrics.br) }}>{metrics.br.toFixed(1)}</span>
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
