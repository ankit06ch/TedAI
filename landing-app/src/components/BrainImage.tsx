import React from 'react'

type Props = {
  src?: string
  alt?: string
}

export default function BrainImage({ 
  src = "/2.png", 
  alt = "Center visual" 
}: Props): React.JSX.Element {
  return (
    <div className="card center-image">
      <div className="brain-wrap">
        <img src={src} alt={alt} />
        <div className="heatmap" aria-hidden="true">
          <span className="heat-blob red b1"></span>
          <span className="heat-blob green b2"></span>
          <span className="heat-blob blue b3"></span>
          <span className="heat-blob red b4"></span>
          <span className="heat-blob green b5"></span>
          <span className="heat-blob blue b6"></span>
        </div>
      </div>
    </div>
  )
}
